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
