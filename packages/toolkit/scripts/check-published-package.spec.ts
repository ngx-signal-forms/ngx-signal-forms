import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildApiSurfaceSnapshot,
  buildTarballManifest,
  diffApiSurface,
  diffTarballManifest,
  entryNameFor,
  findBrokenReadmeLinks,
  normalizeLiteralUnions,
  publishedEntries,
  readBaselineSurface,
  readBaselineTarballManifest,
  renderCappedDiff,
  writeBaseline,
} from './check-published-package.mjs';

// Regression tests for the guard that catches an unreviewed change to the
// PUBLISHED package: an export added/removed/changed in a `.d.ts` entry
// point (published OR the build-time-only `/core` entry - see #551, a
// breaking change to a `/core`-only type that never touched the published
// `index.d.ts`), or a file added/removed from the `npm pack` tarball. Both
// slip past `packages/toolkit/scripts/packaging.spec.ts`, which only reads
// checked-in source and never opens `dist/`.

const scriptPath = resolve(
  import.meta.dirname,
  './check-published-package.mjs',
);

describe('entryNameFor', () => {
  it('maps the primary entry "." to "index"', () => {
    expect(entryNameFor('.')).toBe('index');
  });

  it('strips the leading "./" from a secondary entry', () => {
    expect(entryNameFor('./form-field')).toBe('form-field');
  });
});

describe('normalizeLiteralUnions', () => {
  // Why this exists (#570): TypeScript emits union members in type-ID order,
  // which depends on what the checker met first, so a cached and a clean
  // build can emit the same union in different orders. The baseline must not
  // fail on that.
  it('gives the same text for both member orders and both quote styles', () => {
    expect(normalizeLiteralUnions("type T = 'error' | 'warning';")).toBe(
      normalizeLiteralUnions('type T = "warning" | "error";'),
    );
    expect(normalizeLiteralUnions("type T = 'warning' | 'error';")).toBe(
      "type T = 'error' | 'warning';",
    );
  });

  it('normalizes literal unions nested in generics and readonly properties', () => {
    const emitted = (order: string) =>
      `declare class A {\n  readonly resolvedTone: Signal<${order}>;\n  readonly items: readonly (${order})[];\n}\n`;
    expect(normalizeLiteralUnions(emitted('"warning" | "error"'))).toBe(
      emitted("'error' | 'warning'"),
    );
  });

  it('sorts number and boolean literals deterministically', () => {
    expect(
      normalizeLiteralUnions("type T = true | 10 | 'b' | -1 | 2 | false;"),
    ).toBe("type T = 'b' | -1 | 2 | 10 | false | true;");
  });

  it('leaves unions that contain a non-literal member as emitted', () => {
    const source = "type T = 'b' | 'a' | Foo;\ntype U = string | null;\n";
    expect(normalizeLiteralUnions(source)).toBe(source);
  });

  it('keeps an escaped line break escaped instead of writing a raw one', () => {
    // `.text` is the decoded value: a raw newline in the output would break
    // the string literal and change the meaning of the baseline.
    const source = String.raw`type T = 'b\nx' | 'a\t' | "q'\\";`;
    const out = normalizeLiteralUnions(source);
    expect(out).toBe(String.raw`type T = 'a\t' | 'b\nx' | 'q\'\\';`);
    expect(out).not.toMatch(/[\n\t]/);
  });

  it('leaves a union with a comment between members as emitted', () => {
    // Sorting would detach the comment from the member it describes.
    const source =
      "type T = 'b' /* deprecated */ | 'a';\ntype U = 'z' // note\n | 'y';\n";
    expect(normalizeLiteralUnions(source)).toBe(source);
  });

  it('does not touch string literals outside a union', () => {
    const source = "declare const x: 'b';\n// 'b' | 'a' in a comment\n";
    expect(normalizeLiteralUnions(source)).toBe(source);
  });
});

