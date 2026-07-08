import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Regression tests for packaging concerns that only surface once the
// package is actually installed/published — undeclared peer deps, missing
// license text in the tarball, and stale compatibility docs. These read the
// checked-in source of truth directly rather than the built dist output.

const packageJson = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf8'),
) as {
  peerDependencies?: Record<string, string>;
  engines?: { node?: string };
};

const projectJson = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../project.json'), 'utf8'),
) as {
  targets: { 'post-build': { options: { commands: string[] } } };
};

describe('packages/toolkit/package.json', () => {
  it('declares @angular/common as a peer dependency with the same range as @angular/core', () => {
    // form-field-wrapper.ts and form-fieldset.ts import NgComponentOutlet /
    // NgTemplateOutlet from '@angular/common' at runtime — the built fesm
    // bundle contains a genuine top-level import of it, so it must be a
    // declared peer dependency, not just a devDependency. It must also track
    // the same Angular major/minor range as @angular/core — a drifted range
    // would let a consumer install a common/core version pair that the
    // package was never validated against.
    expect(packageJson.peerDependencies).toHaveProperty('@angular/common');
    expect(packageJson.peerDependencies?.['@angular/common']).toBe(
      packageJson.peerDependencies?.['@angular/core'],
    );
  });

  it('caps the vest peer dependency range below vest 7', () => {
    // The adapter only imports vest types at runtime (`import type { SuiteResult }`),
    // but an unbounded-above range (e.g. ">=6.0.0") would let a future vest 7.x/8.x
    // with breaking SuiteResult/typing changes silently satisfy the peer contract,
    // contradicting the deliberate upper-bound-cap philosophy applied to Angular
    // (see COMPATIBILITY.md) and the /vest README's "requires vest@6" wording.
    const vestRange = packageJson.peerDependencies?.vest;
    expect(vestRange).toBeTruthy();
    expect(vestRange).toMatch(/<7\.0\.0/);
  });
});

describe('packages/toolkit/project.json post-build target', () => {
  it('copies LICENSE into the publish root alongside README.md', () => {
    const commands = projectJson.targets['post-build'].options.commands;
    const copiesLicense = commands.some((command) =>
      /\bcp\b.*\bLICENSE\b.*dist\/packages\/toolkit/.test(command),
    );
    expect(copiesLicense).toBe(true);
  });
});

describe('COMPATIBILITY.md', () => {
  it('documents the same engines.node range as package.json', () => {
    const compatibilityMd = readFileSync(
      resolve(import.meta.dirname, '../../../COMPATIBILITY.md'),
      'utf8',
    );
    expect(packageJson.engines?.node).toBeTruthy();
    expect(compatibilityMd).toContain(packageJson.engines?.node);
  });
});
