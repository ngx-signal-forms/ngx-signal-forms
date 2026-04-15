import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  form,
  schema,
  validate,
  type ValidationError,
} from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import {
  createErrorState,
  createUniqueId,
  dedupeValidationErrors,
  humanizeFieldPath,
  readDirectErrors,
  readErrors,
  readFieldFlag,
  resolveFieldNameFromError,
  type BooleanStateKey,
  type FieldStateLike,
} from './utilities';

describe('Headless Utilities', () => {
  // ============================================================================
  // readFieldFlag
  // ============================================================================

  describe('readFieldFlag', () => {
    describe('with valid FieldState-like objects', () => {
      it('should read invalid flag when true', () => {
        const state: FieldStateLike = {
          invalid: () => true,
          valid: () => false,
          touched: () => false,
          dirty: () => false,
          pending: () => false,
        };

        expect(readFieldFlag(state, 'invalid')).toBe(true);
        expect(readFieldFlag(state, 'valid')).toBe(false);
      });

      it('should read touched flag when true', () => {
        const state: FieldStateLike = {
          invalid: () => false,
          valid: () => true,
          touched: () => true,
          dirty: () => false,
          pending: () => false,
        };

        expect(readFieldFlag(state, 'touched')).toBe(true);
        expect(readFieldFlag(state, 'dirty')).toBe(false);
      });

      it('should read dirty flag when true', () => {
        const state: FieldStateLike = {
          invalid: () => false,
          valid: () => true,
          touched: () => false,
          dirty: () => true,
          pending: () => false,
        };

        expect(readFieldFlag(state, 'dirty')).toBe(true);
      });

      it('should read pending flag when true', () => {
        const state: FieldStateLike = {
          invalid: () => false,
          valid: () => false,
          touched: () => false,
          dirty: () => false,
          pending: () => true,
        };

        expect(readFieldFlag(state, 'pending')).toBe(true);
      });

      it('should read all flags correctly', () => {
        const state: FieldStateLike = {
          invalid: () => true,
          valid: () => false,
          touched: () => true,
          dirty: () => true,
          pending: () => false,
        };

        expect(readFieldFlag(state, 'invalid')).toBe(true);
        expect(readFieldFlag(state, 'valid')).toBe(false);
        expect(readFieldFlag(state, 'touched')).toBe(true);
        expect(readFieldFlag(state, 'dirty')).toBe(true);
        expect(readFieldFlag(state, 'pending')).toBe(false);
      });
    });

    describe('with missing or partial flags', () => {
      it('should return false when flag is missing', () => {
        const state = {
          invalid: () => true,
          // missing: valid, touched, dirty, pending
        };

        expect(readFieldFlag(state, 'invalid')).toBe(true);
        expect(readFieldFlag(state, 'valid')).toBe(false);
        expect(readFieldFlag(state, 'touched')).toBe(false);
        expect(readFieldFlag(state, 'dirty')).toBe(false);
        expect(readFieldFlag(state, 'pending')).toBe(false);
      });

      it('should return false when flag is undefined', () => {
        const state: Partial<FieldStateLike> = {
          invalid: undefined,
          valid: () => true,
        };

        expect(readFieldFlag(state, 'invalid')).toBe(false);
        expect(readFieldFlag(state, 'valid')).toBe(true);
      });
    });

    describe('with invalid inputs', () => {
      it('should return false when state is null', () => {
        expect(readFieldFlag(null, 'invalid')).toBe(false);
        expect(readFieldFlag(null, 'touched')).toBe(false);
      });

      it('should return false when state is undefined', () => {
        expect(readFieldFlag(undefined, 'invalid')).toBe(false);
        expect(readFieldFlag(undefined, 'touched')).toBe(false);
      });

      it('should return false when state is not an object', () => {
        expect(readFieldFlag('string', 'invalid')).toBe(false);
        expect(readFieldFlag(123, 'invalid')).toBe(false);
        expect(readFieldFlag(true, 'invalid')).toBe(false);
      });

      it('should return false when state is an empty object', () => {
        expect(readFieldFlag({}, 'invalid')).toBe(false);
        expect(readFieldFlag({}, 'touched')).toBe(false);
      });

      it('should return false when flag is not a function', () => {
        const state = {
          invalid: true, // Not a function
          valid: 'yes', // Not a function
        };

        expect(readFieldFlag(state, 'invalid' as BooleanStateKey)).toBe(false);
        expect(readFieldFlag(state, 'valid' as BooleanStateKey)).toBe(false);
      });
    });
  });

  // ============================================================================
  // readErrors
  // ============================================================================

  describe('readErrors', () => {
    describe('with errorSummary (aggregated errors)', () => {
      it('should return errors from errorSummary when available', () => {
        const errors: ValidationError[] = [
          { kind: 'required', message: 'Field is required' },
          { kind: 'email', message: 'Invalid email' },
        ];

        const state: FieldStateLike = {
          errorSummary: () => errors,
          errors: () => [{ kind: 'other', message: 'Should not be used' }],
        };

        const result = readErrors(state);

        expect(result).toEqual(errors);
        expect(result).toHaveLength(2);
        expect(result[0].kind).toBe('required');
      });

      it('should return empty array when errorSummary returns null', () => {
        const state: FieldStateLike = {
          errorSummary: () => null as unknown as ValidationError[],
        };

        expect(readErrors(state)).toEqual([]);
      });

      it('should return empty array when errorSummary returns undefined', () => {
        const state: FieldStateLike = {
          errorSummary: () => undefined as unknown as ValidationError[],
        };

        expect(readErrors(state)).toEqual([]);
      });
    });

    describe('with errors fallback (direct field errors)', () => {
      it('should fall back to errors when errorSummary is not available', () => {
        const errors: ValidationError[] = [
          { kind: 'minLength', message: 'Too short' },
        ];

        const state: FieldStateLike = {
          errors: () => errors,
          // No errorSummary
        };

        const result = readErrors(state);

        expect(result).toEqual(errors);
        expect(result[0].kind).toBe('minLength');
      });

      it('should return empty array when errors returns null', () => {
        const state: FieldStateLike = {
          errors: () => null as unknown as ValidationError[],
        };

        expect(readErrors(state)).toEqual([]);
      });
    });

    describe('with invalid inputs', () => {
      it('should return empty array when state is null', () => {
        expect(readErrors(null)).toEqual([]);
      });

      it('should return empty array when state is undefined', () => {
        expect(readErrors()).toEqual([]);
      });

      it('should return empty array when state is not an object', () => {
        expect(readErrors('string')).toEqual([]);
        expect(readErrors(123)).toEqual([]);
        expect(readErrors(true)).toEqual([]);
      });

      it('should return empty array when state is empty object', () => {
        expect(readErrors({})).toEqual([]);
      });

      it('should return empty array when errors is not a function', () => {
        const state = {
          errors: [{ kind: 'required' }], // Not a function
        };

        expect(readErrors(state)).toEqual([]);
      });
    });

    describe('error types', () => {
      it('should handle blocking errors (no warn: prefix)', () => {
        const state: FieldStateLike = {
          errors: () => [
            { kind: 'required', message: 'Required' },
            { kind: 'email', message: 'Invalid email' },
          ],
        };

        const result = readErrors(state);

        expect(result).toHaveLength(2);
        expect(result.every((e) => !e.kind.startsWith('warn:'))).toBe(true);
      });

      it('should handle warning errors (warn: prefix)', () => {
        const state: FieldStateLike = {
          errors: () => [
            {
              kind: 'warn:weak-password',
              message: 'Consider stronger password',
            },
            { kind: 'warn:suggestion', message: 'Optional improvement' },
          ],
        };

        const result = readErrors(state);

        expect(result).toHaveLength(2);
        expect(result.every((e) => e.kind.startsWith('warn:'))).toBe(true);
      });

      it('should handle mixed errors and warnings', () => {
        const state: FieldStateLike = {
          errors: () => [
            { kind: 'required', message: 'Required' },
            { kind: 'warn:suggestion', message: 'Consider improvement' },
          ],
        };

        const result = readErrors(state);

        expect(result).toHaveLength(2);
        expect(result[0].kind).toBe('required');
        expect(result[1].kind).toBe('warn:suggestion');
      });
    });
  });

  // ============================================================================
  // readDirectErrors
  // ============================================================================

  describe('readDirectErrors', () => {
    describe('basic usage', () => {
      it('should return only direct errors, ignoring errorSummary', () => {
        const directErrors: ValidationError[] = [
          { kind: 'passwordMismatch', message: 'Passwords must match' },
        ];
        const summaryErrors: ValidationError[] = [
          { kind: 'required', message: 'Password is required' },
          { kind: 'required', message: 'Confirm password is required' },
          { kind: 'passwordMismatch', message: 'Passwords must match' },
        ];

        const state: FieldStateLike = {
          errors: () => directErrors,
          errorSummary: () => summaryErrors,
        };

        const result = readDirectErrors(state);

        expect(result).toEqual(directErrors);
        expect(result).toHaveLength(1);
        expect(result[0].kind).toBe('passwordMismatch');
      });

      it('should return empty array when no direct errors exist', () => {
        const state: FieldStateLike = {
          errors: () => [],
          errorSummary: () => [{ kind: 'nested', message: 'Nested error' }],
        };

        const result = readDirectErrors(state);

        expect(result).toEqual([]);
      });
    });

    describe('with invalid inputs', () => {
      it('should return empty array when state is null', () => {
        expect(readDirectErrors(null)).toEqual([]);
      });

      it('should return empty array when state is undefined', () => {
        expect(readDirectErrors()).toEqual([]);
      });

      it('should return empty array when state is not an object', () => {
        expect(readDirectErrors('string')).toEqual([]);
        expect(readDirectErrors(123)).toEqual([]);
      });

      it('should return empty array when errors is not a function', () => {
        const state = {
          errors: [{ kind: 'required' }], // Not a function
        };

        expect(readDirectErrors(state)).toEqual([]);
      });

      it('should return empty array when errors returns null', () => {
        const state: FieldStateLike = {
          errors: () => null as unknown as ValidationError[],
        };

        expect(readDirectErrors(state)).toEqual([]);
      });
    });
  });

  // ============================================================================
  // dedupeValidationErrors
  // ============================================================================

  describe('dedupeValidationErrors', () => {
    describe('basic deduplication', () => {
      it('should remove duplicate errors with same kind and message', () => {
        const errors: ValidationError[] = [
          { kind: 'required', message: 'Required' },
          { kind: 'email', message: 'Invalid email' },
          { kind: 'required', message: 'Required' }, // duplicate
        ];

        const result = dedupeValidationErrors(errors);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ kind: 'required', message: 'Required' });
        expect(result[1]).toEqual({ kind: 'email', message: 'Invalid email' });
      });

      it('should preserve first occurrence order', () => {
        const errors: ValidationError[] = [
          { kind: 'aaa', message: 'First' },
          { kind: 'bbb', message: 'Second' },
          { kind: 'aaa', message: 'First' }, // duplicate
          { kind: 'ccc', message: 'Third' },
        ];

        const result = dedupeValidationErrors(errors);

        expect(result).toHaveLength(3);
        expect(result.map((e) => e.kind)).toEqual(['aaa', 'bbb', 'ccc']);
      });

      it('should keep errors with same kind but different messages', () => {
        const errors: ValidationError[] = [
          { kind: 'required', message: 'Field A is required' },
          { kind: 'required', message: 'Field B is required' },
        ];

        const result = dedupeValidationErrors(errors);

        expect(result).toHaveLength(2);
      });

      it('should keep errors with same message but different kinds', () => {
        const errors: ValidationError[] = [
          { kind: 'customA', message: 'Same message' },
          { kind: 'customB', message: 'Same message' },
        ];

        const result = dedupeValidationErrors(errors);

        expect(result).toHaveLength(2);
      });
    });

    describe('edge cases', () => {
      it('should handle empty array', () => {
        expect(dedupeValidationErrors([])).toEqual([]);
      });

      it('should handle single error', () => {
        const errors: ValidationError[] = [
          { kind: 'required', message: 'Required' },
        ];

        const result = dedupeValidationErrors(errors);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ kind: 'required', message: 'Required' });
      });

      it('should handle errors with undefined messages', () => {
        const errors: ValidationError[] = [
          { kind: 'required' },
          { kind: 'email' },
          { kind: 'required' }, // duplicate (both have undefined message)
        ];

        const result = dedupeValidationErrors(errors);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ kind: 'required' });
        expect(result[1]).toEqual({ kind: 'email' });
      });

      it('should handle errors with empty messages', () => {
        const errors: ValidationError[] = [
          { kind: 'required', message: '' },
          { kind: 'email', message: '' },
          { kind: 'required', message: '' }, // duplicate
        ];

        const result = dedupeValidationErrors(errors);

        expect(result).toHaveLength(2);
      });

      it('should handle many duplicates', () => {
        const errors: ValidationError[] = Array.from({ length: 10 }, () => ({
          kind: 'required',
          message: 'Required',
        }));

        const result = dedupeValidationErrors(errors);

        expect(result).toHaveLength(1);
      });
    });

    describe('with warnings', () => {
      it('should dedupe warnings same as errors', () => {
        const errors: ValidationError[] = [
          { kind: 'warn:weak', message: 'Weak password' },
          { kind: 'required', message: 'Required' },
          { kind: 'warn:weak', message: 'Weak password' }, // duplicate
        ];

        const result = dedupeValidationErrors(errors);

        expect(result).toHaveLength(2);
        expect(result[0].kind).toBe('warn:weak');
        expect(result[1].kind).toBe('required');
      });
    });
  });

  // ============================================================================
  // resolveFieldNameFromError
  // ============================================================================

  describe('humanizeFieldPath', () => {
    it('should split camelCase and capitalize', () => {
      expect(humanizeFieldPath('postalCode')).toBe('Postal code');
    });

    it('should join nested segments with " / "', () => {
      expect(humanizeFieldPath('address.postalCode')).toBe(
        'Address / Postal code',
      );
    });

    it('should strip Angular internal form prefix', () => {
      expect(humanizeFieldPath('ng.form0.email')).toBe('Email');
      expect(humanizeFieldPath('ng.form12.address.city')).toBe(
        'Address / City',
      );
    });

    it('should handle underscores and hyphens', () => {
      expect(humanizeFieldPath('first_name')).toBe('First name');
      expect(humanizeFieldPath('last-name')).toBe('Last name');
    });

    it('should return the original string when empty after stripping', () => {
      expect(humanizeFieldPath('')).toBe('');
    });
  });

  describe('resolveFieldNameFromError', () => {
    it('should strip Angular internal form prefixes and humanize nested paths', () => {
      const error = {
        kind: 'required',
        message: 'Postal code is required',
        fieldTree: () => ({
          name: () => 'ng.form0.address.postalCode',
        }),
      } as ValidationError;

      expect(resolveFieldNameFromError(error)).toBe('Address / Postal code');
    });

    it('should humanize fallback kinds when no field tree is available', () => {
      expect(resolveFieldNameFromError({ kind: 'passwordMismatch' })).toBe(
        'Password mismatch',
      );
    });

    it('should use a custom resolver when provided', () => {
      const dutchLabels: Record<string, string> = {
        'address.postalCode': 'Postcode',
        contactEmail: 'E-mailadres',
      };
      const resolver = (path: string) =>
        dutchLabels[path] ?? humanizeFieldPath(path);

      const error = {
        kind: 'required',
        message: 'required',
        fieldTree: () => ({
          name: () => 'ng.form0.address.postalCode',
        }),
      } as ValidationError;

      expect(resolveFieldNameFromError(error, resolver)).toBe('Postcode');
    });

    it('should fall back to humanizeFieldPath for unmapped paths in custom resolver', () => {
      const resolver = (path: string) => {
        const map: Record<string, string> = { email: 'E-mail' };
        return map[path] ?? humanizeFieldPath(path);
      };

      const error = {
        kind: 'required',
        message: 'required',
        fieldTree: () => ({
          name: () => 'ng.form0.address.street',
        }),
      } as ValidationError;

      expect(resolveFieldNameFromError(error, resolver)).toBe(
        'Address / Street',
      );
    });

    it('should pass the kind to the resolver when no fieldTree exists', () => {
      const resolver = (path: string) =>
        path === 'passwordMismatch' ? 'Wachtwoord mismatch' : path;

      expect(
        resolveFieldNameFromError({ kind: 'passwordMismatch' }, resolver),
      ).toBe('Wachtwoord mismatch');
    });
  });

  // ============================================================================
  // createUniqueId
  // ============================================================================

  describe('createUniqueId', () => {
    it('should generate sequential IDs with given prefix', () => {
      const id1 = createUniqueId('test');
      const id2 = createUniqueId('test');
      const id3 = createUniqueId('test');

      // IDs should be sequential (values depend on test run order)
      expect(id1).toMatch(/^test-\d+$/);
      expect(id2).toMatch(/^test-\d+$/);
      expect(id3).toMatch(/^test-\d+$/);

      // Each ID should be unique
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
    });

    it('should use the provided prefix', () => {
      const fieldId = createUniqueId('field');
      const fieldsetId = createUniqueId('fieldset');
      const formId = createUniqueId('form');

      expect(fieldId).toMatch(/^field-\d+$/);
      expect(fieldsetId).toMatch(/^fieldset-\d+$/);
      expect(formId).toMatch(/^form-\d+$/);
    });

    it('should share counter across different prefixes', () => {
      // Counter is global, so different prefixes still get unique numbers
      const id1 = createUniqueId('a');
      const id2 = createUniqueId('b');
      const id3 = createUniqueId('a');

      // Extract numbers from IDs
      const num1 = parseInt(id1.split('-')[1], 10);
      const num2 = parseInt(id2.split('-')[1], 10);
      const num3 = parseInt(id3.split('-')[1], 10);

      // Numbers should be sequential
      expect(num2).toBe(num1 + 1);
      expect(num3).toBe(num2 + 1);
    });

    it('should handle empty prefix', () => {
      const id = createUniqueId('');

      expect(id).toMatch(/^-\d+$/);
    });

    it('should handle special characters in prefix', () => {
      const id = createUniqueId('my-custom-prefix');

      expect(id).toMatch(/^my-custom-prefix-\d+$/);
    });
  });

  // ============================================================================
  // Warning visibility coupling contract
  // ============================================================================

  describe('warning visibility coupling (createErrorState)', () => {
    // The toolkit's `createErrorState()` aliases `showWarnings: showErrorsSignal`
    // because warnings are regular `ValidationError`s that Angular still marks
    // as `invalid() === true` (they come from the same validator pipeline as
    // blocking errors; the toolkit only splits them later via `splitByKind`).
    //
    // These tests are a *contract* against Angular — if a future release
    // changed warning semantics so that `kind: 'warn:*'` errors no longer
    // marked the field invalid, the `showWarnings === showErrors` aliasing
    // would silently break. Keep them passing or audit `createErrorState`
    // before shipping.

    function buildWarningOnlyForm() {
      const model = signal({ password: 'short' });
      return TestBed.runInInjectionContext(() =>
        form(
          model,
          schema((path) => {
            validate(path.password, (ctx) => {
              return ctx.value().length < 12
                ? {
                    kind: 'warn:weak-password',
                    message: 'Consider a stronger password',
                  }
                : null;
            });
          }),
        ),
      );
    }

    it('Angular marks a warning-only field as invalid()', () => {
      const passwordForm = buildWarningOnlyForm();
      const passwordState = passwordForm.password();

      // Contract: Angular does not distinguish warnings from errors. The
      // toolkit's warning visibility relies on this.
      expect(passwordState.errors().length).toBeGreaterThan(0);
      expect(passwordState.invalid()).toBe(true);
    });

    it('createErrorState surfaces warning-only fields via showWarnings after touch', () => {
      const passwordForm = buildWarningOnlyForm();

      const errorState = TestBed.runInInjectionContext(() =>
        createErrorState({
          field: passwordForm.password,
          fieldName: 'password',
        }),
      );

      // Before touch, on-touch strategy hides both errors and warnings.
      expect(errorState.showErrors()).toBe(false);
      expect(errorState.showWarnings()).toBe(false);

      passwordForm.password().markAsTouched();

      // After touch, the warning surfaces because `invalid()` is true and
      // the same visibility gate drives both showErrors and showWarnings.
      expect(errorState.hasWarnings()).toBe(true);
      expect(errorState.hasErrors()).toBe(false);
      expect(errorState.showWarnings()).toBe(true);
    });
  });
});
