#!/usr/bin/env node
// Runs `size-limit --json` against the built toolkit (config:
// `packages/toolkit/.size-limit.cjs`) and renders the result as a Markdown
// table, so a size-budget change is visible directly in the PR instead of
// only in a CI log (#514 asks for the size change to be reported in the
// PR). Wired as the `pnpm nx run toolkit:check-size` command; `.github/workflows/ci.yml`
// also appends this script's stdout to `$GITHUB_STEP_SUMMARY`.
//
// Exits non-zero (after printing the table) when any entry exceeds its
// budget, so this fully replaces running the plain `size-limit` CLI as the
// enforcement mechanism - there is only one source of truth for pass/fail.

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const toolkitDir = resolve(import.meta.dirname, '..');

/**
 * @typedef {{ name: string, passed: boolean, size: number, sizeLimit: number }} SizeLimitResult
 */

/**
 * `size-limit`'s own CLI reports brotli size in 1000-based KB (e.g. a
 * `sizeLimit` of `"1.5 KB"` in `.size-limit.cjs` becomes exactly `1500` here,
 * not `1536`), so this formatter matches that base.
 *
 * @param {number} bytes
 * @returns {string}
 */
function formatKB(bytes) {
  return `${(bytes / 1000).toFixed(2)} KB`;
}

/**
 * @param {readonly SizeLimitResult[]} results
 * @returns {string}
 */
export function formatSizeLimitMarkdownTable(results) {
  const rows = results.map(
    (result) =>
      `| ${result.passed ? '✅' : '❌'} | ${result.name} | ${formatKB(result.size)} | ${formatKB(result.sizeLimit)} |`,
  );
  return [
    '### Toolkit bundle size (brotli)',
    '',
    '|  | Entry | Size | Budget |',
    '| --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
}

function main() {
  // `size-limit` exits non-zero when a budget fails, so this must use
  // `spawnSync` (not `execFileSync`, which throws away stdout on a non-zero
  // exit unless the caller digs it out of the thrown error) - the table
  // must still print when a budget is exceeded, that's the whole point.
  const run = spawnSync('pnpm', ['exec', 'size-limit', '--json'], {
    cwd: toolkitDir,
    encoding: 'utf8',
  });
  if (run.error) {
    console.error(
      `[toolkit] ERROR: failed to run size-limit: ${run.error.message}`,
    );
    process.exit(1);
  }

  /** @type {SizeLimitResult[]} */
  let results;
  try {
    results = JSON.parse(run.stdout);
  } catch {
    console.error(
      `[toolkit] ERROR: size-limit --json did not print valid JSON:\n${run.stdout}\n${run.stderr}`,
    );
    process.exit(1);
  }

  console.log(formatSizeLimitMarkdownTable(results));
  if (results.some((result) => !result.passed)) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
