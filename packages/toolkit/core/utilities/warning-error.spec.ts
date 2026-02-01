import type { ValidationError } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import { isBlockingError, isWarningError, warningError } from './warning-error';

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
});
