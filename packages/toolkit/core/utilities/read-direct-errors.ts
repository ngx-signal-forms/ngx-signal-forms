import type { ValidationError } from '@angular/forms/signals';
import type { ErrorReadableState } from './field-state-types';

function normalizeValidationErrors(errors: unknown): ValidationError[] {
  return Array.isArray(errors) ? errors : [];
}

/**
 * Read only direct errors from FieldState (excludes nested field errors).
 *
 * Unlike `errorSummary()`-based approaches, this only reads direct `errors()`
 * from the current field/group state.
 */
export function readDirectErrors(state: unknown): ValidationError[] {
  if (!state || typeof state !== 'object') {
    return [];
  }

  const errors = (state as Partial<ErrorReadableState>).errors;
  if (typeof errors === 'function') {
    return normalizeValidationErrors(errors());
  }

  return [];
}
