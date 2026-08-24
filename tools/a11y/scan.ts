/// <reference lib="es2023" />
/// <reference types="node" />

import { mkdirSync, writeFileSync } from 'node:fs';
import { AxeBuilder } from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';
import {
  WCAG_22_AA_TAGS,
  type WCAG_22_AA_TAG,
} from '@ngx-signal-forms/toolkit/testing';

const WORKSPACE_ROOT = '.';

// Re-exported so existing `@ngx-signal-forms/a11y-testing` consumers keep
// working. The tag set itself lives in the toolkit's own public testing
// entry point (`packages/toolkit/testing/a11y.ts`) so component-level specs
// (hard fail) and these app-level baseline scans can never drift apart.
export { WCAG_22_AA_TAGS };
export type { WCAG_22_AA_TAG };

/**
 * One axe violation, flattened to the fields the baseline diff cares about.
 * `target` is the union of CSS selectors axe reported for the offending nodes,
 * sorted for a stable identity across runs.
 */
export interface A11yViolationRecord {
  route: string;
  ruleId: string;
  impact: string | null;
  help: string;
  helpUrl: string;
  target: string;
}

export interface RouteScanResult {
  app: string;
  project: string;
  route: string;
  violations: A11yViolationRecord[];
}

/**
 * Directory a given app's per-route scan results are written to. The CI report
 * script (tools/scripts/a11y-report-violations.mjs) reads from the same
 * convention.
 */
export function a11yOutputDir(app: string): string {
  return `${WORKSPACE_ROOT}/dist/.a11y/${app}`;
}

function routeSlug(route: string): string {
  const slug = route
    .replaceAll(/[^a-z0-9]+/giu, '-')
    .replaceAll(/^-+|-+$/gu, '');
  return slug.length > 0 ? slug : 'root';
}

/**
 * Produces a build-stable selector string for a violation's nodes.
 *
 * axe reports CSS selectors that include Angular's emulated-encapsulation
 * attributes (`[_ngcontent-ng-c1446688354]`, `[_nghost-ng-c…]`). Those hashes
 * change every build, so leaving them in the violation key would make every
 * run look like the old violation resolved and a new one appeared — churning
 * the baseline and spamming issues. Strip them so the key is stable across
 * builds while still pinpointing the element.
 */
function stableTarget(nodeTargets: readonly string[]): string {
  return [...nodeTargets]
    .map((selector: string) =>
      selector
        .replaceAll(/\[_ng(?:content|host)-[^\]]*\]/gu, '')
        .replaceAll(/\s+/gu, ' ')
        .trim(),
    )
    .filter((selector: string) => selector.length > 0)
    .toSorted((left: string, right: string) => left.localeCompare(right))
    .join(', ');
}

/** How long nothing may be animating before the page counts as settled. */
const ANIMATION_QUIET_MS = 250;

/**
 * Upper bound on the settle wait. An indefinite animation (a loading spinner, a
 * looping decorative effect) never goes quiet; axe is happy to audit around one,
 * so give up waiting rather than fail the scan.
 */
const ANIMATION_SETTLE_TIMEOUT_MS = 5000;

/**
 * Blocks until the Angular app has bootstrapped, rendered, and settled its web
 * fonts and entry transitions — the state an axe audit actually needs.
 *
 * This deliberately does **not** use `waitForLoadState('networkidle')`. The
 * demo apps are served by a Vite dev server, which holds a permanent HMR
 * WebSocket open. Firefox never reports the network as idle while that socket
 * is alive, so the wait would hang until the test timed out even though every
 * HTTP request had already completed (verified: 112 started, 112 finished, 0
 * in flight, still no idle event). It is a race — whether it hangs depends on
 * how fast the socket is established relative to the idle window — so it
 * failed intermittently in Firefox only, roughly one run in three. Playwright
 * documents `networkidle` as discouraged for exactly this reason.
 *
 * Settling fonts and animations matters beyond flake avoidance. `color-contrast`
 * and `target-size` are paint- and geometry-sensitive, and the demo shell fades
 * its chrome in on navigation. Auditing mid-transition reads the interpolated
 * colours — e.g. #f2f3f4 on #feffff, a contrast ratio of 1.1 — and reports
 * violations that do not exist once the transition lands. `networkidle` used to
 * mask this by taking long enough for the ~300ms of transitions to finish; that
 * was luck, not intent, so the settle is now explicit.
 */
