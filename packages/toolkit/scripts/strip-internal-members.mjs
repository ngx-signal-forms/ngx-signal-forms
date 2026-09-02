#!/usr/bin/env node
// Post-build hardening for the `@ngx-signal-forms/toolkit` package.
//
// `@internal` is a JSDoc convention, not a TypeScript compiler barrier —
// `tsconfig.lib.json` deliberately does NOT set `stripInternal`, because
// enabling it breaks ng-packagr's declaration bundling for this package (see
// the `stripInternal` investigation linked from issue #289: the flag's
// interaction with ng-packagr's multi-entry-point `.d.ts` rollup drops
// unrelated, non-tagged public symbols from the bundle wholesale — a
// tooling defect, not something fixable by re-tagging individual symbols).
//
// Two different things carry the `@internal` tag in this package, and only
// one of them is a real external leak:
//
// 1. Top-level declarations inside the `/core` secondary entry (tokens,
//    factories, helper types) that sibling entries (`form-field`,
//    `assistive`, `headless`) and `libs/debugger` legitimately import at
//    build time. `/core` is already hidden from external consumers by
//    `strip-internal-exports.mjs`, which deletes `"./core"` from the
//    published `exports` map — so these are *already* unreachable from
//    outside the package. Stripping them here would break the legitimate
//    cross-entry/cross-project use case (see AGENTS.md note on
//    `libs/debugger` consuming `/core` internals), so this script leaves
//    them alone.
// 2. `@internal`-tagged *members* on an otherwise-public class, interface,
//    or namespace (e.g. `NgxFieldIdentity.setFieldName`) — the container
//    itself is re-exported to real consumers (the root barrel re-exports
//    `NgxFieldIdentity` from `/core` via a relative specifier that bypasses
//    the `exports` map), so every member TypeScript considers public —
//    regardless of the `@internal` tag — ships in the published `.d.ts` and
//    is callable. This is the actual "advisory, not enforced" gap #289
//    reports.
//
// This script removes exactly case (2): declarations whose JSDoc carries a
// real `@internal` tag AND that are direct members of a class, interface,
// or namespace (module) body are deleted — comment and signature — from the
// published `.d.ts`. Top-level statements (depth 0: not nested inside any
// such body) keep their `@internal` tag untouched, whatever form it takes.
//
// Uses the TypeScript compiler API (already a repo devDependency, pulled in
// for the structural-integrity guard below) rather than a line-based/regex
// scan: `ts.getJSDocTags` is TypeScript's own JSDoc parser, so it correctly
// recognizes every tag form (`/** @internal */` on one line, prose that only
// *mentions* `@internal` inside a sentence is never parsed as a tag, etc.)
// and AST membership — not brace counting — decides what counts as
// "nested", so a brace inside a string-literal type (e.g. `const x: '{';`)
// can't miscount a declaration's boundary the way a character scan could.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

/**
 * @param {ts.Node} node
 * @returns {boolean}
 */
function hasInternalTag(node) {
  const tags = ts.getJSDocTags(node);
  return tags.some((tag) => tag.tagName.text === 'internal');
}

/**
 * The direct member/statement list of `node`'s body, if `node` is a
 * class, interface, or namespace (module-with-a-block) declaration —
 * i.e. exactly the container kinds whose members are "nested" for the
 * purpose of this script. `undefined` for every other node kind, including
 * the source file itself (whose top-level statements are `/core`'s
 * intentionally-untouched build-time plumbing — see the file header).
 *
 * @param {ts.Node} node
 * @returns {readonly ts.Node[] | undefined}
 */
function containerMembers(node) {
  if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
    return node.members;
  }
  if (
    ts.isModuleDeclaration(node) &&
    node.body !== undefined &&
    ts.isModuleBlock(node.body)
  ) {
    return node.body.statements;
  }
  return undefined;
}

/**
 * @typedef {{ start: number, end: number }} RemovalSpan
 */

/**
 * Walks `sourceFile`'s AST and collects the character spans of every
 * `@internal`-tagged declaration that is a direct member of a class,
 * interface, or namespace body. Each span covers the declaration's leading
 * JSDoc comment (if any) through its own end, plus one trailing line break
 * so removal doesn't leave a blank line behind.
 *
 * @param {ts.SourceFile} sourceFile
 * @returns {RemovalSpan[]}
 */
function collectInternalMemberSpans(sourceFile) {
  /** @type {RemovalSpan[]} */
  const spans = [];

  /**
   * @param {ts.Node} node
   * @returns {void}
   */
  function visit(node) {
    const members = containerMembers(node);
    if (members !== undefined) {
      for (const member of members) {
        if (hasInternalTag(member)) spans.push(removalSpanFor(member));
      }
    }
    ts.forEachChild(node, visit);
  }

  /**
   * @param {ts.Node} node
   * @returns {RemovalSpan}
   */
  function removalSpanFor(node) {
    const fullStart = node.getFullStart();
    const leadingComments =
      ts.getLeadingCommentRanges(sourceFile.text, fullStart) ?? [];
    let start =
      leadingComments.length > 0
        ? leadingComments[0].pos
        : node.getStart(sourceFile);
    // Also remove the declaration's own indentation — walk `start` back
    // over horizontal whitespace to the start of its line, so the removal
    // doesn't leave a blank, whitespace-only line behind.
    while (start > 0 && /[ \t]/u.test(sourceFile.text[start - 1])) start--;

    let end = node.getEnd();
    // Consume trailing horizontal whitespace and a single line break so the
    // removal doesn't leave a blank line where the declaration used to be.
    while (end < sourceFile.text.length && /[ \t]/u.test(sourceFile.text[end]))
      end++;
    if (sourceFile.text[end] === '\r') end++;
    if (sourceFile.text[end] === '\n') end++;

    return { start, end };
  }

  visit(sourceFile);
  return spans;
}

