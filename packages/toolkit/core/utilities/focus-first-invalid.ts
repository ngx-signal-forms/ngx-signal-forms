import type { FieldTree } from '@angular/forms/signals';
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
 * @public
 */
export function focusFirstInvalid(formTree: FieldTree<unknown>): boolean {
  const errors = formTree().errorSummary();
  if (!Array.isArray(errors) || errors.length === 0) return false;

  for (const error of errors) {
    if (typeof error.fieldTree !== 'function') continue;

    const fieldState = error.fieldTree();

    if (!fieldState || typeof fieldState.focusBoundControl !== 'function') {
      continue;
    }

    if (!isFieldStateInteractive(fieldState)) continue;

    fieldState.focusBoundControl();
    return true;
  }

  return false;
}