describe('publishedEntries + buildApiSurfaceSnapshot', () => {
  let distRoot: string | undefined;

  afterEach(() => {
    if (distRoot !== undefined)
      rmSync(distRoot, { recursive: true, force: true });
  });

  it('reads only the entries in the exports map, skipping "./package.json"', async () => {
    distRoot = mkdtempSync(join(tmpdir(), 'check-published-package-'));
    await mkdir(join(distRoot, 'types'), { recursive: true });
    writeFileSync(
      join(distRoot, 'types/index.d.ts'),
      'export declare const a: 1;\n',
    );
    writeFileSync(
      join(distRoot, 'types/form-field.d.ts'),
      'export declare const b: 2;\n',
    );
    writeFileSync(
      join(distRoot, 'package.json'),
      JSON.stringify({
        exports: {
          './package.json': { default: './package.json' },
          '.': { types: './types/index.d.ts', default: './fesm2022/index.mjs' },
          './form-field': {
            types: './types/form-field.d.ts',
            default: './fesm2022/form-field.mjs',
          },
        },
      }),
    );

    // This is the regression this test guards: a published entry point is
    // only found because it is a key in `dist/package.json`'s `exports`
    // map, the ONLY source of truth for what a consumer can import — not a
    // hand-maintained list in this script that could drift from it.
    expect(publishedEntries(distRoot).map((entry) => entry.name)).toEqual([
      'form-field',
      'index',
    ]);

    const snapshot = buildApiSurfaceSnapshot(distRoot);
    expect(snapshot.get('index')).toBe('export declare const a: 1;\n');
    expect(snapshot.get('form-field')).toBe('export declare const b: 2;\n');
  });

  it('snapshots two builds that emit a union in different orders identically', async () => {
    const build = async (union: string) => {
      const root = mkdtempSync(join(tmpdir(), 'check-published-package-'));
      await mkdir(join(root, 'types'), { recursive: true });
      writeFileSync(
        join(root, 'types/index.d.ts'),
        `export declare const tone: Signal<${union}>;\n`,
      );
      writeFileSync(
        join(root, 'package.json'),
        JSON.stringify({
          exports: { '.': { types: './types/index.d.ts' } },
        }),
      );
      return root;
    };
    distRoot = await build("'error' | 'warning'");
    const other = await build('"warning" | "error"');
    try {
      expect(buildApiSurfaceSnapshot(distRoot)).toEqual(
        buildApiSurfaceSnapshot(other),
      );
    } finally {
      rmSync(other, { recursive: true, force: true });
    }
  });

  it('snapshots a .d.ts that ships without an exports map entry under an "<name>.internal" key', async () => {
    // Reproduces the toolkit's actual `/core` shape: ng-packagr writes
    // `ngx-signal-forms-toolkit-core.d.ts` into `types/` alongside the
    // published bundles, but strip-internal-exports.mjs deletes `"./core"`
    // from `exports`. A guard that only reads `publishedEntries()` would
    // never see this file, and #551 shows why that's a real gap: it added a
    // required member to a `/core`-only type without touching `index.d.ts`.
    distRoot = mkdtempSync(join(tmpdir(), 'check-published-package-'));
    await mkdir(join(distRoot, 'types'), { recursive: true });
    writeFileSync(
      join(distRoot, 'types/ngx-signal-forms-toolkit.d.ts'),
      "export { Config } from './ngx-signal-forms-toolkit-core.js';\n",
    );
    writeFileSync(
      join(distRoot, 'types/ngx-signal-forms-toolkit-core.d.ts'),
      'export interface Config {\n  a: 1;\n}\n',
    );
    writeFileSync(
      join(distRoot, 'package.json'),
      JSON.stringify({
        exports: {
          '.': {
            types: './types/ngx-signal-forms-toolkit.d.ts',
            default: './fesm2022/ngx-signal-forms-toolkit.mjs',
          },
        },
      }),
    );

    const snapshot = buildApiSurfaceSnapshot(distRoot);

    expect([...snapshot.keys()].toSorted((a, b) => a.localeCompare(b))).toEqual(
      ['core.internal', 'index'],
    );
    expect(snapshot.get('core.internal')).toBe(
      'export interface Config {\n  a: 1;\n}\n',
    );
  });
});

