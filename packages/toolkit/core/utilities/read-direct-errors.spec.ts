import type { ValidationError } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import { readDirectErrors } from './read-direct-errors';

describe('readDirectErrors', () => {
  it('returns direct errors when errors() is present', () => {
    const directErrors: ValidationError[] = [
      { kind: 'required', message: 'Required' },
      { kind: 'warn:suggestion', message: 'Optional suggestion' },
    ];

    // `readDirectErrors` takes `unknown` and duck-types `errors` as "any
    // callable". Annotating this fixture as `Partial<ErrorReadableState>`
    // claimed conformance it does not have — `ErrorReadableState['errors']`
    // is Angular's branded `Signal<ValidationError.WithFieldTree[]>`, not a
    // bare closure over plain `ValidationError`s. The point of the test is
    // exactly that the duck-typing accepts the looser shape.
    const state = {
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
    // Deliberately degenerate: `errors()` returns a non-array. No annotation,
    // because no real `FieldState` can produce this.
    const state = {
      errors: () => null,
    };

    expect(readDirectErrors(state)).toEqual([]);
  });
});
