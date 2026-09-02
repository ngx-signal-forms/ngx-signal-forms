import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

// Mechanical verification for issue #360: every public export of the
// `/headless` barrel must carry a `@group <Name>` JSDoc tag at its
// *declaration* site, so a generated API reference (or a human skimming the
// source) can bucket the ~70-export surface into the same use-case sections
// documented in `headless/README.md` (Directives / Reactive Primitives /
// ARIA Composition / Utility Functions). This reads the checked-in source of
// truth directly — the same approach `scripts/packaging.spec.ts` uses for
// re-export drift — rather than a built/generated doc artifact, so it works
// without a TypeDoc (or similar) pipeline, which this repo does not have.
//
// The barrel is walked structurally (export declarations, import bindings,
// `export *`), not hand-listed, so a future export that forgets its `@group`
// tag fails here instead of silently shipping ungrouped.

const toolkitDir = resolve(import.meta.dirname, '../..');
const repoRoot = resolve(toolkitDir, '../..');

const tsconfigBase = JSON.parse(
  readFileSync(resolve(repoRoot, 'tsconfig.base.json'), 'utf8'),
) as { compilerOptions: { paths: Record<string, string[]> } };

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

const headlessEntryFile = readEntryFile(resolve(toolkitDir, 'headless'));

// The four use-case sections `headless/README.md` is organized into. A
// `@group` tag whose value isn't one of these is almost certainly a typo
// (e.g. `@group Directive` or `@group Reactive Primitive`) that would
// silently fall outside every documented section — validated below, not
// just presence-checked.
const ALLOWED_GROUPS = [
  'Directives',
  'Reactive Primitives',
  'ARIA Composition',
  'Utility Functions',
] as const;

/**
 * Thrown by {@link findDeclarationJsDoc} only for its own terminal "walked
 * every statement in this file, no match" case. Distinguished from every
 * other failure (an unmapped tsconfig path, an unresolvable relative
 * specifier, a cycle) so the `export *` fallback below can swallow *this*
 * case alone — a genuine resolver bug still surfaces instead of being
 * folded into "try the next export *".
 */
class DeclarationNotFoundError extends Error {}

/** Resolves an import/export module specifier to an absolute `.ts` file. */
function resolveSpecifier(fromFile: string, specifier: string): string {
  if (specifier.startsWith('.')) {
    const base = resolve(dirname(fromFile), specifier);
    for (const candidate of [`${base}.ts`, resolve(base, 'index.ts')]) {
      if (existsSync(candidate)) return candidate;
    }
    throw new Error(
      `${fromFile}: cannot resolve relative module '${specifier}'`,
    );
  }

  const mapping = tsconfigBase.compilerOptions.paths[specifier];
  if (!mapping || mapping.length === 0) {
    throw new Error(
      `${fromFile}: no tsconfig.base.json path mapping for '${specifier}'`,
    );
  }
  return resolve(repoRoot, mapping[0]);
}

const sourceFileCache = new Map<string, ts.SourceFile>();

function getSourceFile(filePath: string): ts.SourceFile {
  const cached = sourceFileCache.get(filePath);
  if (cached) return cached;

  const sourceFile = ts.createSourceFile(
    filePath,
    readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );
  sourceFileCache.set(filePath, sourceFile);
  return sourceFile;
}

/** Concatenated leading comment text (JSDoc block(s)) for a statement. */
function getLeadingCommentText(
  sourceFile: ts.SourceFile,
  statement: ts.Statement,
): string {
  const ranges =
    ts.getLeadingCommentRanges(sourceFile.text, statement.getFullStart()) ?? [];
  return ranges
    .map((range) => sourceFile.text.slice(range.pos, range.end))
    .join('\n');
}

function isNamedDeclarationMatch(
  statement: ts.Statement,
  name: string,
): boolean {
  return (
    (ts.isClassDeclaration(statement) ||
      ts.isFunctionDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isEnumDeclaration(statement)) &&
    statement.name?.text === name
  );
}

/**
 * Finds where `name` is *declared* (following re-export and import chains
 * across relative files and `@ngx-signal-forms/toolkit*` package specifiers)
 * and returns its leading JSDoc comment text.
 */