describe('buildTarballManifest', () => {
  let distRoot: string | undefined;

  afterEach(() => {
    if (distRoot !== undefined)
      rmSync(distRoot, { recursive: true, force: true });
  });

  it('lists the files npm pack would publish, sorted', () => {
    distRoot = mkdtempSync(join(tmpdir(), 'check-published-package-'));
    writeFileSync(
      join(distRoot, 'package.json'),
      JSON.stringify({ name: 'fixture-pkg', version: '0.0.0' }),
    );
    writeFileSync(join(distRoot, 'index.js'), 'module.exports = {};\n');
    writeFileSync(join(distRoot, 'README.md'), '# fixture\n');

    const manifest = buildTarballManifest(distRoot);

    expect(manifest).toEqual(['README.md', 'index.js', 'package.json']);
  });

  it('throws a clear error instead of an npm stack trace when the directory has no package.json', () => {
    distRoot = mkdtempSync(join(tmpdir(), 'check-published-package-'));

    // No package.json written - `npm pack` fails immediately. The guard
    // must report that failure as an actionable one-line error, not let a
    // raw ENOENT/npm stack trace leak to the CI log.
    expect(() => buildTarballManifest(distRoot)).toThrow(
      /npm pack --dry-run.* failed/,
    );
  });
});

describe('findBrokenReadmeLinks', () => {
  let distRoot: string | undefined;

  afterEach(() => {
    if (distRoot !== undefined)
      rmSync(distRoot, { recursive: true, force: true });
  });

  async function pack(readmes: Record<string, string>) {
    distRoot = mkdtempSync(join(tmpdir(), 'check-published-readme-'));
    for (const [path, text] of Object.entries(readmes)) {
      await mkdir(join(distRoot, path, '..'), { recursive: true });
      writeFileSync(join(distRoot, path), text);
    }
    return { distRoot, manifest: Object.keys(readmes).toSorted() };
  }

  it('reports a link that leaves the package or points at a file not in the tarball', async () => {
    const { distRoot, manifest } = await pack({
      'README.md': '# Root',
      'form-field/README.md':
        '[a](../../../docs/X.md) [b](./THEMING.md) [c](/docs/Y.md)',
    });
    expect(findBrokenReadmeLinks(distRoot, manifest)).toEqual([
      { readme: 'form-field/README.md', target: '../../../docs/X.md' },
      { readme: 'form-field/README.md', target: './THEMING.md' },
      { readme: 'form-field/README.md', target: '/docs/Y.md' },
    ]);
  });

  it('accepts links that resolve in the tarball, absolute URLs, anchors and fenced examples', async () => {
    const { distRoot, manifest } = await pack({
      'README.md': '# Root',
      'assistive/README.md': '# Assistive',
      'form-field/README.md':
        '[a](../assistive/README.md#top) [b](../README.md) [c](https://example.com) [d](#here)\n```md\n[e](./missing.md)\n```',
    });
    expect(findBrokenReadmeLinks(distRoot, manifest)).toEqual([]);
  });
});

describe('diffApiSurface', () => {
  it('reports an added entry, a removed entry, and a changed one', () => {
    const current = new Map([
      ['index', 'export declare const a: 1;\n'],
      ['new-entry', 'export declare const c: 3;\n'],
    ]);
    const baseline = new Map([
      ['index', 'export declare const a: 2;\n'],
      ['gone-entry', 'export declare const d: 4;\n'],
    ]);

    // This is the mechanism the whole feature relies on: any textual change
    // to a published `.d.ts` - a signature edit, a new export, a removed
    // one - must surface as an actionable diff instead of silently passing.
    expect(diffApiSurface(current, baseline)).toEqual([
      { kind: 'removed', name: 'gone-entry' },
      { kind: 'changed', name: 'index' },
      { kind: 'added', name: 'new-entry' },
    ]);
  });

  it('reports nothing when the surface is unchanged', () => {
    const snapshot = new Map([['index', 'export declare const a: 1;\n']]);
    expect(diffApiSurface(snapshot, new Map(snapshot))).toEqual([]);
  });
});

