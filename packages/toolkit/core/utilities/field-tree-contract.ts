import type { FieldState } from '@angular/forms/signals';

/**
 * Minimal `FieldState` surface toolkit utilities require when validating a
 * runtime `FieldTree` contract.
 */
export const REQUIRED_FIELD_STATE_METHODS = [
  'value',
  'touched',
  'errors',
  'errorSummary',
  'submitting',
  'markAsTouched',
] as const satisfies readonly (keyof FieldState<unknown>)[];

/**
 * Type guard verifying that `value` is the `FieldState` object produced by
 * calling `fieldTree`. The check confirms the back-pointer (`state.fieldTree
 * === fieldTree`) plus the presence of every method in
 * {@link REQUIRED_FIELD_STATE_METHODS}, which is enough for the toolkit's
 * runtime contract checks (`isFieldTree`, `walkFieldTreeEntries`).
 *
 * @param value - Candidate state object to validate.
 * @param fieldTree - The `FieldTree` callable that should own `value`.
 * @returns `true` when `value` matches the toolkit's required `FieldState`
 *   surface for `fieldTree`.
 */
export function isFieldStateForTree(
  value: unknown,
  fieldTree: object,
): value is FieldState<unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Reflect.get(value, 'fieldTree') !== fieldTree
  ) {
    return false;
  }

  for (const method of REQUIRED_FIELD_STATE_METHODS) {
    if (typeof Reflect.get(value, method) !== 'function') {
      return false;
    }
  }

  return true;
}