/**
 * Removes `@internal`-tagged declarations that are direct members of a
 * class, interface, or namespace body from `content`. Returns the
 * rewritten text and the count of declarations removed.
 *
 * Top-level (not-nested) `@internal` declarations are left untouched — see
 * the file header for why.
 *
 * @param {string} content
 * @param {string} [fileName]
 * @returns {{ text: string, removedCount: number }}
 */
export function stripNestedInternalMembers(content, fileName = 'input.d.ts') {
  const sourceFile = ts.createSourceFile(
    fileName,
    content,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );
  const spans = collectInternalMemberSpans(sourceFile).toSorted(
    (a, b) => a.start - b.start,
  );

  let text = content;
  // Remove from the end backwards so earlier spans' offsets stay valid.
  for (let i = spans.length - 1; i >= 0; i--) {
    const span = spans[i];
    text = text.slice(0, span.start) + text.slice(span.end);
  }

  return { text, removedCount: spans.length };
}

/**
 * Belt-and-braces check: re-parses `content` and re-runs the same AST walk
 * `stripNestedInternalMembers` uses. If it finds any remaining nested
 * `@internal` declaration, stripping missed it — fail loudly rather than
 * publish a symbol #289 says must be enforced. Run unconditionally on every
 * file, not just ones `stripNestedInternalMembers` touched, so a bug that
 * makes the stripper under-count (`removedCount` wrongly 0) can't hide
 * behind that early exit.
 *
 * @param {string} content
 * @param {string} filePath
 * @returns {void}
 */
function assertNoNestedInternalTagsRemain(content, filePath) {
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );
  const leftover = collectInternalMemberSpans(sourceFile);
  if (leftover.length === 0) return;
  throw new Error(
    `${filePath} still has ${leftover.length} nested @internal ` +
      `declaration(s) after stripping. The stripper missed a declaration ` +
      `shape — fix it before publishing.`,
  );
}

/**
 * Structural-integrity guard: even though spans are now derived from a real
 * parse of the *original* text (not a character-counting heuristic),
 * splicing those spans out of the raw string is still a textual edit that
 * could — given a bug in `removalSpanFor`'s boundary math — cut through a
 * token instead of between declarations.
 *
 * Parses the post-strip text and fails loudly on any syntax error, so such
 * a bug is a hard build failure instead of a silently corrupted published
 * `.d.ts`.
 *
 * @param {string} content
 * @param {string} filePath
 * @returns {void}
 */
function assertValidSyntax(content, filePath) {
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );
  // `parseDiagnostics` isn't part of the public `ts.SourceFile` type, but is
  // populated by `createSourceFile` and is the standard way declaration
  // tooling (e.g. dts bundlers) gets syntax-only diagnostics without
  // building a full `ts.Program`.
  const diagnostics =
    /** @type {{ parseDiagnostics?: readonly import('typescript').Diagnostic[] }} */ (
      sourceFile
    ).parseDiagnostics ?? [];
  if (diagnostics.length === 0) return;

  const messages = diagnostics.map((diagnostic) => {
    const position =
      diagnostic.file && diagnostic.start !== undefined
        ? ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start)
        : { line: 0, character: 0 };
    const text = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
    return `  ${filePath}:${position.line + 1}:${position.character + 1} ${text}`;
  });
  throw new Error(
    `${filePath} is not valid TypeScript after stripping @internal ` +
      `members — the structural-integrity guard tripped (a span-removal ` +
      `bug likely cut through a token):\n` +
      messages.join('\n'),
  );
}

function main() {
  const typesDir = resolve('dist/packages/toolkit/types');
  const dtsFiles = readdirSync(typesDir).filter((/** @type {string} */ name) =>
    name.endsWith('.d.ts'),
  );
  let totalRemoved = 0;
  /** @type {string[]} */
  const touchedFiles = [];

  for (const name of dtsFiles) {
    const filePath = join(typesDir, name);
    const content = readFileSync(filePath, 'utf8');
    const { text, removedCount } = stripNestedInternalMembers(content, name);

    // Unconditional: a bug that makes `removedCount` wrongly 0 must not be
    // able to skip this check by short-circuiting before it runs.
    assertNoNestedInternalTagsRemain(text, name);
    if (removedCount === 0) continue;

    assertValidSyntax(text, name);
    writeFileSync(filePath, text);
    totalRemoved += removedCount;
    touchedFiles.push(`${name} (${removedCount})`);
  }

  console.log(
    totalRemoved === 0
      ? '[toolkit] no nested @internal class/interface/namespace members found to strip'
      : `[toolkit] stripped ${totalRemoved} @internal class/interface/namespace member(s): ${touchedFiles.join(', ')}`,
  );
}

// Only run as a CLI — importing this module (e.g. from the unit tests for
// `stripNestedInternalMembers`) must not have the side effect of scanning
// `dist/`, which may not exist yet in the importing process's cwd. Errors
// are converted to `console.error` + a non-zero exit here, matching
// `strip-internal-exports.mjs`'s convention (its spec asserts on stderr
// text, not a stack trace) — the pure functions above still throw raw
// `Error`s, which is what the unit tests below assert on directly.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[toolkit] ERROR: ${message}`);
    process.exit(1);
  }
}
