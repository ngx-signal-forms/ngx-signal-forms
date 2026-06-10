#!/usr/bin/env node
/**
 * Accessibility baseline diff + auto-issue reporter.
 *
 * Consumes the per-route axe results written by `tools/a11y/scan.ts`
 * (dist/.a11y/<app>/<project>__<route>.json) and reconciles them against each
 * app's committed baseline (apps/<app>/a11y-baseline.json):
 *
 *   - NEW violation (in results, not in baseline)      → open a GitHub issue
 *   - RESOLVED violation (in baseline, not in results) → drop from baseline
 *
 * The baseline is then rewritten to exactly the current violation set, so the
 * file diff in a PR shows precisely what changed. Demo apps showcase the
 * toolkit and may inherit violations from page scaffolding or third-party UI
 * layers, so this is a tracking gate, not a hard fail — the toolkit's own
 * Vitest browser specs (packages/toolkit/.../*.a11y.browser.spec.ts) are the
 * hard WCAG 2.2 AA gate.
 *
 * Usage:
 *   node tools/scripts/a11y-report-violations.mjs [flags]
 *
 *   (no flags)         Report only — print the baseline diff, change nothing.
 *   --create-issues    Open a GitHub issue (via `gh`, deduped by title) for
 *                      each NEW violation. Used on push to main.
 *   --update-baseline  Rewrite each app's a11y-baseline.json to exactly the
 *                      current violation set. Run locally to accept the current
 *                      state (e.g. `pnpm a11y:baseline`).
 *   --check            Exit 1 if any NEW violations were found. Used on PRs for
 *                      visibility (the CI job is non-blocking).
 */

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const WORKSPACE_ROOT = resolve(import.meta.dirname, '../..');
const RESULTS_ROOT = join(WORKSPACE_ROOT, 'dist', '.a11y');

const args = new Set(process.argv.slice(2));
const createIssues = args.has('--create-issues');
const updateBaseline = args.has('--update-baseline');
const check = args.has('--check');

/** @typedef {{ route: string, ruleId: string, target: string, impact: string | null, help: string, helpUrl: string, browsers: string[] }} Violation */
/** @typedef {{ app?: string, project?: string, route?: string, violations?: Violation[] }} RouteScanResult */
/** @typedef {{ app?: string, violations?: Violation[] }} Baseline */

/**
 * Stable identity for a violation across runs and browsers.
 * @param {Pick<Violation, 'route' | 'ruleId' | 'target'>} v
 */
const keyOf = (v) => `${v.route}::${v.ruleId}::${v.target}`;

/** Discover apps that produced results this run. */
function discoverApps() {
  if (!existsSync(RESULTS_ROOT)) return [];
  return readdirSync(RESULTS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted();
}

/** Merge every per-route result file for an app into a keyed violation map. */
function readResults(app) {
  const dir = join(RESULTS_ROOT, app);
  /** @type {Map<string, Violation>} */
  const merged = new Map();
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    /** @type {RouteScanResult} */
    const parsed = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    const project = parsed.project ?? 'unknown';
    for (const raw of parsed.violations ?? []) {
      const key = keyOf(raw);
      const existing = merged.get(key);
      if (existing) {
        if (!existing.browsers.includes(project)) {
          existing.browsers = [...existing.browsers, project].toSorted();
        }
      } else {
        merged.set(key, {
          route: raw.route,
          ruleId: raw.ruleId,
          target: raw.target,
          impact: raw.impact ?? null,
          help: raw.help,
          helpUrl: raw.helpUrl,
          browsers: [project],
        });
      }
    }
  }
  return merged;
}

const baselinePath = (app) =>
  join(WORKSPACE_ROOT, 'apps', app, 'a11y-baseline.json');

