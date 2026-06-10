/// <reference lib="es2023" />
/// <reference types="node" />

import { mkdirSync, writeFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';

const WORKSPACE_ROOT = '.';

/**
 * axe-core tag set mapping to **WCAG 2.2 Level AA** conformance.
 *
 * WCAG is additive: 2.2 AA requires every Level A and AA criterion from 2.0,
 * 2.1 and 2.2. axe exposes one tag per version/level and groups the two new
 * 2.2 Level A criteria under `wcag22aa`, so this union is the full surface.
 *
 * Kept in lockstep with the toolkit's `WCAG_22_AA_TAGS`
 * (packages/toolkit/testing/a11y.ts) so component- and app-level scans agree.
 *
 * @see https://www.w3.org/TR/WCAG22/
 */
export const WCAG_22_AA_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
] as const;

export type WCAG_22_AA_TAG = (typeof WCAG_22_AA_TAGS)[number];

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
  await page.waitForLoadState('networkidle');

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
