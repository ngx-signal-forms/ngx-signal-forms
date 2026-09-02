import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { stripNestedInternalMembers } from './strip-internal-members.mjs';

// Regression tests for the post-build hardening script that removes
// `@internal`-tagged class/interface/namespace members from the published
// `.d.ts` bundles — the part of #289 that `stripInternal` cannot safely do
// (see the script's own header comment for why the compiler flag is not
// viable here).
//
// Deliberately does NOT strip top-level `@internal` declarations: `/core`'s
// build-time-only plumbing (tokens, factories) is legitimately imported by
// sibling entries and `packages/demo/debugger` at build time, and is already hidden
// from external consumers by `strip-internal-exports.mjs` deleting `"./core"`
// from the published `exports` map. Only members nested inside an otherwise
// public class/interface/namespace — reachable because the *container* is
// re-exported to real consumers — are an actual enforcement gap.
//
// The scan is TS-AST-based (`ts.getJSDocTags` + real container membership),
// not a line/regex/bracket-counting scan, so it correctly handles every
// `@internal` tag form and can't be confused by braces inside string or
// template-literal types.

const scriptPath = resolve(import.meta.dirname, './strip-internal-members.mjs');

describe('stripNestedInternalMembers (unit)', () => {
  it('removes a single-line @internal method from a class body', () => {
    const input = [
      'declare class Foo {',
      '    /**',
      '     * Reads a value.',
      '     */',
      '    readonly value: number;',
      '    /**',
      '     * Writes a value. Package-internal.',
      '     * @internal',
      '     */',
      '    setValue(v: number): void;',
      '    static ɵfac: unknown;',
      '}',
      '',
    ].join('\n');

    const { text, removedCount } = stripNestedInternalMembers(input);

    expect(removedCount).toBe(1);
    expect(text).not.toContain('setValue');
    expect(text).not.toContain('@internal');
    expect(text).toContain('readonly value: number;');
    expect(text).toContain('static ɵfac: unknown;');
  });

  it('recognizes a one-line `/** @internal */` tag, not just the multi-line form', () => {
    // A regex/line scan anchored on `@internal` standing alone on its own
    // comment line misses this — `ts.getJSDocTags` (real JSDoc parsing)
    // handles it natively regardless of comment layout.
    const input = [
      'declare class Foo {',
      '    readonly value: number;',
      '    /** @internal */',
      '    setValue(v: number): void;',
      '}',
      '',
    ].join('\n');

    const { text, removedCount } = stripNestedInternalMembers(input);

    expect(removedCount).toBe(1);
    expect(text).not.toContain('setValue');
    expect(text).toContain('readonly value: number;');
  });

  it('leaves a top-level (not-nested) @internal declaration untouched', () => {
    const input = [
      '/**',
      ' * Build-time-only plumbing for sibling entries.',
      ' * @internal',
      ' */',
      'declare const INTERNAL_TOKEN: unknown;',
      'declare class Foo {',
      '}',
      '',
    ].join('\n');

    const { text, removedCount } = stripNestedInternalMembers(input);

    expect(removedCount).toBe(0);
    expect(text).toBe(input);
  });

  it('does not strip a comment that merely mentions `@internal` in prose', () => {
    const input = [
      'declare class Foo {',
      '    /**',
      '     * The `set*` writers are tagged `@internal` and must not be called',
      '     * from outside this package.',
      '     */',
      '    readonly value: number;',
      '}',
      '',
    ].join('\n');

    const { text, removedCount } = stripNestedInternalMembers(input);

    expect(removedCount).toBe(0);
    expect(text).toBe(input);
  });

  it('removes a multi-line @internal interface nested inside a namespace body', () => {
    const input = [
      'declare namespace Ns {',
      '    /**',
      '     * @internal',
      '     */',
      '    interface Options {',
      '        readonly a: string;',
      '        readonly b: number;',
      '    }',
      '    const kept: string;',
      '}',
      '',
    ].join('\n');

    const { text, removedCount } = stripNestedInternalMembers(input);

    expect(removedCount).toBe(1);
    expect(text).not.toContain('interface Options');
    expect(text).toContain('const kept: string;');
  });

  it('produces a syntactically valid empty class body when the only member is @internal', () => {
    // Regression guard for the removal-span boundary: it must delete
    // exactly the member (comment + declaration), never the container's own
    // opening/closing braces, even when nothing else is left inside.
    const input = [
      'declare class OnlyInternal {',
      '    /**',
      '     * @internal',
      '     */',
      '    setValue(v: number): void;',
      '}',
      '',
    ].join('\n');

    const { text, removedCount } = stripNestedInternalMembers(input);

    expect(removedCount).toBe(1);
    expect(text).toContain('declare class OnlyInternal {\n}');
  });

  it('does not miscount a brace inside a string-literal type', () => {
    // `weird(): '{' | void;` contains an unbalanced `{` as far as a naive
    // character scan is concerned — real AST parsing sees it correctly as
    // part of a string-literal type, not a body brace, so it can never
    // mis-bound the declaration above or below it.
    const input = [
      'declare class Foo {',
      '    readonly ok: string;',
      '    /**',
      '     * @internal',
      '     */',
      "    weird(): '{' | void;",
      '    static x: number;',
      '}',
      '',
    ].join('\n');

    const { text, removedCount } = stripNestedInternalMembers(input);

    expect(removedCount).toBe(1);
    expect(text).not.toContain('weird');
    expect(text).toContain('readonly ok: string;');
    expect(text).toContain('static x: number;');
    expect(text).toContain('declare class Foo {');
    expect(text.trim().endsWith('}')).toBe(true);
  });

  it('does not miscount a balanced brace pair from a template-literal type', () => {
    const input = [
      'declare class Foo {',
      '    /**',
      '     * @internal',
      '     */',
      '    setValue(v: number): void;',
      '    readonly kind: `Point<${number}>`;',
      '    readonly sibling: string;',
      '}',
      '',
    ].join('\n');

    const { text, removedCount } = stripNestedInternalMembers(input);

    expect(removedCount).toBe(1);
    expect(text).not.toContain('setValue');
    expect(text).toContain('readonly kind: `Point<${number}>`;');
    expect(text).toContain('readonly sibling: string;');
  });
});

