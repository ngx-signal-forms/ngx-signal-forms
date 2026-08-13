import { isDevMode } from '@angular/core';

/**
 * Mutable one-shot warning flag, held by the caller so each call site keeps
 * its own scoping (per-instance private field, per-invocation module-scope
 * `let`, …). {@link devWarnOnce} only ever flips `current` from `false` to
 * `true`; it never resets it — callers whose diagnostic should re-arm (e.g.
 * "warn again if the misconfiguration recurs after being fixed") reset
 * `current` themselves.
 *
 * @internal
 */
export interface WarnOnceRef {
  current: boolean;
}

/**
 * Emits a dev-mode console diagnostic at most once per `warned` ref.
 *
 * Collapses the repeated "dev-mode check → one-shot flag → console call"
 * shape used across the toolkit's misconfiguration diagnostics. No-ops
 * outside dev mode and after the first call for a given `warned` ref.
 *
 * @param warned Caller-owned one-shot flag — see {@link WarnOnceRef}.
 * @param level `'warn'` or `'error'` — the console method to call. Kept
 *   explicit per call site rather than defaulted, since sites disagree on
 *   severity (a config typo is an error; a silent focus() no-op is a warn).
 * @param message The diagnostic message. By convention, toolkit messages are
 *   prefixed `[ngx-signal-forms] <Component>: …`.
 * @param args Extra values forwarded verbatim to the console call (e.g. a
 *   DOM element for inspection, or a type descriptor) — never interpolated
 *   into `message` when they might carry user-entered data.
 *
 * @internal
 */
export function devWarnOnce(
  warned: WarnOnceRef,
  level: 'warn' | 'error',
  message: string,
  ...args: readonly unknown[]
): void {
  if (!isDevMode() || warned.current) {
    return;
  }
  warned.current = true;

  if (level === 'warn') {
    // oxlint-disable-next-line no-console -- dev-mode diagnostic, one-shot per `warned` ref
    console.warn(message, ...args);
  } else {
    // oxlint-disable-next-line no-console -- dev-mode diagnostic, one-shot per `warned` ref
    console.error(message, ...args);
  }
}

/**
 * Creates a bound {@link devWarnOnce} for call sites that don't already own
 * a per-instance field to hold the {@link WarnOnceRef} — factory functions
 * (`createXyz()`) that mint one closure-scoped warning per invocation, or a
 * module-scoped singleton warning shared for the process lifetime.
 *
 * @returns A function with the same `(level, message, ...args)` signature as
 *   {@link devWarnOnce}, pre-bound to a fresh, private `WarnOnceRef`.
 *
 * @example Per-invocation (factory)
 * ```typescript
 * export function createThing(options: Options) {
 *   const warnOnce = createDevWarnOnce();
 *   return computed(() => {
 *     if (somethingWrong) {
 *       warnOnce('warn', '[ngx-signal-forms] …');
 *     }
 *   });
 * }
 * ```
 *
 * @internal
 */
export function createDevWarnOnce(): (
  level: 'warn' | 'error',
  message: string,
  ...args: readonly unknown[]
) => void {
  const warned: WarnOnceRef = { current: false };
  return (level, message, ...args) => {
    devWarnOnce(warned, level, message, ...args);
  };
}
