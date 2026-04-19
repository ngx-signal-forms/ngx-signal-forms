import type { ValidationError } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import {
  isBlockingError,
  isWarningError,
  splitByKind,
  warningError,
} from './warning-error';

describe('warning-error utilities', () => {
  describe('warningError', () => {
    it('prefixes kind with warn:', () => {
      const warning = warningError('weak-password');
      expect(warning.kind).toBe('warn:weak-password');
    });

    it('preserves the message when provided', () => {
      const warning = warningError('short-password', 'Use 12+ characters');
      expect(warning.message).toBe('Use 12+ characters');
    });

    it('allows undefined or empty messages', () => {
      expect(warningError('no-message').message).toBeUndefined();
      expect(warningError('empty-message', '').message).toBe('');
    });
  });

  describe('isWarningError', () => {
    it('returns true for warn: kinds', () => {
      const warning = warningError('disposable-email');
      expect(isWarningError(warning)).toBe(true);
    });

    it('returns false for non-warning kinds', () => {
      const error: ValidationError = { kind: 'required', message: 'Required' };
      expect(isWarningError(error)).toBe(false);
    });

    it('returns false for invalid inputs', () => {
      expect(isWarningError({ kind: '', message: 'Empty kind' })).toBe(false);
      expect(isWarningError({} as ValidationError)).toBe(false);
    });
  });

  describe('isBlockingError', () => {
    it('returns true for non-warning kinds', () => {
      const error: ValidationError = { kind: 'required', message: 'Required' };
      expect(isBlockingError(error)).toBe(true);
    });

    it('returns false for warning kinds', () => {
      const warning = warningError('password-strength');
      expect(isBlockingError(warning)).toBe(false);
    });

    it('returns false for invalid inputs', () => {
      expect(isBlockingError({ kind: '', message: 'Empty kind' })).toBe(false);
      expect(isBlockingError({} as ValidationError)).toBe(false);
    });
  });

  describe('splitByKind', () => {
    it('returns empty arrays for an empty input', () => {
      const result = splitByKind([]);
      expect(result).toEqual({ blocking: [], warnings: [] });
    });

    it('partitions blocking errors and warnings while preserving original order', () => {
      const required: ValidationError = {
        kind: 'required',
        message: 'Required',
      };
      const weakWarning = warningError('weak-password');
      const tooShort: ValidationError = {
        kind: 'minlength',
        message: 'Min 8',
      };
      const disposableWarning = warningError('disposable-email');

      const result = splitByKind([
        required,
        weakWarning,
        tooShort,
        disposableWarning,
      ]);

      expect(result.blocking).toEqual([required, tooShort]);
      expect(result.warnings).toEqual([weakWarning, disposableWarning]);
      // Order pinning: identity check the slot positions.
      expect(result.blocking[0]).toBe(required);
      expect(result.blocking[1]).toBe(tooShort);
      expect(result.warnings[0]).toBe(weakWarning);
      expect(result.warnings[1]).toBe(disposableWarning);
    });

    it('returns mutable arrays consumers can freeze (negative path)', () => {
      // The interface declares `readonly` slots, but the runtime arrays must
      // be plain `ValidationError[]` so callers can `Object.freeze()` them.
      // A pre-frozen return would throw on `freeze` of an already-frozen
      // value; here we assert the arrays are NOT frozen on creation, AND
      // that calling `Object.freeze` on them succeeds without throwing.
      const result = splitByKind([
        warningError('weak-password'),
        { kind: 'required', message: 'Required' },
      ]);

      expect(Object.isFrozen(result.blocking)).toBe(false);
      expect(Object.isFrozen(result.warnings)).toBe(false);
      expect(() => Object.freeze(result.blocking)).not.toThrow();
      expect(() => Object.freeze(result.warnings)).not.toThrow();
      expect(Object.isFrozen(result.blocking)).toBe(true);
      expect(Object.isFrozen(result.warnings)).toBe(true);
    });
  });
});