describe('strip-internal-members.mjs (CLI)', () => {
  let workDir: string | undefined;

  afterEach(() => {
    if (workDir !== undefined)
      rmSync(workDir, { recursive: true, force: true });
  });

  it('strips nested @internal members across every .d.ts in dist/packages/toolkit/types', async () => {
    workDir = mkdtempSync(join(tmpdir(), 'strip-internal-members-'));
    const typesDir = join(workDir, 'dist/packages/toolkit/types');
    await mkdir(typesDir, { recursive: true });

    writeFileSync(
      join(typesDir, 'ngx-signal-forms-toolkit-core.d.ts'),
      [
        'declare class NgxFieldIdentity {',
        '    readonly fieldName: unknown;',
        '    /**',
        '     * @internal',
        '     */',
        '    setFieldName(name: string | null): void;',
        '    static ɵprov: unknown;',
        '}',
        '/**',
        ' * @internal',
        ' */',
        'declare const NGX_ERROR_MESSAGES: unknown;',
        '',
      ].join('\n'),
    );
    writeFileSync(
      join(typesDir, 'ngx-signal-forms-toolkit-assistive.d.ts'),
      'export declare class NgxFormFieldError {\n}\n',
    );

    execFileSync(process.execPath, [scriptPath], { cwd: workDir });

    const core = readFileSync(
      join(typesDir, 'ngx-signal-forms-toolkit-core.d.ts'),
      'utf8',
    );
    // The class member is gone (the actual enforcement gap).
    expect(core).not.toContain('setFieldName');
    // The top-level `/core`-only token survives — sibling entries and
    // `packages/demo/debugger` legitimately import it at build time, and it is
    // already unreachable externally via the stripped `"./core"` export.
    expect(core).toContain('NGX_ERROR_MESSAGES');
    expect(core).toContain('readonly fieldName: unknown;');
    expect(core).toContain('static ɵprov: unknown;');
  });

  it('strips a member whose signature contains a brace inside a string-literal type without tripping the guard', async () => {
    // Regression test for the bracket-counting bug the AST rewrite fixes:
    // this exact shape used to make the old character-scanning
    // implementation swallow the untagged sibling and the class's own
    // closing brace, which the structural-integrity guard correctly caught
    // as invalid output. With real AST parsing this now just works —
    // assert the correct output, not a thrown error.
    workDir = mkdtempSync(join(tmpdir(), 'strip-internal-members-'));
    const typesDir = join(workDir, 'dist/packages/toolkit/types');
    await mkdir(typesDir, { recursive: true });

    writeFileSync(
      join(typesDir, 'ngx-signal-forms-toolkit-core.d.ts'),
      [
        'declare class Foo {',
        '    readonly ok: string;',
        '    /**',
        '     * @internal',
        '     */',
        "    weird(): '{' | void;",
        '    static x: number;',
        '}',
        '',
      ].join('\n'),
    );

    execFileSync(process.execPath, [scriptPath], { cwd: workDir });

    const core = readFileSync(
      join(typesDir, 'ngx-signal-forms-toolkit-core.d.ts'),
      'utf8',
    );
    expect(core).not.toContain('weird');
    expect(core).toContain('readonly ok: string;');
    expect(core).toContain('static x: number;');
    expect(core.trim().endsWith('}')).toBe(true);
  });
});
