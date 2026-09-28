#!/usr/bin/env node
// Applies a temporary version override to the workspace for the compat
// matrix workflow (#515). It edits `pnpm-workspace.yaml`'s `overrides:` map
// in place so `pnpm install` forces every importer (including the toolkit's
// own auto-installed peers, which `pnpm add --filter` cannot reach) to
// resolve the given package to the given version. Run this only inside a
// CI job's ephemeral checkout: the edit is never meant to be committed.
//
// Usage: node compat-matrix-override.mjs "<pkg>@<spec>" ["<pkg>@<spec>" ...]
// `<spec>` is an exact version ("6.3.0"), used as-is, or a semver range
// (">=22.0.0 <23.0.0"), resolved to the highest published version in that
// range via `npm view` before it is written to the override.
//
// Prints each resolved "pkg=version" pair, one per line, and — when run in
// a GitHub Actions job — appends `resolved=pkg1=version1,pkg2=version2` to
// $GITHUB_OUTPUT so a later guard step can verify what actually installed.

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const RANGE_CHARS = /[<>^~\s|]/;

function resolveVersion(pkg, spec) {
  if (!RANGE_CHARS.test(spec)) {
    return spec;
  }
  const raw = execFileSync(
    'npm',
    ['view', `${pkg}@${spec}`, 'version', '--json'],
    { encoding: 'utf8' },
  );
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed.at(-1) : parsed;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: compat-matrix-override.mjs "<pkg>@<spec>" ...');
  process.exit(1);
}

const pairs = args.map((rawArg) => {
  const arg = rawArg.trim();
  const at = arg.lastIndexOf('@');
  if (at <= 0) {
    throw new Error(`Cannot parse "${arg}" as "<pkg>@<spec>"`);
  }
  const pkg = arg.slice(0, at);
  const spec = arg.slice(at + 1);
  const version = resolveVersion(pkg, spec);
  console.log(`${pkg}@${spec} -> ${version}`);
  return { pkg, version };
});

const workspacePath = 'pnpm-workspace.yaml';
const original = readFileSync(workspacePath, 'utf8');
const marker = 'overrides:\n';
const insertAt = original.indexOf(marker);
if (insertAt === -1) {
  throw new Error(`Could not find "${marker}" in ${workspacePath}`);
}
const insertion = pairs
  .map(({ pkg, version }) => `  '${pkg}': '${version}'\n`)
  .join('');
const updated =
  original.slice(0, insertAt + marker.length) +
  insertion +
  original.slice(insertAt + marker.length);
writeFileSync(workspacePath, updated);

const githubOutput = process.env.GITHUB_OUTPUT;
if (githubOutput) {
  const resolved = pairs
    .map(({ pkg, version }) => `${pkg}=${version}`)
    .join(',');
  appendFileSync(githubOutput, `resolved=${resolved}\n`);
}
