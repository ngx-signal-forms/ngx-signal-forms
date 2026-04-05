import type { ValidationError } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import type { ErrorReadableState } from './field-state-types';
import { readDirectErrors } from './read-direct-errors';

describe('readDirectErrors', () => {
  it('returns direct errors when errors() is present', () => {
    const directErrors: ValidationError[] = [
      { kind: 'required', message: 'Required' },
      { kind: 'warn:suggestion', message: 'Optional suggestion' },
    ];

    const state: Partial<ErrorReadableState> = {
      errors: () => directErrors,
    };

    expect(readDirectErrors(state)).toEqual(directErrors);
  });

  it('returns empty array for null/undefined/non-object input', () => {
    expect(readDirectErrors(null)).toEqual([]);
    expect(readDirectErrors(undefined)).toEqual([]);
    expect(readDirectErrors('text')).toEqual([]);
    expect(readDirectErrors(42)).toEqual([]);
  });

  it('returns empty array when errors is missing or not a function', () => {
    expect(readDirectErrors({})).toEqual([]);
    expect(readDirectErrors({ errors: [] })).toEqual([]);
  });

  it('returns empty array when errors() does not return an array', () => {
    const state: Partial<ErrorReadableState> = {
      errors: () => null as unknown as ValidationError[],
    };

    expect(readDirectErrors(state)).toEqual([]);
  });
});
