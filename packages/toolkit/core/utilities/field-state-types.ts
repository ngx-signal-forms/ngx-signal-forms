import type { FieldState } from '@angular/forms/signals';

/**
 * Minimal FieldState contract required for error visibility decisions.
 */
export type ErrorVisibilityState = Pick<
  FieldState<unknown>,
  'invalid' | 'touched'
>;

/**
 * Minimal FieldState contract required for reading direct errors
 * plus visibility state.
 */
export type ErrorReadableState = Pick<
  FieldState<unknown>,
  'errors' | 'invalid' | 'touched'
>;

/**
 * Partial visibility state used for duck-typed compatibility.
 */
export type PartialErrorVisibilityState = Partial<ErrorVisibilityState>;
