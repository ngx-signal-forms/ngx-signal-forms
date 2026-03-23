import type { FieldTree } from '@angular/forms/signals';

/**
 * Focus the first invalid field in a form after failed submission.
 *
 * Uses Angular's native `focusBoundControl()` on the first error from `errorSummary()`.
 *
 * @param formTree The root form tree to search for invalid fields
 * @returns `true` if an invalid field was found and focused, `false` otherwise
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
 * @public
 */
export function focusFirstInvalid(formTree: FieldTree<unknown>): boolean {
  const errors = formTree().errorSummary();
  if (!Array.isArray(errors) || errors.length === 0) return false;

  const firstError = errors[0];

  if (typeof firstError.fieldTree !== 'function') {
    return false;
  }

  const fieldState = firstError.fieldTree();

  if (!fieldState || typeof fieldState.focusBoundControl !== 'function') {
    return false;
  }

  fieldState.focusBoundControl();
  return true;
}
