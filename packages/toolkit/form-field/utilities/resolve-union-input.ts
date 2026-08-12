import { isDevMode } from '@angular/core';
import type { WarnOnceRef } from '@ngx-signal-forms/toolkit/core';

/**
 * Options for {@link resolveUnionInput}.
 *
 * Private to `/form-field` — its only two adapters, `NgxFormFieldWrapper`
 * and `NgxFormFieldset`, live in this package.
 */
interface ResolveUnionInputOptions<T extends string> {
  /** Component name prefixed to the dev-mode diagnostic, e.g. `'NgxFormFieldset'`. */
  readonly component: string;
  /** Input name reported in the diagnostic, e.g. `'appearance'`. */
  readonly prop: string;
  /** Value returned (and reported as the fallback) when `value` is not in `allowed`. */
  readonly fallback: T;
  /** Caller-owned one-shot flag — see {@link WarnOnceRef}. */
  readonly warned: WarnOnceRef;
  /**
   * Overrides the auto-generated `'a' | 'b'` list in the "Expected …"
   * clause. Use this when the input also accepts a value (e.g. `'inherit'`)
   * that is resolved *before* this call and therefore isn't in `allowed`,
   * but should still be documented to the caller as a legal literal.
   */
  readonly expectedLabel?: string | undefined;
  /**
   * Overrides the `'<fallback>'` wording in the "Falling back to …" clause.
   * Use this when `fallback` is a runtime/config-sourced value rather than a
   * fixed literal, so the message reads e.g. "the global default" instead of
   * quoting the resolved value.
   */
  readonly fallbackLabel?: string | undefined;
  /**
   * Extra remediation text appended verbatim after the "Falling back to …"
   * sentence (include leading whitespace/punctuation as needed — it is not
   * added automatically).
   */
  readonly hint?: string | undefined;
}

/**
 * Validates a string-union component input, warning once in dev mode and
 * falling back when the value isn't a recognized literal.
 *
 * Runtime validation matters here because dynamic bindings (template
 * attribute strings, JIT-compiled templates, config passed through from
 * untyped call sites) can feed an unknown literal past the compile-time
 * union type. Collapses the repeated "membership test → one-shot
 * `console.error` → fallback" shape shared by `NgxFormFieldWrapper` and
 * `NgxFormFieldset`'s string-union inputs (`appearance`, `orientation`,
 * `feedbackAppearance`, `validationSurface`, `surfaceTone`, …).
 *
 * @param value Raw input value to validate.
 * @param allowed The literals `value` must match to pass through unchanged.
 * @param options See {@link ResolveUnionInputOptions}.
 * @returns `value` unchanged when it matches `allowed`, otherwise `options.fallback`.
 */
export function resolveUnionInput<T extends string>(
  value: unknown,
  allowed: readonly T[],
  options: ResolveUnionInputOptions<T>,
): T {
  if ((allowed as readonly unknown[]).includes(value)) {
    return value as T;
  }

  if (isDevMode() && !options.warned.current) {
    options.warned.current = true;
    const expected =
      options.expectedLabel ??
      allowed.map((literal) => `'${literal}'`).join(' | ');
    const fallbackText = options.fallbackLabel ?? `'${options.fallback}'`;
    // oxlint-disable-next-line no-console -- dev-mode misconfiguration signal
    console.error(
      `[ngx-signal-forms] ${options.component}: unknown ${options.prop} "${String(value)}". ` +
        `Expected ${expected}. Falling back to ${fallbackText}.${options.hint ?? ''}`,
    );
  }

  return options.fallback;
}