describe('diffTarballManifest', () => {
  it('reports files added to and removed from the tarball', () => {
    const result = diffTarballManifest(
      ['README.md', 'index.js', 'new-file.js'],
      ['README.md', 'index.js', 'old-file.js'],
    );

    expect(result).toEqual({
      added: ['new-file.js'],
      removed: ['old-file.js'],
    });
  });

  it('reports nothing when the file list is unchanged', () => {
    const files = ['README.md', 'index.js'];
    expect(diffTarballManifest(files, [...files])).toEqual({
      added: [],
      removed: [],
    });
  });
});

describe('renderCappedDiff', () => {
  it('renders a unified diff for a small change', () => {
    const diff = renderCappedDiff('a: 1;\nb: 2;\n', 'a: 1;\nb: 3;\n', 'index');

    expect(diff).toContain('-b: 2;');
    expect(diff).toContain('+b: 3;');
  });

  it('caps a large diff instead of flooding the log', () => {
    const before = Array.from({ length: 100 }, (_, i) => `line ${i}\n`).join(
      '',
    );
    const after = Array.from({ length: 100 }, (_, i) => `changed ${i}\n`).join(
      '',
    );

    const diff = renderCappedDiff(before, after, 'index', 10);

    expect(diff.split('\n').length).toBeLessThanOrEqual(11);
    expect(diff).toContain('more diff lines omitted');
  });
});

describe('writeBaseline + reading it back', () => {
  let baselineDir: string | undefined;

  afterEach(() => {
    if (baselineDir !== undefined)
      rmSync(baselineDir, { recursive: true, force: true });
  });

  it('round-trips a surface snapshot and a tarball manifest through disk, wrapping an internal entry in an explanatory header', () => {
    baselineDir = mkdtempSync(
      join(tmpdir(), 'check-published-package-baseline-'),
    );
    // writeBaseline removes the directory before writing, so hand it a path
    // that does not exist yet - matching how the real script creates
    // `packages/toolkit/api-reports/` from scratch.
    rmSync(baselineDir, { recursive: true, force: true });

    const surface = new Map([
      ['index', 'export declare const a: 1;\n'],
      ['core.internal', 'export interface Config {\n  a: 1;\n}\n'],
    ]);
    const manifest = ['README.md', 'index.js'];

    writeBaseline(baselineDir, surface, manifest);

    expect(existsSync(join(baselineDir, 'index.d.ts'))).toBe(true);
    expect(readFileSync(join(baselineDir, 'index.d.ts'), 'utf8')).toBe(
      'export declare const a: 1;\n',
    );
    // The internal entry's file carries a human-readable "not public" header
    // on disk (so a reviewer opening it in a PR diff understands why it
    // exists), but reading it back through readBaselineSurface must strip
    // that header - the comparison must only ever see dist-identical
    // content, never the explanation wrapped around it.
    const rawInternalFile = readFileSync(
      join(baselineDir, 'core.internal.d.ts'),
      'utf8',
    );
    expect(rawInternalFile).toContain('NOT A PUBLIC ENTRY POINT');
    expect(rawInternalFile).not.toBe(surface.get('core.internal'));

    const roundTripped = readBaselineSurface(baselineDir);
    expect(roundTripped.get('core.internal')).toBe(
      surface.get('core.internal'),
    );
    expect(roundTripped.get('index')).toBe(surface.get('index'));

    expect(readBaselineTarballManifest(baselineDir)).toEqual(manifest);
  });

  it('removes a stale entry left over from a previous baseline', () => {
    baselineDir = mkdtempSync(
      join(tmpdir(), 'check-published-package-baseline-'),
    );
    rmSync(baselineDir, { recursive: true, force: true });

    // Simulate a baseline from before an entry was removed: write it once
    // with two entries, then update it with only one. The stale file must
    // not survive - a leftover `old.d.ts` would let `readBaselineSurface`
    // keep reporting a "removed" entry that was already reviewed and
    // committed as gone.
    writeBaseline(
      baselineDir,
      new Map([
        ['index', 'export declare const a: 1;\n'],
        ['old', 'export declare const b: 2;\n'],
      ]),
      [],
    );
    expect(existsSync(join(baselineDir, 'old.d.ts'))).toBe(true);

    writeBaseline(
      baselineDir,
      new Map([['index', 'export declare const a: 1;\n']]),
      [],
    );

    expect(existsSync(join(baselineDir, 'old.d.ts'))).toBe(false);
    expect(existsSync(join(baselineDir, 'index.d.ts'))).toBe(true);
  });
});

