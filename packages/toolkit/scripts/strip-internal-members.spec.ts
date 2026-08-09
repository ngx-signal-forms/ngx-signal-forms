import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { stripNestedInternalMembers } from './strip-internal-members.mjs';

// Regression tests for the post-build hardening script that removes
// `@internal`-tagged class/interface members from the published `.d.ts`
// bundles — the part of #289 that `stripInternal` cannot safely do (see the
// script's own header comment for why the compiler flag is not viable here).
//
// Deliberately does NOT strip top-level `@internal` declarations: `/core`'s
// build-time-only plumbing (tokens, factories) is legitimately imported by
// sibling entries and `libs/debugger` at build time, and is already hidden
// from external consumers by `strip-internal-exports.mjs` deleting `"./core"`
// from the published `exports` map. Only members nested inside an otherwise
// public class/interface — reachable because the *class* is re-exported to
// real consumers — are an actual enforcement gap.

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

  it('leaves a top-level (depth 0) @internal declaration untouched', () => {
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

  it('removes a multi-line @internal interface nested inside another body', () => {
    const input = [
      'declare namespace Ns {',
      '    /**',
      '     * @internal',
      '     */',
      '    interface Options {',
      '        readonly a: string;',
      '        readonly b: number;',
      '    }',
      '    declare const kept: string;',
      '}',
      '',
    ].join('\n');

    const { text, removedCount } = stripNestedInternalMembers(input);

    expect(removedCount).toBe(1);
    expect(text).not.toContain('interface Options');
    expect(text).toContain('declare const kept: string;');
  });

  it('throws instead of silently corrupting output when a declaration never terminates', () => {
    const input = [
      'declare class Foo {',
      '    /**',
      '     * @internal',
      '     */',
      '    setValue(v: number)', // no trailing `;` or `}` — malformed on purpose
      '}',
      '',
    ].join('\n');

    expect(() => stripNestedInternalMembers(input)).toThrow(/never returned/u);
  });

  it('does not miscount a balanced brace pair from a template-literal type', () => {
    // `${number}` contributes one balanced `{`/`}` pair. A naive bracket
    // counter that got this wrong would either mis-bound the @internal
    // declaration above it or swallow the untagged sibling below it.
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
    // `libs/debugger` legitimately import it at build time, and it is
    // already unreachable externally via the stripped `"./core"` export.
    expect(core).toContain('NGX_ERROR_MESSAGES');
    expect(core).toContain('readonly fieldName: unknown;');
    expect(core).toContain('static ɵprov: unknown;');
  });

  it('fails loudly instead of publishing corrupted output when the structural-integrity guard trips', async () => {
    workDir = mkdtempSync(join(tmpdir(), 'strip-internal-members-'));
    const typesDir = join(workDir, 'dist/packages/toolkit/types');
    await mkdir(typesDir, { recursive: true });

    // An unbalanced brace inside a string literal (`'{'`) inside the
    // @internal member's own return type throws off the bracket-depth
    // counter: it "terminates" one line into the following sibling instead
    // of at the real declaration boundary, swallowing `static x` and the
    // class's own closing `}` — the bracket-count parser produces no
    // leftover `@internal` tag (so the older leftover-tag check would miss
    // this), but the result is not valid TypeScript. The structural-integrity
    // guard must catch it and fail the build instead of writing it.
    const original = [
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
    writeFileSync(
      join(typesDir, 'ngx-signal-forms-toolkit-core.d.ts'),
      original,
    );

    let failure: { status: number | null; stderr: string } | undefined;
    try {
      execFileSync(process.execPath, [scriptPath], {
        cwd: workDir,
        stdio: 'pipe',
        encoding: 'utf8',
      });
    } catch (error) {
      const execError = error as { status: number | null; stderr: string };
      failure = { status: execError.status, stderr: execError.stderr };
    }

    expect(failure).toBeDefined();
    expect(failure?.status).not.toBe(0);
    expect(failure?.stderr).toContain('[toolkit] ERROR');

    // The corrupted output must never be written — the source file on disk
    // is untouched.
    const onDisk = readFileSync(
      join(typesDir, 'ngx-signal-forms-toolkit-core.d.ts'),
      'utf8',
    );
    expect(onDisk).toBe(original);
  });
});
