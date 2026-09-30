#!/usr/bin/env node
// Guards the PUBLISHED surface of `@ngx-signal-forms/toolkit`: every built
// `.d.ts` in `dist/packages/toolkit/types/` (public entry points AND the
// build-time-only `/core` entry — see below), and the list of files
// `npm pack` would put in the tarball.
//
// Neither check existed before #514: `packages/toolkit/scripts/packaging.spec.ts`
// reads only checked-in source (peer ranges, the `ng-package.json` shape),
// never `dist/`. An export added or removed by accident, or a stray file
// that slips into the tarball, showed up only in code review.
//
// Why every `.d.ts`, not just the ones in the published `exports` map: the
// root entry (`types/ngx-signal-forms-toolkit.d.ts`) is a one-line
// re-export from `./ngx-signal-forms-toolkit-core.js` (see
// `packages/toolkit/index.ts`'s own header for why). The real declarations
// live in `ngx-signal-forms-toolkit-core.d.ts`, which `strip-internal-exports.mjs`
// deletes from the published `exports` map but still ships as a loose file,
// because every published entry imports its types via a relative specifier.
// A change there can break every consumer without the root `.d.ts` ever
// changing - #551 adding a required `hideHintOnError` member to
// `NgxSignalFormsConfig` is exactly this: a breaking change invisible to a
// guard that only reads the published entry points. So `core`'s `.d.ts` is
// snapshotted too, under the name `core.internal` (see `internalName`
// below), which keeps it out of `publishedEntries()` (nothing published
// imports `@ngx-signal-forms/toolkit/core` by name) while still diffing its
// content.
//
// This script snapshots both into `packages/toolkit/api-reports/` and
// diffs a fresh build against that baseline:
//   - `<entry>.d.ts` - the built declaration file for each entry, public or
//     internal.
//   - `tarball-manifest.json` - the sorted list of file paths `npm pack`
//     would publish (paths only, not sizes - `.size-limit.cjs` already
//     guards size, and pinning exact byte counts here would fail on every
//     source change instead of only on a structural one).
//
// Run after `toolkit:build` (`nx run toolkit:check-published-package`).
// `--update` regenerates the baseline; the default `--check` mode compares
// against it and exits non-zero with an actionable message (a capped
// unified diff per changed file) on drift.

import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, posix, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { isRelativeLink, mapReadmeLinks } from './generate-readme.mjs';

const TOOLKIT_ENTRY_PREFIX = 'ngx-signal-forms-toolkit';

/**
 * Converts an `exports` map key to a filesystem-safe baseline file name:
 * the primary entry `"."` becomes `index`, `"./form-field"` becomes
 * `form-field`, etc.
 *
 * @param {string} exportKey
 * @returns {string}
 */
