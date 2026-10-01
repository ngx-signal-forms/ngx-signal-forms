import { signal } from '@angular/core';
import type { ValidationError } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import {
  readErrors,
  readFieldFlag,
  type BooleanStateKey,
  type FieldStateLike,
} from './field-state-utilities';

describe('Field-state utilities', () => {
  // ============================================================================
  // readFieldFlag
  // ============================================================================

  describe('readFieldFlag', () => {
    describe('with valid FieldState-like objects', () => {
      it('should read invalid flag when true', () => {
        // Real signals, not bare closures: `FieldStateLike.invalid` and
        // `.touched` borrow Angular's own `FieldState` types, which are
        // branded `Signal`s. Mocking them as plain arrows types-checks only
        // against the three members that are declared `() => boolean`, and
        // produces a shape `FieldState` never emits.
        const state: FieldStateLike = {
          invalid: signal(true),
          valid: signal(false),
          touched: signal(false),
          dirty: signal(false),
          pending: signal(false),
        };

        expect(readFieldFlag(state, 'invalid')).toBe(true);
        expect(readFieldFlag(state, 'valid')).toBe(false);
      });

      it('should read touched flag when true', () => {
        const state: FieldStateLike = {
          invalid: signal(false),
          valid: signal(true),
          touched: signal(true),
          dirty: signal(false),
          pending: signal(false),
        };

        expect(readFieldFlag(state, 'touched')).toBe(true);
        expect(readFieldFlag(state, 'dirty')).toBe(false);
      });

      it('should read dirty flag when true', () => {
        const state: FieldStateLike = {
          invalid: signal(false),
          valid: signal(true),
          touched: signal(false),
          dirty: signal(true),
          pending: signal(false),
        };

        expect(readFieldFlag(state, 'dirty')).toBe(true);
      });

      it('should read pending flag when true', () => {
        const state: FieldStateLike = {
          invalid: signal(false),
          valid: signal(false),
          touched: signal(false),
          dirty: signal(false),
          pending: signal(true),
        };

        expect(readFieldFlag(state, 'pending')).toBe(true);
      });

      it('should read all flags correctly', () => {
        const state: FieldStateLike = {
          invalid: signal(true),
          valid: signal(false),
          touched: signal(true),
          dirty: signal(true),
          pending: signal(false),
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
        // Deliberately NOT annotated `Partial<FieldStateLike>`: under
        // `exactOptionalPropertyTypes` an optional member cannot be set to
        // `undefined`, and the whole point of this case is the degenerate
        // shape. `readFieldFlag` accepts `unknown`, so the annotation only
        // ever claimed a conformance this object does not have.
        const state = {
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

        expect(readFieldFlag(state, 'invalid')).toBe(false);
        expect(readFieldFlag(state, 'valid')).toBe(false);
      });
    });
  });

  // ============================================================================
  // readErrors
  // ============================================================================

  // `readErrors` / `readDirectErrors` accept `unknown` and duck-type their
  // way to the errors — that structural read IS the subject of these tests.
  // The mocks below are therefore deliberately left unannotated: a
  // `FieldStateLike` annotation would assert that `errors` is a
  // `Signal<ValidationError.WithFieldTree[]>` (every entry carrying a
  // `fieldTree`), which these intentionally-minimal shapes are not. Tests
  // that do stand in for a real `FieldState` use real signals — see the
  // `readFieldFlag` block above.
  describe('readErrors', () => {
    describe('with errorSummary (aggregated errors)', () => {
      it('should return errors from errorSummary when available', () => {
        const errors: ValidationError[] = [
          { kind: 'required', message: 'Field is required' },
          { kind: 'email', message: 'Invalid email' },
        ];

        const state = {
          errorSummary: () => errors,
          errors: () => [{ kind: 'other', message: 'Should not be used' }],
        };

        const result = readErrors(state);

        expect(result).toEqual(errors);
        expect(result).toHaveLength(2);
        expect(result[0]?.kind).toBe('required');
      });

      it('should return empty array when errorSummary returns null', () => {
        const state = {
          errorSummary: () => null as unknown as ValidationError[],
        };

        expect(readErrors(state)).toEqual([]);
      });

      it('should return empty array when errorSummary returns undefined', () => {
        const state = {
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

        const state = {
          errors: () => errors,
          // No errorSummary
        };

        const result = readErrors(state);

        expect(result).toEqual(errors);
        expect(result[0]?.kind).toBe('minLength');
      });

      it('should return empty array when errors returns null', () => {
        const state = {
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
        const state = {
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
        const state = {
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
        const state = {
          errors: () => [
            { kind: 'required', message: 'Required' },
            { kind: 'warn:suggestion', message: 'Consider improvement' },
          ],
        };

        const result = readErrors(state);

        expect(result).toHaveLength(2);
        expect(result[0]?.kind).toBe('required');
        expect(result[1]?.kind).toBe('warn:suggestion');
      });
    });
  });
});