function findDeclarationJsDoc(
  filePath: string,
  name: string,
  visited: Set<string> = new Set(),
): string {
  const key = `${filePath}::${name}`;
  if (visited.has(key)) {
    throw new Error(`Cycle detected resolving '${name}' from ${filePath}`);
  }
  visited.add(key);

  const sourceFile = getSourceFile(filePath);

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          if (element.name.text !== name) continue;
          const internalName = (element.propertyName ?? element.name).text;

          if (
            statement.moduleSpecifier &&
            ts.isStringLiteral(statement.moduleSpecifier)
          ) {
            const target = resolveSpecifier(
              filePath,
              statement.moduleSpecifier.text,
            );
            return findDeclarationJsDoc(target, internalName, visited);
          }

          // `export { name }` / `export { type name }` with no specifier:
          // re-exports a name imported (or declared) elsewhere in this file.
          return resolveLocalName(sourceFile, filePath, internalName, visited);
        }
        continue;
      }

      if (
        statement.moduleSpecifier &&
        ts.isStringLiteral(statement.moduleSpecifier)
      ) {
        // `export * from '...'` — try the target; a miss here just means
        // the name lives in a different statement of this same file.
        const target = resolveSpecifier(
          filePath,
          statement.moduleSpecifier.text,
        );
        try {
          return findDeclarationJsDoc(target, name, visited);
        } catch (error) {
          // Only "the target module doesn't export this name" is an
          // expected miss when probing multiple `export *` re-exports —
          // anything else (unmapped path mapping, unresolvable specifier,
          // a resolver cycle) is a real bug and must not be swallowed.
          if (error instanceof DeclarationNotFoundError) continue;
          throw error;
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
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === name
        ) {
          return getLeadingCommentText(sourceFile, statement);
        }
      }
      continue;
    }

    if (isNamedDeclarationMatch(statement, name)) {
      return getLeadingCommentText(sourceFile, statement);
    }
  }

  throw new DeclarationNotFoundError(
    `Could not find declaration of '${name}' in ${filePath}`,
  );
}

/**
 * Resolves a name that is exported *without* a module specifier — either
 * imported from elsewhere in the same file (the common case: `import {
 * humanizeFieldPath } from '...'; export { humanizeFieldPath };`) or declared
 * directly in it without its own `export` modifier on the declaration itself.
 */
function resolveLocalName(
  sourceFile: ts.SourceFile,
  filePath: string,
  name: string,
  visited: Set<string>,
): string {
  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings) &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      for (const element of statement.importClause.namedBindings.elements) {
        if (element.name.text !== name) continue;
        const internalName = (element.propertyName ?? element.name).text;
        const target = resolveSpecifier(
          filePath,
          statement.moduleSpecifier.text,
        );
        return findDeclarationJsDoc(target, internalName, visited);
      }
    }
  }

  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === name
        ) {
          return getLeadingCommentText(sourceFile, statement);
        }
      }
    } else if (isNamedDeclarationMatch(statement, name)) {
      return getLeadingCommentText(sourceFile, statement);
    }
  }

  throw new Error(`Could not resolve local name '${name}' in ${filePath}`);
}

/** Every name the `/headless` barrel (`index.ts`) publicly exports. */
function collectBarrelExportNames(entryFile: string): string[] {
  const sourceFile = getSourceFile(entryFile);
  const names: string[] = [];

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          names.push(element.name.text);
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
        if (ts.isIdentifier(declaration.name))
          names.push(declaration.name.text);
      }
    } else if (
      ts.isClassDeclaration(statement) ||
      ts.isFunctionDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isEnumDeclaration(statement)
    ) {
      if (statement.name) names.push(statement.name.text);
    }
  }

  return names.toSorted();
}

const barrelExportNames = collectBarrelExportNames(headlessEntryFile);

describe('@ngx-signal-forms/toolkit/headless — @group JSDoc coverage (issue #360)', () => {
  it('found at least one export to check (barrel walk did not silently return empty)', () => {
    expect(barrelExportNames.length).toBeGreaterThan(50);
  });

  it.each(barrelExportNames)(
    '%s has a @group tag with a value from the documented taxonomy',
    (name) => {
      const jsDoc = findDeclarationJsDoc(headlessEntryFile, name);

      // Anchored to an actual JSDoc tag *line* (`^\s*\*\s*@group\s+...$`,
      // multiline) rather than a bare `@group` substring search — a
      // free-text mention in prose or an `@example` code block (e.g. "see
      // the @group tag on X") must NOT count as a real tag. `g` collects
      // every tag line in the comment so a duplicate `@group` tag is
      // visible instead of the first/last match winning silently.
      const tagLineRegex = /^[ \t]*\*[ \t]*@group[ \t]+(.+?)[ \t]*$/gmu;
      const matches = [...jsDoc.matchAll(tagLineRegex)];

      if (matches.length === 0) {
        throw new Error(
          `Expected a @group tag in the JSDoc for '${name}':\n${jsDoc}`,
        );
      }
      if (matches.length > 1) {
        const values = matches.map((m) => m[1]).join(', ');
        throw new Error(
          `'${name}' has ${matches.length} @group tags in its JSDoc ` +
            `(expected exactly 1): ${values}`,
        );
      }

      // A trailing ` */` (single-line-comment-close on the same line as the
      // tag) is the only thing the capture could still pick up beyond the
      // group name itself — strip it before comparing so
      // `@group Directives */` still validates as `Directives`.
      const value = matches[0][1].replace(/\*\/\s*$/u, '').trim();

      if (!(ALLOWED_GROUPS as readonly string[]).includes(value)) {
        throw new Error(
          `'${name}' has @group '${value}', which is not one of the ` +
            `documented sections: ${ALLOWED_GROUPS.join(', ')}`,
        );
      }

      expect(ALLOWED_GROUPS as readonly string[]).toContain(value);
    },
  );
});
