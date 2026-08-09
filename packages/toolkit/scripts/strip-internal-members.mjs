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
// 2. `@internal`-tagged *members* on an otherwise-public class (e.g.
//    `NgxFieldIdentity.setFieldName`) — the class itself is re-exported to
//    real consumers (the root barrel re-exports `NgxFieldIdentity` from
//    `/core` via a relative specifier that bypasses the `exports` map), so
//    every member TypeScript considers public — regardless of the
//    `@internal` tag — ships in the published `.d.ts` and is callable.
//    This is the actual "advisory, not enforced" gap #289 reports.
//
// This script removes case (2): any `@internal`-tagged declaration nested
// inside a class or interface body (bracket depth > 0) is deleted from the
// published `.d.ts`, verbatim comment and signature. Top-level (depth 0)
// `@internal` declarations are left untouched.
//
// Detecting "the real tag" vs. prose that merely *mentions* `@internal`
// inside a sentence (several doc comments in this codebase read like
// "...tagged `@internal`...") requires matching the tag on its own line,
// not just the substring.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// A real `@internal` JSDoc tag stands alone on its comment line (optionally
// followed by trailing whitespace only). Prose that references `@internal`
// inside a sentence always has more text after it on the same line.
const INTERNAL_TAG_LINE = /^\s*\*\s*@internal\s*$/u;

/**
 * Net bracket delta for a line of TypeScript declaration source. Counts
 * `{`/`(` as +1 and `}`/`)` as -1. Declaration files in this package don't
 * contain string or template literals with unbalanced brackets, so a naive
 * character scan is sufficient — no tokenizer needed.
 *
 * @param {string} line
 * @returns {number}
 */
function bracketDelta(line) {
  let delta = 0;
  for (const ch of line) {
    if (ch === '{' || ch === '(') delta++;
    else if (ch === '}' || ch === ')') delta--;
  }
  return delta;
}

/**
 * Reads a full `/** ... *\/` comment block starting at `lines[start]`.
 * Returns the block's lines, whether it contains a real `@internal` tag, and
 * the index of the first line after the block.
 *
 * @param {readonly string[]} lines
 * @param {number} start
 * @returns {{ commentLines: string[], sawInternal: boolean, next: number }}
 */
function readCommentBlock(lines, start) {
  /** @type {string[]} */
  const commentLines = [];
  let sawInternal = false;
  let index = start;
  for (; index < lines.length; index++) {
    const commentLine = lines[index] ?? '';
    commentLines.push(commentLine);
    if (INTERNAL_TAG_LINE.test(commentLine)) sawInternal = true;
    if (commentLine.trim().endsWith('*/')) {
      index++;
      break;
    }
  }
  return { commentLines, sawInternal, next: index };
}

/**
 * Finds the end of the declaration that starts at `lines[start]`, given the
 * bracket depth immediately before it (`baseDepth`). The declaration ends on
 * the first line where the running depth returns to `baseDepth` and the line
 * terminates a statement (`;`) or closes a body (bare `}` or `};`).
 *
 * @param {readonly string[]} lines
 * @param {number} start
 * @param {number} baseDepth
 * @returns {number} Index of the first line after the declaration.
 */
function findDeclarationEnd(lines, start, baseDepth) {
  let depth = baseDepth;
  for (let index = start; index < lines.length; index++) {
    const declLine = lines[index] ?? '';
    depth += bracketDelta(declLine);
    const trimmed = declLine.trim();
    const terminates =
      trimmed.endsWith(';') || trimmed === '}' || trimmed.endsWith('};');
    if (depth === baseDepth && terminates) return index + 1;
  }
  throw new Error(
    `Could not find the end of the @internal declaration starting at line ` +
      `${start + 1} — bracket depth never returned to ${baseDepth}. ` +
      `Refusing to guess; fix the parser or the declaration shape.`,
  );
}

/**
 * Removes `@internal`-tagged declarations that are nested inside a class or
 * interface body (i.e. appear at bracket depth > 0) from `content`. Returns
 * the rewritten text and the count of declarations removed.
 *
 * Top-level (depth 0) `@internal` declarations are left untouched — see the
 * file header for why.
 *
 * @param {string} content
 * @returns {{ text: string, removedCount: number }}
 */
export function stripNestedInternalMembers(content) {
  const lines = content.split('\n');
  /** @type {string[]} */
  const out = [];
  let depth = 0;
  let removedCount = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (!line.trim().startsWith('/**')) {
      out.push(line);
      depth += bracketDelta(line);
      i++;
      continue;
    }

    const { commentLines, sawInternal, next } = readCommentBlock(lines, i);
    if (!sawInternal || depth <= 0) {
      // Top-level `@internal` (or non-internal) comment — keep verbatim.
      out.push(...commentLines);
      i = next;
      continue;
    }

    // Nested `@internal` declaration — drop the comment and the declaration
    // it documents, then resume scanning from what follows.
    const baseDepth = depth;
    const declEnd = findDeclarationEnd(lines, next, baseDepth);
    for (let k = next; k < declEnd; k++) depth += bracketDelta(lines[k] ?? '');
    removedCount++;
    i = declEnd;
  }

  return { text: out.join('\n'), removedCount };
}

/**
 * Fails loudly if any `@internal`-tagged declaration remains nested inside a
 * class/interface body after stripping — a silent parser miss would leave
 * an "enforced" symbol reachable, defeating the point of this script.
 *
 * @param {string} content
 * @param {string} filePath
 * @returns {void}
 */
function assertNoNestedInternalTagsRemain(content, filePath) {
  const lines = content.split('\n');
  let depth = 0;
  for (const [index, line] of lines.entries()) {
    if (INTERNAL_TAG_LINE.test(line) && depth > 0) {
      throw new Error(
        `${filePath}:${index + 1} still has a nested @internal tag at ` +
          `depth ${depth} after stripping. The parser missed a declaration ` +
          `shape — fix it before publishing.`,
      );
    }
    depth += bracketDelta(line);
  }
}

/**
 * Structural-integrity guard: `stripNestedInternalMembers`'s bracket-depth
 * scan is a naive character count, not a real parser. Given the wrong input
 * shape it could mis-bound a declaration — swallowing part of an untagged
 * sibling, or leaving a dangling brace behind — and produce output that
 * *looks* plausible (no leftover `@internal` tag, so
 * `assertNoNestedInternalTagsRemain` would miss it) but is not valid
 * TypeScript.
 *
 * Parses the post-strip text with the real TypeScript parser and fails
 * loudly on any syntax error, so a bracket-counting bug is a hard build
 * failure instead of a silently corrupted published `.d.ts`.
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
      `members — the structural-integrity guard tripped (a bracket-depth ` +
      `miscount likely swallowed or mis-bounded a declaration):\n` +
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
    const { text, removedCount } = stripNestedInternalMembers(content);
    if (removedCount === 0) continue;

    assertNoNestedInternalTagsRemain(text, name);
    assertValidSyntax(text, name);
    writeFileSync(filePath, text);
    totalRemoved += removedCount;
    touchedFiles.push(`${name} (${removedCount})`);
  }

  console.log(
    totalRemoved === 0
      ? '[toolkit] no nested @internal class/interface members found to strip'
      : `[toolkit] stripped ${totalRemoved} @internal class/interface member(s): ${touchedFiles.join(', ')}`,
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