export function entryNameFor(exportKey) {
  return exportKey === '.' ? 'index' : exportKey.replace(/^\.\//, '');
}

/**
 * Derives a baseline entry name from a `types/*.d.ts` file's basename, using
 * the same `ngx-signal-forms-toolkit[-<entry>].d.ts` convention ng-packagr
 * names every entry's bundle with: `ngx-signal-forms-toolkit.d.ts` -> `index`,
 * `ngx-signal-forms-toolkit-vest.d.ts` -> `vest`.
 *
 * @param {string} fileName
 * @returns {string}
 */
function baseEntryNameFromFileName(fileName) {
  const stem = fileName.replace(/\.d\.ts$/, '');
  if (stem === TOOLKIT_ENTRY_PREFIX) return 'index';
  if (stem.startsWith(`${TOOLKIT_ENTRY_PREFIX}-`)) {
    return stem.slice(TOOLKIT_ENTRY_PREFIX.length + 1);
  }
  return stem;
}

/**
 * Reads the built `dist/packages/toolkit/package.json` and returns the
 * published entry points as `{ name, typesPath }`, where `typesPath` is
 * resolved relative to `distRoot`. Skips `"./package.json"`, which has no
 * `.d.ts`.
 *
 * @param {string} distRoot
 * @returns {{ name: string, typesPath: string }[]}
 */
export function publishedEntries(distRoot) {
  const pkg = JSON.parse(readFileSync(join(distRoot, 'package.json'), 'utf8'));
  return Object.entries(pkg.exports ?? {})
    .filter(([key]) => key !== './package.json')
    .map(([key, value]) => {
      const types = value?.types;
      if (typeof types !== 'string') {
        throw new TypeError(
          `dist package.json exports["${key}"] has no "types" entry`,
        );
      }
      return { name: entryNameFor(key), typesPath: types };
    })
    .toSorted((a, b) => a.name.localeCompare(b.name));
}

/**
 * A marker line separating an internal entry's explanatory header (added by
 * `writeBaseline`, only present in the committed baseline file) from the
 * byte-identical dist content it wraps. `readBaselineSurface` strips
 * everything up to and including this line before comparing, so the header
 * never shows up as a spurious diff.
 */
const INTERNAL_ENTRY_MARKER =
  '// ---8<--- byte-identical snapshot of the built .d.ts below ---8<---\n';

/**
 * @param {string} name
 * @returns {boolean}
 */
function isInternalEntryName(name) {
  return name.endsWith('.internal');
}

/**
 * Writes a decoded string value as a single-quoted TypeScript literal.
 * `JSON.stringify` escapes backslashes, line breaks and control characters
 * one character at a time; only the quotes differ, and U+2028/U+2029 need
 * their own escape (JSON leaves them raw).
 *
 * @param {string} value
 * @returns {string}
 */
function singleQuoted(value) {
  const body = value.replaceAll(/[\s\S]/gu, (char) => {
    if (char === "'") return String.raw`\'`;
    if (char === '"') return char;
    if (char === '\u2028') return String.raw`\u2028`;
    if (char === '\u2029') return String.raw`\u2029`;
    return JSON.stringify(char).slice(1, -1);
  });
  return `'${body}'`;
}

/**
 * Returns `[rank, key, text]` for a union member that is a string, number or
 * boolean literal, or `undefined` for any other member. `text` is the
 * canonical spelling written back (strings always single-quoted, so a build
 * that emitted `'a'` and one that emitted `"a"` agree).
 *
 * @param {import('typescript').TypeNode} member
 * @returns {[number, string | number, string] | undefined}
 */
function literalUnionMember(member) {
  if (!ts.isLiteralTypeNode(member)) return undefined;
  const { literal } = member;
  if (ts.isStringLiteral(literal)) {
    return [0, literal.text, singleQuoted(literal.text)];
  }
  if (ts.isNumericLiteral(literal)) {
    return [1, Number(literal.text), literal.getText()];
  }
  if (
    ts.isPrefixUnaryExpression(literal) &&
    literal.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(literal.operand)
  ) {
    return [1, -Number(literal.operand.text), `-${literal.operand.getText()}`];
  }
  if (literal.kind === ts.SyntaxKind.FalseKeyword) return [2, 0, 'false'];
  if (literal.kind === ts.SyntaxKind.TrueKeyword) return [2, 1, 'true'];
  return undefined;
}

/**
 * Sorts the members of every union made only of string, number or boolean
 * literals, and writes them with one spelling (`'a' | 'b'`). Any other union
 * is left as emitted.
 *
 * TypeScript emits union members in type-ID order, and that order depends on
 * which type the checker met first. The same source can give
 * `"error" | "warning"` from one build and `"warning" | "error"` from
 * another (#570), so the baseline must not depend on it. Applied both when
 * writing and when comparing a baseline.
 *
 * @param {string} source
 * @returns {string}
 */
export function normalizeLiteralUnions(source) {
  const sourceFile = ts.createSourceFile(
    'snapshot.d.ts',
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
  );
  /** @type {{ start: number, end: number, text: string }[]} */
  const edits = [];
  const visit = (/** @type {import('typescript').Node} */ node) => {
    if (ts.isUnionTypeNode(node)) {
      const members = node.types.map(literalUnionMember);
      // Sorting would detach a comment from the member it describes, so a
      // union with anything but `|` between its members stays as emitted.
      const plainSeparators = node.types.every(
        (type, index) =>
          index === 0 ||
          /^\s*\|\s*$/.test(
            source.slice(node.types[index - 1].end, type.getStart(sourceFile)),
          ),
      );
      if (plainSeparators && members.every((member) => member !== undefined)) {
        const sorted = members.toSorted(
          (a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0),
        );
        edits.push({
          start: node.getStart(sourceFile),
          end: node.end,
          text: sorted.map((member) => member[2]).join(' | '),
        });
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return edits
    .toSorted((a, b) => b.start - a.start)
    .reduce(
      (text, edit) =>
        text.slice(0, edit.start) + edit.text + text.slice(edit.end),
      source,
    );
}

/**
 * Reads every `.d.ts` file in the built `types/` directory - the published
 * entries AND any entry (currently only `/core`) that ships a loose `.d.ts`
 * without being in the published `exports` map. See this file's header for
 * why the latter matters. Literal unions are order-normalized (see
 * `normalizeLiteralUnions`).
 *
 * @param {string} distRoot
 * @returns {Map<string, string>} entry name -> file content
 */
export function buildApiSurfaceSnapshot(distRoot) {
  const typesDir = join(distRoot, 'types');
  const publishedByFileName = new Map(
    publishedEntries(distRoot).map((entry) => [
      entry.typesPath.replace(/^\.\//, '').replace(/^types\//, ''),
      entry.name,
    ]),
  );

  const snapshot = new Map();
  for (const fileName of readdirSync(typesDir)) {
    if (!fileName.endsWith('.d.ts')) continue;
    const publishedName = publishedByFileName.get(fileName);
    const name =
      publishedName ?? `${baseEntryNameFromFileName(fileName)}.internal`;
    snapshot.set(
      name,
      normalizeLiteralUnions(readFileSync(join(typesDir, fileName), 'utf8')),
    );
  }
  return snapshot;
}

/**
 * Runs `npm pack --dry-run --json` against the built package and returns the
 * sorted list of file paths it would publish. Uses `npm`, not `pnpm pack`,
 * because `npm pack --dry-run --json` is the documented, stable way to list
 * a tarball's contents without writing one to disk; `pnpm` does not commit
 * to the same flag/output contract. `--ignore-scripts` because this only
 * needs to list files, never execute anything the packed package declares.
 *
 * npm's own docs show `--json` printing an array of pack results, but that
 * is not the whole story: two different npm 12 installs used while building
 * this script (a bundled Node 24 npm, and the same npm invoked through a
 * local dev-tool shim) both instead printed a single object keyed by
 * package name. Accepting either shape is cheap and avoids the guard
 * breaking on a legitimate local npm install; `result?.files` is validated
 * either way, so a genuinely unexpected shape still fails loudly below.
 *
 * @param {string} distRoot
 * @returns {string[]}
 */
export function buildTarballManifest(distRoot) {
  let raw;
  try {
    raw = execFileSync(
      'npm',
      ['pack', '--dry-run', '--json', '--ignore-scripts'],
      { cwd: distRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`'npm pack --dry-run' failed in ${distRoot}: ${message}`, {
      cause: error,
    });
  }

  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `'npm pack --dry-run --json' in ${distRoot} did not print valid JSON:\n${raw.slice(0, 500)}`,
    );
  }
  const results = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object'
      ? Object.values(parsed)
      : [];
  const [result] = /** @type {{ files?: unknown }[]} */ (results);
  if (!result || !Array.isArray(result.files)) {
    throw new Error(
      `'npm pack --dry-run --json' in ${distRoot} returned an unexpected shape ` +
        `(expected an array of pack results, or an object of them, each with a ` +
        `"files" array): ${JSON.stringify(parsed).slice(0, 500)}`,
    );
  }
  return /** @type {{ path: string }[]} */ (result.files)
    .map((file) => file.path)
    .toSorted();
}

/**
 * Lists every relative link in a packed `README.md` that does not point at a
 * file in the tarball. Such a link works in the repo but is dead on npm and in
 * `node_modules`; `generate-readme.mjs` rewrites those links to absolute URLs.
 *
 * @param {string} distRoot
 * @param {string[]} manifest paths `npm pack` would publish
 * @returns {{ readme: string, target: string }[]}
 */
export function findBrokenReadmeLinks(distRoot, manifest) {
  const shipped = new Set(manifest);
  const broken = [];
  for (const readme of manifest.filter((path) =>
    /(^|\/)README\.md$/.test(path),
  )) {
    mapReadmeLinks(readFileSync(join(distRoot, readme), 'utf8'), (target) => {
      if (isRelativeLink(target)) {
        const path = target.split(/[#?]/)[0];
        const resolved = path.startsWith('/')
          ? undefined
          : posix.join(posix.dirname(readme), path);
        if (resolved === undefined || !shipped.has(resolved))
          broken.push({ readme, target });
      }
      return target;
    });
  }
  return broken;
}

/**
 * Reads a committed baseline directory back into an entry-name -> content
 * map, stripping the explanatory header `writeBaseline` prepends to an
 * internal entry so the comparison only ever sees dist-identical content.
 *
 * @param {string} baselineDir
 * @returns {Map<string, string>}
 */
export function readBaselineSurface(baselineDir) {
  const snapshot = new Map();
  if (!existsSync(baselineDir)) return snapshot;
  for (const name of readdirSync(baselineDir)) {
    if (!name.endsWith('.d.ts')) continue;
    const key = name.slice(0, -'.d.ts'.length);
    const raw = readFileSync(join(baselineDir, name), 'utf8');
    const markerIndex = raw.indexOf(INTERNAL_ENTRY_MARKER);
    const content =
      isInternalEntryName(key) && markerIndex !== -1
        ? raw.slice(markerIndex + INTERNAL_ENTRY_MARKER.length)
        : raw;
    snapshot.set(key, content);
  }
  return snapshot;
}

/**
 * @param {string} baselineDir
 * @returns {string[]}
 */
export function readBaselineTarballManifest(baselineDir) {
  const manifestPath = join(baselineDir, 'tarball-manifest.json');
  if (!existsSync(manifestPath)) return [];
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

/**
 * @typedef {{ kind: 'added' | 'removed' | 'changed', name: string }} SurfaceDiff
 */

/**
 * @param {Map<string, string>} current
 * @param {Map<string, string>} baseline
 * @returns {SurfaceDiff[]}
 */
export function diffApiSurface(current, baseline) {
  /** @type {SurfaceDiff[]} */
  const diffs = [];
  for (const [name, content] of current) {
    if (!baseline.has(name)) diffs.push({ kind: 'added', name });
    else if (baseline.get(name) !== content)
      diffs.push({ kind: 'changed', name });
  }
  for (const name of baseline.keys()) {
    if (!current.has(name)) diffs.push({ kind: 'removed', name });
  }
  return diffs.toSorted((a, b) => a.name.localeCompare(b.name));
}

/**
 * @param {string[]} current
 * @param {string[]} baseline
 * @returns {{ added: string[], removed: string[] }}
 */
export function diffTarballManifest(current, baseline) {
  const baselineSet = new Set(baseline);
  const currentSet = new Set(current);
  return {
    added: current.filter((path) => !baselineSet.has(path)),
    removed: baseline.filter((path) => !currentSet.has(path)),
  };
}

/**
 * Renders a unified diff between two text blobs using the system `diff`
 * binary (present on both the macOS/BSD and Ubuntu/GNU runners this repo's
 * CI and contributors use), capped to `maxLines` so a large `.d.ts` rewrite
 * cannot flood the CI log. Falls back to a one-line note if `diff` itself is
 * unavailable rather than failing the whole check.
 *
 * @param {string} before
 * @param {string} after
 * @param {string} label
 * @param {number} [maxLines]
 * @returns {string}
 */
export function renderCappedDiff(before, after, label, maxLines = 40) {
  let dir;
  try {
    dir = mkdtempSync(join(tmpdir(), 'check-published-package-diff-'));
    const beforePath = join(dir, 'before.d.ts');
    const afterPath = join(dir, 'after.d.ts');
    writeFileSync(beforePath, before);
    writeFileSync(afterPath, after);
    const result = spawnSync(
      'diff',
      [
        '-u',
        '-L',
        `${label} (baseline)`,
        '-L',
        `${label} (built)`,
        beforePath,
        afterPath,
      ],
      { encoding: 'utf8' },
    );
    if (result.error) throw result.error;
    const lines = result.stdout.split('\n');
    if (lines.length <= maxLines) return lines.join('\n');
    return [
      ...lines.slice(0, maxLines),
      `  ... (${lines.length - maxLines} more diff lines omitted)`,
    ].join('\n');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `  (could not render a diff: ${message})`;
  } finally {
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Explanatory header prepended to an internal entry's baseline file (see
 * `INTERNAL_ENTRY_MARKER`). Not part of the compared content.
 *
 * @param {string} name
 * @returns {string}
 */
function internalEntryHeader(name) {
  const bundleName = name.replace(/\.internal$/, '');
  return [
    '// NOT A PUBLIC ENTRY POINT.',
    '//',
    `// This is dist/packages/toolkit/types/ngx-signal-forms-toolkit-${bundleName}.d.ts,`,
    '// a build-time-only secondary entry that strip-internal-exports.mjs',
    '// deletes from the published `exports` map. Every published entry still',
    '// imports its types via a relative specifier, so a breaking change here',
    "// (see #551) can break every consumer without any published entry's own",
    '// .d.ts changing. Snapshotted here so check-published-package.mjs still',
    "// catches it. See that script's header for the full explanation.",
    '',
  ].join('\n');
}

/**
 * @param {string} baselineDir
 * @param {Map<string, string>} surface
 * @param {string[]} manifest
 */
export function writeBaseline(baselineDir, surface, manifest) {
  rmSync(baselineDir, { recursive: true, force: true });
  mkdirSync(baselineDir, { recursive: true });
  for (const [name, content] of surface) {
    const fileContent = isInternalEntryName(name)
      ? internalEntryHeader(name) + INTERNAL_ENTRY_MARKER + content
      : content;
    writeFileSync(join(baselineDir, `${name}.d.ts`), fileContent);
  }
  writeFileSync(
    join(baselineDir, 'tarball-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

const UPDATE_COMMAND = 'pnpm run check:toolkit-published-package -- --update';
const REBUILD_COMMAND = 'pnpm nx build toolkit';

function main() {
  const update = process.argv.includes('--update');
  // These two env vars exist only so the spec file can run this CLI as a
  // real subprocess against an isolated fixture dist + baseline, instead of
  // either comparing against this repo's real baseline or only exercising
  // the pure functions above. Nothing else should set them.
  const distRoot = resolve(
    process.env.CHECK_PUBLISHED_PACKAGE_DIST_ROOT ?? 'dist/packages/toolkit',
  );
  const baselineDir = resolve(
    process.env.CHECK_PUBLISHED_PACKAGE_BASELINE_DIR ??
      resolve(import.meta.dirname, '../api-reports'),
  );

  if (!existsSync(distRoot)) {
    console.error(
      `[toolkit] ERROR: ${distRoot} does not exist. Run '${REBUILD_COMMAND}' first.`,
    );
    process.exit(1);
  }

  const surface = buildApiSurfaceSnapshot(distRoot);
  const manifest = buildTarballManifest(distRoot);

  // Not a baseline diff: a broken link is wrong whatever the baseline says,
  // so this fails in `--update` mode too.
  const brokenLinks = findBrokenReadmeLinks(distRoot, manifest);
  if (brokenLinks.length > 0) {
    console.error(
      "[toolkit] ERROR: packed READMEs link to files that are not in the tarball. Rewrite them in 'scripts/generate-readme.mjs':\n",
    );
    for (const { readme, target } of brokenLinks)
      console.error(`  ${readme}: ${target}`);
    process.exit(1);
  }

  if (update) {
    writeBaseline(baselineDir, surface, manifest);
    console.log(
      `[toolkit] updated the public API + tarball baseline in ${baselineDir}. Review the diff and commit it.`,
    );
    return;
  }

  const baselineSurface = readBaselineSurface(baselineDir);
  const surfaceDiffs = diffApiSurface(surface, baselineSurface);
  const manifestDiff = diffTarballManifest(
    manifest,
    readBaselineTarballManifest(baselineDir),
  );
  const hasManifestDiff =
    manifestDiff.added.length > 0 || manifestDiff.removed.length > 0;

  if (surfaceDiffs.length === 0 && !hasManifestDiff) {
    console.log(
      '[toolkit] published API surface and tarball contents match the baseline.',
    );
    return;
  }

  console.error(
    '[toolkit] ERROR: the published package no longer matches the reviewed baseline.\n',
  );
  console.error(
    `First, make sure this reflects a real build: run '${REBUILD_COMMAND}'.\n`,
  );
  if (surfaceDiffs.length > 0) {
    console.error('Public API surface changes:');
    for (const { kind, name } of surfaceDiffs) {
      console.error(`  - ${kind}: ${name}`);
      if (kind === 'changed') {
        console.error(
          renderCappedDiff(
            baselineSurface.get(name) ?? '',
            surface.get(name) ?? '',
            name,
          ),
        );
      }
    }
    console.error('');
  }
  if (hasManifestDiff) {
    console.error('Tarball contents changes:');
    for (const path of manifestDiff.added) console.error(`  + ${path}`);
    for (const path of manifestDiff.removed) console.error(`  - ${path}`);
    console.error('');
  }
  console.error(
    `If this change is intentional, review it, then run:\n\n  ${UPDATE_COMMAND}\n\nand commit the updated files under packages/toolkit/api-reports/.`,
  );
  process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
