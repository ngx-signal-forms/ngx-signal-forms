import type { ValidationError } from '@angular/forms/signals';
import { humanizeFieldPath } from '@ngx-signal-forms/toolkit/core';
import { describe, expect, it } from 'vitest';
import { dedupeValidationErrors } from './utilities';

describe('Headless Utilities', () => {
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
        expect(result[0]?.kind).toBe('warn:weak');
        expect(result[1]?.kind).toBe('required');
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

    it('should strip the form prefix regardless of the configured APP_ID', () => {
      // Angular's real prefix is `${APP_ID}.form{n}.`, not hardcoded `ng.`.
      // `BrowserTestingModule` (and any app with a custom `provideAppId`)
      // uses a different APP_ID — e.g. `a.form0.email` in TestBed specs.
      expect(humanizeFieldPath('a.form0.email')).toBe('Email');
      expect(humanizeFieldPath('my-app.form3.address.city')).toBe(
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
});
