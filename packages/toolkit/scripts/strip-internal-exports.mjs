#!/usr/bin/env node
// Post-build hardening for the `@ngx-signal-forms/toolkit` package.
//
// The toolkit uses a build-time-only `/core` secondary entry point to hold
// `@internal` plumbing (ARIA tokens, hint registry, error-message registry,
// etc.) that the `form-field`, `assistive`, `headless`, and `debugger`
// entries need at compile time but that consumers must never reach.
//
// ng-packagr emits `/core` as a normal secondary entry — including adding
// `"./core"` to the published `package.json` `exports` map and leaving
// package-name import specifiers like `'@ngx-signal-forms/toolkit/core'`
// inside sibling entries' `.mjs` / `.d.ts` bundles. Those package-name
// specifiers would be blocked by modern Node resolvers the moment we strip
// `"./core"` from `exports`, because self-references are still subject to
// the exports map.
//
// This script runs after the `toolkit:build` target and:
//   1. Rewrites every sibling `.mjs` / `.d.ts` that still references
//      `'@ngx-signal-forms/toolkit/core'` to use a relative specifier
//      pointing at the `core` bundle that sits beside it in the same
//      `fesm2022/` or `types/` directory.
//   2. Deletes the `"./core"` entry from the published `exports` map so
//      consumers see `ERR_PACKAGE_PATH_NOT_EXPORTED` if they try to import
//      from `@ngx-signal-forms/toolkit/core`.
//
// The physical `/core` bundle files stay in place — the other entries
// still need them at runtime, just via relative paths instead of the
// package-name path.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const distRoot = resolve('dist/packages/toolkit');
const fesmDir = join(distRoot, 'fesm2022');
const typesDir = join(distRoot, 'types');
const pkgJsonPath = join(distRoot, 'package.json');

const PACKAGE_CORE_SPECIFIER = '@ngx-signal-forms/toolkit/core';
const RELATIVE_MJS_SPECIFIER = './ngx-signal-forms-toolkit-core.mjs';
// TypeScript's node16/nodenext module resolution requires an explicit
// extension on relative ESM specifiers in declaration files; `.js` maps to
// the sibling `.d.ts` file.
const RELATIVE_DTS_SPECIFIER = './ngx-signal-forms-toolkit-core.js';
const CORE_FESM_BASENAME = 'ngx-signal-forms-toolkit-core.mjs';
const CORE_DTS_BASENAME = 'ngx-signal-forms-toolkit-core.d.ts';

const escapeRegExp = (/** @type {string} */ value) =>
  value.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&');

// Matches the package-name specifier under either quote style (`'…'` or
// `"…"`), including inside inline `import("…").Type` type references that
// `tsc` emits double-quoted. The backreference (`\1`) ties the closing quote
// to whichever quote opened the match, so a mismatched pair never matches.
const QUOTED_SPECIFIER_PATTERN = new RegExp(
  `(['"])${escapeRegExp(PACKAGE_CORE_SPECIFIER)}\\1`,
  'gu',
);

/** @type {string[]} */
const rewrittenMjs = [];
/** @type {string[]} */
const rewrittenDts = [];
/** @type {string[]} */
const danglingReferences = [];

const rewriteImportSpecifier = (
  /** @type {string} */ dir,
  /** @type {string} */ skipBaseName,
  /** @type {string} */ extension,
  /** @type {string} */ newSpecifier,
  /** @type {string[]} */ bucket,
) => {
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(extension)) continue;
    if (name === skipBaseName) continue;
    const filePath = join(dir, name);
    const content = readFileSync(filePath, 'utf8');
    if (!content.includes(PACKAGE_CORE_SPECIFIER)) continue;
    const rewritten = content.replaceAll(
      QUOTED_SPECIFIER_PATTERN,
      (/** @type {string} */ _match, /** @type {string} */ quote) =>
        `${quote}${newSpecifier}${quote}`,
    );
    if (rewritten !== content) {
      writeFileSync(filePath, rewritten);
      bucket.push(name);
    }
    // The gate above is a cheap substring pre-check; this is the real
    // post-condition. A file can still contain the raw specifier after the
    // rewrite if it appears in a form the regex above does not recognize
    // (e.g. split across a template literal). Publishing with that
    // reference intact would throw `ERR_PACKAGE_PATH_NOT_EXPORTED` the
    // moment `"./core"` is stripped from `exports`, so treat it as fatal.
    if (rewritten.includes(PACKAGE_CORE_SPECIFIER)) {
      danglingReferences.push(filePath);
    }
  }
};

rewriteImportSpecifier(
  fesmDir,
  CORE_FESM_BASENAME,
  '.mjs',
  RELATIVE_MJS_SPECIFIER,
  rewrittenMjs,
);
rewriteImportSpecifier(
  typesDir,
  CORE_DTS_BASENAME,
  '.d.ts',
  RELATIVE_DTS_SPECIFIER,
  rewrittenDts,
);

if (danglingReferences.length > 0) {
  console.error(
    `[toolkit] ERROR: ${danglingReferences.length} dangling reference(s) to '${PACKAGE_CORE_SPECIFIER}' survived the rewrite pass:`,
  );
  for (const filePath of danglingReferences) console.error(`  ${filePath}`);
  console.error(
    '[toolkit] Aborting before stripping "./core" from the exports map — publishing now would throw ERR_PACKAGE_PATH_NOT_EXPORTED on import.',
  );
  process.exit(1);
}

/** @typedef {{ exports?: Record<string, unknown> }} PackageJsonLike */

/** @type {PackageJsonLike} */
const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
let exportsStripped = false;
if (
  pkg?.exports &&
  typeof pkg.exports === 'object' &&
  './core' in pkg.exports
) {
  delete pkg.exports['./core'];
  writeFileSync(pkgJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
  exportsStripped = true;
}

const summary = [
  `rewrote ${rewrittenMjs.length} fesm bundle${
    rewrittenMjs.length === 1 ? '' : 's'
  }`,
  `${rewrittenDts.length} type declaration${
    rewrittenDts.length === 1 ? '' : 's'
  }`,
  exportsStripped
    ? 'stripped "./core" from exports map'
    : 'exports map already clean',
].join(', ');

console.log(`[toolkit] hid /core from public surface: ${summary}`);