async function waitForRenderedApp(page: Page): Promise<void> {
  // Angular stamps `ng-version` on the bootstrap root element, so this is
  // app-agnostic across the demo apps (ngx-root, app-root, …).
  await page.waitForFunction(() => {
    const root = document.querySelector('[ng-version]');
    return root !== null && root.childElementCount > 0;
  });

  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  // A quiet *window*, not a snapshot: the shell's transitions do not exist yet
  // at the moment the root first has children — they start a few milliseconds
  // later — so awaiting whatever happens to be running right now is a no-op.
  // Polling on animation frames instead catches them starting, waits them out,
  // and only proceeds once nothing has been running for QUIET_MS.
  try {
    await page.waitForFunction(
      (quietMs: number) => {
        const marked = window as Window & { a11yQuietSince?: number };
        const running = document
          .getAnimations()
          .some((animation) => animation.playState === 'running');

        if (running) {
          marked.a11yQuietSince = undefined;
          return false;
        }

        marked.a11yQuietSince ??= performance.now();
        return performance.now() - marked.a11yQuietSince >= quietMs;
      },
      ANIMATION_QUIET_MS,
      { timeout: ANIMATION_SETTLE_TIMEOUT_MS },
    );
  } catch {
    // Never quiet — audit the page as it stands rather than failing the scan.
  }
}

/**
 * Navigates to `route`, runs a WCAG 2.2 AA axe audit, writes the result to the
 * app's output dir (one file per project+route, so parallel workers never race
 * on the same file), and returns the flattened violation records.
 *
 * This helper intentionally does **not** assert on the violation count: demo
 * apps track accessibility against a committed baseline rather than hard
 * failing (the toolkit's own Vitest specs are the hard gate). The CI report
 * script diffs these files against the baseline and opens issues for new
 * findings.
 *
 * @param disableRules axe rule ids to skip for this route — use sparingly and
 *   only for violations owned by third-party UI layers, never toolkit output.
 */
export async function scanRoute(
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
  {
    page,
    testInfo,
    app,
    route,
    disableRules = [],
  }: Readonly<{
    page: Page;
    testInfo: TestInfo;
    app: string;
    route: string;
    disableRules?: readonly string[];
  }>,
): Promise<A11yViolationRecord[]> {
  await page.goto(route);
  await waitForRenderedApp(page);

  let builder = new AxeBuilder({ page }).withTags([...WCAG_22_AA_TAGS]);
  if (disableRules.length > 0) {
    builder = builder.disableRules([...disableRules]);
  }
  const results = await builder.analyze();

  const violations: A11yViolationRecord[] = [];

  for (const violation of results.violations) {
    const selectors: string[] = [];

    for (const node of violation.nodes) {
      selectors.push(...node.target.map(String));
    }

    violations.push({
      route,
      ruleId: violation.id,
      impact: violation.impact ?? null,
      help: violation.help,
      helpUrl: violation.helpUrl,
      target: stableTarget(selectors),
    });
  }

  const file = `${a11yOutputDir(app)}/${testInfo.project.name}__${routeSlug(route)}.json`;
  mkdirSync(a11yOutputDir(app), { recursive: true });
  writeFileSync(
    file,
    `${JSON.stringify(
      {
        app,
        project: testInfo.project.name,
        route,
        violations,
      } satisfies RouteScanResult,
      null,
      2,
    )}\n`,
  );

  return violations;
}
