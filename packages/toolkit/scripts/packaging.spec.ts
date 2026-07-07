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
  it('declares @angular/common as a peer dependency', () => {
    // form-field-wrapper.ts and form-fieldset.ts import NgComponentOutlet /
    // NgTemplateOutlet from '@angular/common' at runtime — the built fesm
    // bundle contains a genuine top-level import of it, so it must be a
    // declared peer dependency, not just a devDependency.
    expect(packageJson.peerDependencies).toHaveProperty('@angular/common');
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
