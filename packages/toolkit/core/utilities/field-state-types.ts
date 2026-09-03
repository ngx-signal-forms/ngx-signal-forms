import type { FieldState } from '@angular/forms/signals';

/**
 * Minimal FieldState contract required for error visibility decisions.
 */
export type ErrorVisibilityState = Pick<
  FieldState<unknown>,
  'invalid' | 'touched'
>;

/**
 * Minimal FieldState contract required for warning visibility decisions.
 *
 * Reads `errors` rather than `invalid` because warnings are non-blocking:
 * the warning channel gates on warning *presence* (`warn:` kinds), while a
 * field that is invalid for a blocking reason has nothing to say here.
 */
export type WarningVisibilityState = Pick<
  FieldState<unknown>,
  'errors' | 'touched'
>;

/**
 * Minimal FieldState contract required for reading direct errors
 * plus visibility state.
 */
export type ErrorReadableState = Pick<
  FieldState<unknown>,
  'errors' | 'invalid' | 'touched'
>;
