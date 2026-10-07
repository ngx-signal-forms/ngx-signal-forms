// Fails when a doc still names a toolkit API that no longer exists.
//
// Two rules, run over every tracked Markdown file outside the removal
// records (migration guides, ADRs, archived reviews and the two skill pages
// that map removed names to their replacements):
//
// 1. A name in `removed-symbols.json` must not appear. The registry also
//    must not name anything a public api-report still exports.
// 2. An `Ngx*` name must be declared in a tracked `.ts` file. This catches
//    a renamed or deleted class, directive or type without a registry entry.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

export const REMOVAL_RECORDS = [
  /^docs\/migrations\//u,
  /^docs\/MIGRATING_[^/]+\.md$/u,
  /^docs\/decisions\//u,
  /^\.agents\/review\//u,
  /^\.agents\/skills\/ngx-signal-forms\/migrations\//u,
  /^\.agents\/skills\/ngx-signal-forms\/references\/pitfalls\.md$/u,
];

const DECLARATION_KINDS = new Set([
  ts.SyntaxKind.ClassDeclaration,
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.InterfaceDeclaration,
  ts.SyntaxKind.TypeAliasDeclaration,
  ts.SyntaxKind.EnumDeclaration,
  ts.SyntaxKind.VariableDeclaration,
  // The `NgxY` in `export { x as NgxY }`.
  ts.SyntaxKind.ExportSpecifier,
]);

/**
 * Collects declared names from parsed syntax, so a declaration inside a
 * comment, JSDoc example or string does not count.
 *
 * @param {string} source
 * @param {Set<string>} into
 */
function collectDeclaredNames(source, into) {
  const visit = (node) => {
    if (
      DECLARATION_KINDS.has(node.kind) &&
      node.name &&
      ts.isIdentifier(node.name)
    )
      into.add(node.name.text);
    ts.forEachChild(node, visit);
  };
  visit(ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest));
}

/**
 * Collects the names an API report exports: its `export { … }` clauses and
 * any top-level declaration with an `export` modifier. A name that the
 * report only mentions in JSDoc does not count.
 *
 * @param {string} report
 * @param {Set<string>} into
 */
function collectExportedNames(report, into) {
  const file = ts.createSourceFile(
    'report.d.ts',
    report,
    ts.ScriptTarget.Latest,
  );
  for (const statement of file.statements) {
    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements)
        into.add(element.name.text);
    } else if (
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    ) {
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations)
          if (ts.isIdentifier(declaration.name))
            into.add(declaration.name.text);
      } else if (statement.name && ts.isIdentifier(statement.name)) {
        into.add(statement.name.text);
      }
    }
  }
}

/**
 * @param {{
 *   docs: Map<string, string>,
 *   sources: string[],
 *   apiReports: Map<string, string>,
 *   removed: string[],
 * }} input `apiReports` maps each report path to its text.
 * @returns {string[]} one message per problem
 */
export function checkRemovedSymbols({ docs, sources, apiReports, removed }) {
  const errors = [];
  const exported = new Set();
  for (const [path, report] of apiReports)
    // A name that moved to the internal `/core` entry point counts as removed.
    if (!path.endsWith('core.internal.d.ts'))
      collectExportedNames(report, exported);
  for (const name of removed) {
    if (exported.has(name))
      errors.push(
        `removed-symbols.json lists ${name}, but the api-reports still export it`,
      );
  }

  const declared = new Set();
  for (const source of sources) collectDeclaredNames(source, declared);

  const removedPattern = new RegExp(`\\b(${removed.join('|')})\\b`, 'gu');
  for (const [path, text] of docs) {
    if (REMOVAL_RECORDS.some((record) => record.test(path))) continue;
    text.split('\n').forEach((line, index) => {
      const at = `${path}:${index + 1}`;
      if (removed.length > 0)
        for (const [name] of line.matchAll(removedPattern))
          errors.push(`${at}: names removed API ${name}`);
      for (const [name] of line.matchAll(/\bNgx[A-Z]\w*/gu))
        if (!declared.has(name))
          errors.push(`${at}: names ${name}, which no .ts file declares`);
    });
  }
  return errors;
}

function tracked(...patterns) {
  return execFileSync('git', ['ls-files', '-z', '--', ...patterns], {
    encoding: 'utf8',
  })
    .split('\0')
    .filter((path) => path && existsSync(path));
}

function main() {
  const { symbols } = JSON.parse(
    readFileSync(new URL('removed-symbols.json', import.meta.url), 'utf8'),
  );
  const read = (path) => readFileSync(path, 'utf8');
  const errors = checkRemovedSymbols({
    docs: new Map(tracked('*.md').map((path) => [path, read(path)])),
    sources: tracked('*.ts', '*.mts').map(read),
    apiReports: new Map(
      tracked('packages/toolkit/api-reports/*.d.ts').map((path) => [
        path,
        read(path),
      ]),
    ),
    removed: symbols,
  });
  for (const error of errors) console.error(error);
  if (errors.length > 0) {
    console.error(
      `\n${errors.length} stale API reference(s). Update the doc, or see docs/CONTRIBUTING.md#removing-a-public-export.`,
    );
    process.exitCode = 1;
  }
}

if (resolve(process.argv[1] ?? '') === import.meta.filename) main();
