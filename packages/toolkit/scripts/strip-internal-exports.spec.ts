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
});
