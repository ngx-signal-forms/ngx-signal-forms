import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';
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

const toolkitDir = resolve(import.meta.dirname, '..');

// Every *secondary* entry point ng-packagr discovers when it builds the
// package: each toolkit sub-directory holding an `ng-package.json`
// (ng-packagr globs for the file itself; it never reads a directory name
// allowlist). The primary entry (`packages/toolkit/` itself) is deliberately
// not in this list. This mirrors `findSecondaryPackagesPaths` in ng-packagr's
// `discover-packages.ts` closely enough to catch drift without needing an
// actual build.
const secondaryEntries = readdirSync(toolkitDir, { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() &&
      existsSync(resolve(toolkitDir, entry.name, 'ng-package.json')),
  )
  .map((entry) => entry.name)
  .toSorted();

// `/core` is a real ng-packagr entry point (needed so sibling entries can
// import its build-time plumbing) but `strip-internal-exports.mjs` deletes
// `"./core"` from the *published* `exports` map post-build — so it must be
// excluded from any check phrased in terms of the public surface.
const publishedSecondaryEntries = secondaryEntries.filter(
  (name) => name !== 'core',
);

/** Reads `lib.entryFile` out of an entry point's `ng-package.json`. */
function readEntryFile(entryDir: string): string {
  const ngPackageJson = JSON.parse(
    readFileSync(resolve(entryDir, 'ng-package.json'), 'utf8'),
  ) as { lib?: { entryFile?: string } };
  const entryFile = ngPackageJson.lib?.entryFile;
  if (!entryFile) {
    throw new Error(`${entryDir}/ng-package.json is missing lib.entryFile`);
  }
  return resolve(entryDir, entryFile);
}

/**
 * Collects the names a TypeScript barrel file exports, following local
 * (relative-path) `export * from '...'` re-export chains recursively.
 * Named re-exports from a relative specifier (`export { a, b } from './...'`)
 * are verified against the target file — a name the target no longer exports
 * throws instead of silently counting as exported, so a stale named re-export
 * fails here without needing a typecheck. Named re-exports from a
 * package-name specifier (e.g. `@ngx-signal-forms/toolkit/core`) contribute
 * their listed names directly without resolving the target — those names are
 * cross-checked against the entry barrels by the root-barrel test instead —
 * and this codebase never uses a bare `export *` against a package specifier.
 *
 * Only used to check *name* existence across barrels, so type-only vs.
 * value exports are treated identically.
 *
 * Results are memoized per file, and `inProgress` guards against re-export
 * cycles: a file re-entered while its own walk is still running contributes
 * an empty set (for `export *`) or fails the stale-name check (for a named
 * re-export) instead of recursing forever.
 */
const exportedNamesCache = new Map<string, Set<string>>();

function collectExportedNames(
  filePath: string,
  inProgress = new Set<string>(),
): Set<string> {
  const cached = exportedNamesCache.get(filePath);
  if (cached) return cached;
  const names = new Set<string>();
  if (inProgress.has(filePath)) return names;
  inProgress.add(filePath);

  const source = ts.createSourceFile(
    filePath,
    readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );

  const resolveRelativeModule = (specifier: string): string => {
    if (!specifier.startsWith('.')) {
      throw new Error(
        `${filePath}: bare "export *" from a non-relative specifier ` +
          `('${specifier}') is not supported by this spec's export walker.`,
      );
    }
    const base = resolve(dirname(filePath), specifier);
    for (const candidate of [`${base}.ts`, resolve(base, 'index.ts')]) {
      if (existsSync(candidate)) return candidate;
    }
    throw new Error(`${filePath}: cannot resolve module '${specifier}'`);
  };

  for (const statement of source.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        const specifier =
          statement.moduleSpecifier &&
          ts.isStringLiteral(statement.moduleSpecifier)
            ? statement.moduleSpecifier.text
            : undefined;
        const targetNames = specifier?.startsWith('.')
          ? collectExportedNames(resolveRelativeModule(specifier), inProgress)
          : undefined;
        for (const element of statement.exportClause.elements) {
          const importedName = (element.propertyName ?? element.name).text;
          if (targetNames && !targetNames.has(importedName)) {
            throw new Error(
              `${filePath}: re-exports '${importedName}' from ` +
                `'${specifier}', but the target no longer exports that name.`,
            );
          }
          names.add(element.name.text);
        }
      } else if (
        statement.moduleSpecifier &&
        ts.isStringLiteral(statement.moduleSpecifier)
      ) {
        const resolved = resolveRelativeModule(statement.moduleSpecifier.text);
        for (const name of collectExportedNames(resolved, inProgress)) {
          names.add(name);
        }
      }
      continue;
    }

    const modifiers = ts.canHaveModifiers(statement)
      ? ts.getModifiers(statement)
      : undefined;
    const isExported = modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!isExported) continue;

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
    } else if (
      (ts.isClassDeclaration(statement) ||
        ts.isFunctionDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      statement.name
    ) {
      names.add(statement.name.text);
    }
  }

  inProgress.delete(filePath);
  exportedNamesCache.set(filePath, names);
  return names;
}

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
    const vestRange = packageJson.peerDependencies?.['vest'];
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

