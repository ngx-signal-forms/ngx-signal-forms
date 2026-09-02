import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

// Regression test for the post-build hardening script that hides the
// build-time-only `/core` entry point from the published package. The
// script rewrites sibling bundles' `'@ngx-signal-forms/toolkit/core'`
// specifiers to relative paths pointing at the co-located `core` bundle.
//
// `.d.ts` files are ESM under `"type": "module"`, so under TypeScript's
// node16/nodenext module resolution a relative specifier in a declaration
// file must carry an explicit extension. A specifier like
// `'./ngx-signal-forms-toolkit-core'` (no extension) breaks consumers using
// nodenext resolution (SSR, tsc builds, Jest/Vitest with nodenext) with
// TS2307, even though Angular CLI's bundler resolution masks the problem.

const scriptPath = resolve(import.meta.dirname, './strip-internal-exports.mjs');

describe('strip-internal-exports.mjs', () => {
  let workDir: string | undefined;

  afterEach(() => {
    if (workDir !== undefined)
      rmSync(workDir, { recursive: true, force: true });
  });

  it('rewrites .d.ts core specifiers to an extension-carrying relative path', async () => {
    workDir = mkdtempSync(join(tmpdir(), 'strip-internal-exports-'));
    const distRoot = join(workDir, 'dist/packages/toolkit');
    const fesmDir = join(distRoot, 'fesm2022');
    const typesDir = join(distRoot, 'types');
    await mkdir(fesmDir, { recursive: true });
    await mkdir(typesDir, { recursive: true });

    // Sibling entry that re-exports the internal /core entry, plus the core
    // bundle itself (which must be left untouched, not self-rewritten).
    writeFileSync(
      join(fesmDir, 'ngx-signal-forms-toolkit.mjs'),
      `export * from '@ngx-signal-forms/toolkit/core';\n`,
    );
    writeFileSync(
      join(fesmDir, 'ngx-signal-forms-toolkit-core.mjs'),
      `export {};\n`,
    );
    writeFileSync(
      join(typesDir, 'ngx-signal-forms-toolkit.d.ts'),
      `export * from '@ngx-signal-forms/toolkit/core';\n`,
    );
    writeFileSync(
      join(typesDir, 'ngx-signal-forms-toolkit-core.d.ts'),
      `export {};\n`,
    );
    writeFileSync(
      join(distRoot, 'package.json'),
      JSON.stringify({
        exports: {
          '.': './fesm2022/ngx-signal-forms-toolkit.mjs',
          './core': './fesm2022/ngx-signal-forms-toolkit-core.mjs',
        },
      }),
    );

    execFileSync(process.execPath, [scriptPath], { cwd: workDir });

    const dts = readFileSync(
      join(typesDir, 'ngx-signal-forms-toolkit.d.ts'),
      'utf8',
    );
    const mjs = readFileSync(
      join(fesmDir, 'ngx-signal-forms-toolkit.mjs'),
      'utf8',
    );

    // The .mjs rewrite already carries an extension and must be unaffected.
    expect(mjs).toContain(`from './ngx-signal-forms-toolkit-core.mjs'`);

    // The .d.ts rewrite must carry an explicit extension for node16/nodenext
    // consumers to resolve it — the bare (extensionless) specifier must be
    // gone entirely, not just supplemented.
    expect(dts).not.toMatch(/'\.\/ngx-signal-forms-toolkit-core'/);
    expect(dts).toContain(`from './ngx-signal-forms-toolkit-core.js'`);
  });

  // Regression test for #283: `tsc` emits inline `import("…").Type`
  // references double-quoted. The old rewrite only matched single-quoted
  // specifiers, so a double-quoted one survived the rewrite untouched while
  // the success gate (a bare substring check) still counted the file as
  // rewritten and let the run strip `"./core"` from `exports` anyway —
  // publishing a package that throws `ERR_PACKAGE_PATH_NOT_EXPORTED` on
  // import while reporting success.
  it('rewrites double-quoted core specifiers instead of silently skipping them', async () => {
    workDir = mkdtempSync(join(tmpdir(), 'strip-internal-exports-'));
    const distRoot = join(workDir, 'dist/packages/toolkit');
    const fesmDir = join(distRoot, 'fesm2022');
    const typesDir = join(distRoot, 'types');
    await mkdir(fesmDir, { recursive: true });
    await mkdir(typesDir, { recursive: true });

    writeFileSync(
      join(fesmDir, 'ngx-signal-forms-toolkit.mjs'),
      `export * from "@ngx-signal-forms/toolkit/core";\n`,
    );
    writeFileSync(
      join(fesmDir, 'ngx-signal-forms-toolkit-core.mjs'),
      `export {};\n`,
    );
    // A `tsc`-style inline type reference, double-quoted.
    writeFileSync(
      join(typesDir, 'ngx-signal-forms-toolkit.d.ts'),
      `export declare const x: import("@ngx-signal-forms/toolkit/core").Foo;\n`,
    );
    writeFileSync(
      join(typesDir, 'ngx-signal-forms-toolkit-core.d.ts'),
      `export {};\n`,
    );
    writeFileSync(
      join(distRoot, 'package.json'),
      JSON.stringify({
        exports: {
          '.': './fesm2022/ngx-signal-forms-toolkit.mjs',
          './core': './fesm2022/ngx-signal-forms-toolkit-core.mjs',
        },
      }),
    );

    execFileSync(process.execPath, [scriptPath], { cwd: workDir });

    const dts = readFileSync(
      join(typesDir, 'ngx-signal-forms-toolkit.d.ts'),
      'utf8',
    );
    const mjs = readFileSync(
      join(fesmDir, 'ngx-signal-forms-toolkit.mjs'),
      'utf8',
    );
    const pkg = JSON.parse(
      readFileSync(join(distRoot, 'package.json'), 'utf8'),
    );

    expect(mjs).toContain(`from "./ngx-signal-forms-toolkit-core.mjs"`);
    expect(dts).toContain(`import("./ngx-signal-forms-toolkit-core.js").Foo`);
    expect(dts).not.toContain('@ngx-signal-forms/toolkit/core');
    // The rewrite succeeded, so it is safe to strip "./core" from exports.
    expect(pkg.exports['./core']).toBeUndefined();
  });

  it('fails loudly instead of stripping "./core" when a dangling reference survives the rewrite', async () => {
    workDir = mkdtempSync(join(tmpdir(), 'strip-internal-exports-'));
    const distRoot = join(workDir, 'dist/packages/toolkit');
    const fesmDir = join(distRoot, 'fesm2022');
    const typesDir = join(distRoot, 'types');
    await mkdir(fesmDir, { recursive: true });
    await mkdir(typesDir, { recursive: true });

    // A form the rewrite regex cannot recognize (backtick-quoted, not
    // single- or double-quoted) — simulates a dangling reference that
    // survives the rewrite pass.
    writeFileSync(
      join(fesmDir, 'ngx-signal-forms-toolkit.mjs'),
      'const CORE = `@ngx-signal-forms/toolkit/core`;\nexport { CORE };\n',
    );
    writeFileSync(
      join(fesmDir, 'ngx-signal-forms-toolkit-core.mjs'),
      `export {};\n`,
    );
    writeFileSync(
      join(typesDir, 'ngx-signal-forms-toolkit.d.ts'),
      `export {};\n`,
    );
    writeFileSync(
      join(typesDir, 'ngx-signal-forms-toolkit-core.d.ts'),
      `export {};\n`,
    );
    writeFileSync(
      join(distRoot, 'package.json'),
      JSON.stringify({
        exports: {
          '.': './fesm2022/ngx-signal-forms-toolkit.mjs',
          './core': './fesm2022/ngx-signal-forms-toolkit-core.mjs',
        },
      }),
    );

    let failure: { status: number | null; stderr: string } | undefined;
    try {
      execFileSync(process.execPath, [scriptPath], {
        cwd: workDir,
        stdio: 'pipe',
        encoding: 'utf8',
      });
    } catch (error) {
      const execError = error as { status: number | null; stderr: string };
      failure = { status: execError.status, stderr: execError.stderr };
    }

    // Assert on exit status and the script's own stderr report rather than
    // Node's `execFileSync` error message, which is not stable across
    // Node versions.
    expect(failure).toBeDefined();
    expect(failure?.status).not.toBe(0);
    expect(failure?.stderr).toContain('dangling');

    // The exports map must survive untouched — stripping it while a dangling
    // reference remains would publish a package that breaks on import.
    const pkg = JSON.parse(
      readFileSync(join(distRoot, 'package.json'), 'utf8'),
    );
    expect(pkg.exports['./core']).toBe(
      './fesm2022/ngx-signal-forms-toolkit-core.mjs',
    );
  });
});
