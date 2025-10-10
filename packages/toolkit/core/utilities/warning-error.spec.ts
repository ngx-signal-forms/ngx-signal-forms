import { describe, it, expect } from 'vitest';
import { warningError } from './warning-error';

describe('warningError', () => {
  describe('Kind Prefix Convention', () => {
    it('should prefix kind with "warn:"', () => {
      const warning = warningError('weak-password');
      expect(warning.kind).toBe('warn:weak-password');
    });

    it('should preserve custom kind names with warn: prefix', () => {
      const warning = warningError('disposable-email');
      expect(warning.kind).toBe('warn:disposable-email');
    });

    it('should handle multi-word kind names', () => {
      const warning = warningError('common-password-pattern');
      expect(warning.kind).toBe('warn:common-password-pattern');
    });
  });

  describe('Message Handling', () => {
    it('should include message when provided', () => {
      const warning = warningError(
        'short-password',
        'Consider using 12+ characters for better security',
      );
      expect(warning.message).toBe(
        'Consider using 12+ characters for better security',
      );
    });

    it('should have undefined message when not provided', () => {
      const warning = warningError('weak-password');
      expect(warning.message).toBeUndefined();
    });

    it('should handle empty string message', () => {
      const warning = warningError('test-warning', '');
      expect(warning.message).toBe('');
    });
  });

  describe('Return Type', () => {
    it('should return CustomValidationError structure', () => {
      const warning = warningError('test', 'Test message');
      expect(warning).toHaveProperty('kind');
      expect(warning).toHaveProperty('message');
    });

    it('should be compatible with Signal Forms validators', () => {
      // Simulate validator return
      const validatorResult = warningError(
        'weak-password',
        'Password could be stronger',
      );

      // Validators return ValidationError | null
      expect(validatorResult).toBeTruthy();
      expect(validatorResult.kind).toContain('warn:');
    });
  });

  describe('Use Cases', () => {
    it('should create security warnings', () => {
      const warning = warningError(
        'password-strength',
        'Consider adding special characters',
      );
      expect(warning.kind).toBe('warn:password-strength');
      expect(warning.message).toBe('Consider adding special characters');
    });

    it('should create UX improvement warnings', () => {
      const warning = warningError(
        'short-username',
        'Usernames 6+ characters are easier to remember',
      );
      expect(warning.kind).toBe('warn:short-username');
    });

    it('should create data quality warnings', () => {
      const warning = warningError(
        'disposable-email',
        'This email domain is commonly used for temporary accounts',
      );
      expect(warning.kind).toBe('warn:disposable-email');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in kind', () => {
      const warning = warningError('special_char-test.warning');
      expect(warning.kind).toBe('warn:special_char-test.warning');
    });

    it('should handle numeric kind', () => {
      const warning = warningError('123');
      expect(warning.kind).toBe('warn:123');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(500);
      const warning = warningError('test', longMessage);
      expect(warning.message).toBe(longMessage);
      expect(warning.message?.length).toBe(500);
    });
  });
});
