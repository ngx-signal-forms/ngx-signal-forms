import { isDevMode } from '@angular/core';
import type { FieldState, FieldTree } from '@angular/forms/signals';
import { isFieldStateInteractive } from './field-interactivity';

/**
 * Focus the first **focusable** invalid field in a form after failed submission.
 *
 * Iterates `errorSummary()` and focuses the first error whose bound field is
 * both interactive (not `hidden()` or `disabled()`) and exposes a
 * `focusBoundControl()` method. Skips errors that point at fields the user
 * cannot interact with — focusing them would either throw (no DOM element) or
 * strand focus on a non-interactive control.
 *
 * `readonly()` fields are **not** skipped: they are visible, focusable, and
 * the validation error is usually still meaningful to the user even though
 * they cannot edit the value directly.
 *
 * @param formTree The root form tree to search for invalid fields
 * @returns `true` if a focusable invalid field was found and focused, `false` otherwise
 *
 * @example With declarative submission
 * ```typescript
 * const myForm = form(this.#data, validators, {
 *   submission: {
 *     action: async (field) => { ... },
 *     onInvalid: createOnInvalidHandler(), // uses focusFirstInvalid internally
 *   },
 * });
 * ```
 *
 * @remarks
 * Custom controls must call `registerAsBinding()` for `focusBoundControl()` to work.
 *
 * Angular Signal Forms documents that a hidden field "is ignored when
 * determining the valid, touched, and dirty states" but does not guarantee its
 * errors are absent from `errorSummary()`. The filter below is defensive and
 * becomes a no-op if Angular starts excluding them.
 *
 * ## Default-policy asymmetry vs `isErrorOnInteractiveField`
 *
 * When an error has no `fieldTree` (or a malformed one), this function
 * **skips** it: there is nothing to focus, and silently focusing an
 * unrelated field would be worse than skipping. The error-surfacing
 * predicate `isErrorOnInteractiveField` in
 * `packages/toolkit/headless/src/lib/utilities.ts` takes the inverse
 * default — it returns `true` and **shows** the error, because silently
 * hiding a validation message from the user is the worst outcome.
 * Both policies are deliberate and documented in-place; do not
 * "normalize" them without understanding the blast radius.
 *
 * @public
 */
export function focusFirstInvalid(formTree: FieldTree<unknown>): boolean {
  const errors = formTree().errorSummary();
  if (!Array.isArray(errors) || errors.length === 0) return false;

  // `errorSummary()` is the framework's own flat traversal of the field tree:
  // every entry carries a `fieldTree` back-reference whose call yields the
  // owning `FieldState`. No bespoke walk or contract guard is needed — read
  // the native list and resolve each error's state directly.
  for (const error of errors) {
    if (typeof error.fieldTree !== 'function') continue;

    // `error.fieldTree()` is typed non-null, but a malformed runtime payload
    // (custom control wiring mistake, hand-rolled error) can still yield
    // null — widen so the defensive guard below is legitimate.
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- widening to include the malformed-runtime null branch the guard handles.
    const fieldState = error.fieldTree() as FieldState<unknown> | undefined;

    if (!fieldState || typeof fieldState.focusBoundControl !== 'function') {
      continue;
    }

    if (!isFieldStateInteractive(fieldState)) continue;

    fieldState.focusBoundControl();
    return true;
  }

  // The form is invalid but every error was filtered out: no bound control,
  // missing fieldTree, or every candidate is non-interactive. This typically
  // means a custom control forgot to call `registerAsBinding()`, so the user
  // sees the error message but focus is stranded wherever the submit button
  // was. Warn in dev mode so the wiring mistake is obvious.
  if (isDevMode()) {
    console.warn(
      '[ngx-signal-forms] focusFirstInvalid() found validation errors but ' +
        'could not focus any of them. Typical cause: a custom control is ' +
        'missing `registerAsBinding()` so its `focusBoundControl()` is ' +
        'unavailable. Fields hidden or disabled via `hidden()`/`disabled()` ' +
        'are deliberately skipped.',
    );
  }

  return false;
}