describe('main() check mode (end-to-end via a fixture dist + baseline)', () => {
  let distRoot: string | undefined;
  let baselineDir: string | undefined;

  afterEach(() => {
    if (distRoot !== undefined)
      rmSync(distRoot, { recursive: true, force: true });
    if (baselineDir !== undefined)
      rmSync(baselineDir, { recursive: true, force: true });
  });

  /** Builds a minimal fixture dist with one published entry. */
  async function makeFixtureDist(indexDts: string) {
    const dir = mkdtempSync(join(tmpdir(), 'check-published-package-dist-'));
    await mkdir(join(dir, 'types'), { recursive: true });
    writeFileSync(join(dir, 'types/index.d.ts'), indexDts);
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({
        name: 'fixture-pkg',
        version: '0.0.0',
        exports: {
          '.': {
            types: './types/index.d.ts',
            default: './fesm2022/index.mjs',
          },
        },
      }),
    );
    return dir;
  }

  function runCli(env: Record<string, string>) {
    try {
      const stdout = execFileSync(process.execPath, [scriptPath], {
        encoding: 'utf8',
        env: { ...process.env, ...env },
      });
      return { status: 0, stdout, stderr: '' };
    } catch (error) {
      const execError = error as {
        status: number | null;
        stdout: string;
        stderr: string;
      };
      return {
        status: execError.status ?? 1,
        stdout: execError.stdout,
        stderr: execError.stderr,
      };
    }
  }

  it('exits 0 and reports a match when the built dist matches the baseline', async () => {
    distRoot = await makeFixtureDist('export declare const a: 1;\n');
    baselineDir = mkdtempSync(
      join(tmpdir(), 'check-published-package-baseline-'),
    );
    rmSync(baselineDir, { recursive: true, force: true });
    writeBaseline(
      baselineDir,
      new Map([['index', 'export declare const a: 1;\n']]),
      buildTarballManifest(distRoot),
    );

    const result = runCli({
      CHECK_PUBLISHED_PACKAGE_DIST_ROOT: distRoot,
      CHECK_PUBLISHED_PACKAGE_BASELINE_DIR: baselineDir,
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('match the baseline');
  });

  it('exits non-zero with an actionable message when the built dist drifts from the baseline', async () => {
    distRoot = await makeFixtureDist('export declare const a: 2;\n');
    baselineDir = mkdtempSync(
      join(tmpdir(), 'check-published-package-baseline-'),
    );
    rmSync(baselineDir, { recursive: true, force: true });
    // The tarball's file list is identical either way - only the `.d.ts`
    // content differs - so it is safe to derive the baseline's expected
    // manifest from the same fixture dist without also drifting the
    // tarball-contents comparison.
    writeBaseline(
      baselineDir,
      new Map([['index', 'export declare const a: 1;\n']]),
      buildTarballManifest(distRoot),
    );

    const result = runCli({
      CHECK_PUBLISHED_PACKAGE_DIST_ROOT: distRoot,
      CHECK_PUBLISHED_PACKAGE_BASELINE_DIR: baselineDir,
    });

    expect(result.status).not.toBe(0);
    // Every actionable piece the failure message promises: what changed, the
    // capped diff, and the exact command to run to accept it.
    expect(result.stderr).toContain('changed: index');
    expect(result.stderr).toContain('-export declare const a: 1;');
    expect(result.stderr).toContain('+export declare const a: 2;');
    expect(result.stderr).toContain(
      'pnpm run check:toolkit-published-package -- --update',
    );
    expect(result.stderr).toContain('pnpm nx build toolkit');
  });
});
