import type { ValidationError } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import {
  createUniqueId,
  dedupeValidationErrors,
  readErrors,
  readFieldFlag,
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
        expect(readErrors(undefined)).toEqual([]);
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
        const errors: ValidationError[] = Array(10).fill({
          kind: 'required',
          message: 'Required',
        });

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
});