/** @returns {Baseline} */
function readBaseline(app) {
  const path = baselinePath(app);
  if (!existsSync(path)) return { violations: [] };
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeBaseline(app, violations) {
  const path = baselinePath(app);
  const sorted = [...violations].toSorted((a, b) =>
    keyOf(a).localeCompare(keyOf(b)),
  );
  const payload = {
    $comment:
      'Known WCAG 2.2 AA axe violations for this app, keyed by route::ruleId::target. Maintained by tools/scripts/a11y-report-violations.mjs: new violations open issues and are appended; resolved ones are dropped. Empty means zero known violations.',
    app,
    violations: sorted,
  };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
}

function issueTitle(app, v) {
  return `a11y(${app}): ${v.ruleId} on ${v.route}`;
}

function issueBody(app, v) {
  return [
    `Automated WCAG 2.2 AA scan found a new accessibility violation.`,
    ``,
    `- **App:** \`${app}\``,
    `- **Route:** \`${v.route}\``,
    `- **Rule:** \`${v.ruleId}\` (${v.impact ?? 'n/a'})`,
    `- **Browsers:** ${v.browsers.join(', ')}`,
    `- **Target:** \`${v.target}\``,
    ``,
    `${v.help}`,
    ``,
    `Reference: ${v.helpUrl}`,
    ``,
    `<sub>Opened automatically by the \`a11y\` CI job. Once fixed (or accepted into the baseline), this issue can be closed.</sub>`,
  ].join('\n');
}

/** Avoid duplicate issues: returns true if an open issue with this title exists. */
function issueExists(title) {
  try {
    const out = execFileSync(
      'gh',
      [
        'issue',
        'list',
        '--state',
        'open',
        '--search',
        title,
        '--json',
        'title',
        '--limit',
        '50',
      ],
      { cwd: WORKSPACE_ROOT, encoding: 'utf8' },
    );
    const issues = JSON.parse(out);
    return issues.some((issue) => issue.title === title);
  } catch (error) {
    console.warn(`  ! could not query existing issues: ${error.message}`);
    return false;
  }
}

function createIssue(app, v) {
  const title = issueTitle(app, v);
  if (issueExists(title)) {
    console.log(`  = issue already open: ${title}`);
    return;
  }
  execFileSync(
    'gh',
    [
      'issue',
      'create',
      '--title',
      title,
      '--body',
      issueBody(app, v),
      '--label',
      'a11y',
      '--label',
      'needs-triage',
    ],
    { cwd: WORKSPACE_ROOT, encoding: 'utf8', stdio: 'inherit' },
  );
  console.log(`  + opened issue: ${title}`);
}

function main() {
  const apps = discoverApps();
  if (apps.length === 0) {
    console.log(
      `No a11y results found under ${RESULTS_ROOT}. Did the a11y target run?`,
    );
    return;
  }

  const modes = [
    createIssues && 'create-issues',
    updateBaseline && 'update-baseline',
    check && 'check',
  ].filter(Boolean);
  console.log(
    `a11y report — ${modes.length > 0 ? modes.join(', ') : 'report-only'}\n`,
  );

  let totalNew = 0;
  let totalResolved = 0;

  for (const app of apps) {
    const current = readResults(app);
    const baseline = readBaseline(app);
    const baselineKeys = new Set(
      (baseline.violations ?? []).map((v) => keyOf(v)),
    );
    const currentKeys = new Set(current.keys());

    const newOnes = [...current.values()].filter(
      (v) => !baselineKeys.has(keyOf(v)),
    );
    const resolved = (baseline.violations ?? []).filter(
      (v) => !currentKeys.has(keyOf(v)),
    );

    console.log(
      `${app}: ${current.size} current, ${newOnes.length} new, ${resolved.length} resolved`,
    );

    for (const v of newOnes) {
      console.log(
        `  NEW  [${v.impact ?? 'n/a'}] ${v.ruleId} @ ${v.route} (${v.browsers.join(', ')})`,
      );
      if (createIssues) createIssue(app, v);
    }
    for (const v of resolved) {
      console.log(`  GONE ${v.ruleId} @ ${v.route}`);
    }

    totalNew += newOnes.length;
    totalResolved += resolved.length;

    if (updateBaseline) writeBaseline(app, [...current.values()]);
  }

  console.log(
    `\nTotal: ${totalNew} new, ${totalResolved} resolved across ${apps.length} app(s).`,
  );
  if (!createIssues && !updateBaseline) {
    console.log('Report-only — no issues opened, baselines unchanged.');
  }

  if (check && totalNew > 0) {
    process.exitCode = 1;
  }
}

main();