describe('secondary entry point configuration', () => {
  // ng-packagr discovers secondary entry points purely by globbing for
  // `ng-package.json` files; a sibling `package.json` is never read for
  // secondary entries (only for the primary entry point), so a legacy
  // `package.json` with a `"ngPackage": {}` stub next to `ng-package.json`
  // is dead configuration that does nothing at build time. Each secondary
  // entry's ng-package.json should also declare `$schema` for editor
  // validation, matching the primary entry point's convention.
  //
  // `publishedSecondaryEntries` is derived from the filesystem above (every
  // `ng-package.json`-bearing directory, minus `/core`) rather than
  // hand-listed, so a new entry — or one that escapes this check the way
  // `testing` previously did — can't silently go uncovered again.

  it.each(publishedSecondaryEntries)(
    '%s/ has no redundant legacy package.json stub',
    (entry) => {
      expect(
        existsSync(resolve(import.meta.dirname, `../${entry}/package.json`)),
      ).toBe(false);
    },
  );

  it.each(publishedSecondaryEntries)(
    '%s/ng-package.json declares $schema',
    (entry) => {
      const ngPackageJson = JSON.parse(
        readFileSync(
          resolve(import.meta.dirname, `../${entry}/ng-package.json`),
          'utf8',
        ),
      ) as { $schema?: string };
      expect(ngPackageJson.$schema).toBeTruthy();
    },
  );
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

describe('published exports map surface', () => {
  // ng-packagr has no static "exports" field to read from source — it
  // generates the published `package.json`'s `exports` map at build time
  // purely by globbing for `ng-package.json` files (see
  // `discoverPackages`/`findSecondaryPackagesPaths` in ng-packagr's
  // `discover-packages.ts`). The other checked-in source of truth for that
  // same subpath list is `tsconfig.base.json`'s `@ngx-signal-forms/toolkit/*`
  // path mappings, which every in-repo consumer (and TypeScript itself)
  // resolves against. This asserts those two sources agree, so an entry
  // added to one without the other — e.g. a new `ng-package.json` with no
  // matching path mapping, or vice versa — fails here instead of surfacing
  // as a broken import or an unintentionally published subpath.
  it('matches the tsconfig.base.json path-mapping entry list', () => {
    const tsconfigBase = JSON.parse(
      readFileSync(resolve(toolkitDir, '../../tsconfig.base.json'), 'utf8'),
    ) as { compilerOptions: { paths: Record<string, string[]> } };

    const toolkitPathPrefix = '@ngx-signal-forms/toolkit/';
    const knownSecondaryEntries = Object.keys(
      tsconfigBase.compilerOptions.paths,
    )
      .filter((specifier) => specifier.startsWith(toolkitPathPrefix))
      .map((specifier) => specifier.slice(toolkitPathPrefix.length))
      // `/core` is a build-time-only entry deliberately hidden from the
      // published exports map by strip-internal-exports.mjs, so it is
      // excluded from the tsconfig side too (see that script's own header).
      .filter((name) => name !== 'core')
      .toSorted();

    expect(publishedSecondaryEntries).toEqual(knownSecondaryEntries);
  });
});

describe('root barrel surface', () => {
  // `packages/toolkit/index.ts` hand-enumerates its public API rather than
  // re-exporting `/core` wholesale (see that file's own header for why:
  // `/core` also carries `@internal` plumbing that must not leak). Nothing
  // previously checked that the hand-enumerated list stays in sync with what
  // the entry-point barrels actually export, so a rename or removal upstream
  // could leave a stale name in the root barrel (a broken re-export) without
  // any test catching it.
  it('enumerates only names that exist in the entry-point barrels', () => {
    const rootIndexPath = resolve(toolkitDir, 'index.ts');
    const rootExportedNames = collectExportedNames(rootIndexPath);

    const entryBarrelNames = new Set<string>();
    for (const entry of secondaryEntries) {
      const entryFile = readEntryFile(resolve(toolkitDir, entry));
      for (const name of collectExportedNames(entryFile)) {
        entryBarrelNames.add(name);
      }
    }

    const staleNames = [...rootExportedNames].filter(
      (name) => !entryBarrelNames.has(name),
    );
    expect(staleNames).toEqual([]);
  });
});
