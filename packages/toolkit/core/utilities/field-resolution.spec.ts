import { describe, expect, it } from 'vitest';
import {
  buildAriaDescribedBy,
  generateErrorId,
  generateWarningId,
  resolveFieldName,
} from './field-resolution';

describe('field-resolution', () => {
  describe('resolveFieldName', () => {
    it('should resolve field name from id attribute', () => {
      const element = document.createElement('input');
      element.setAttribute('id', 'email');

      const fieldName = resolveFieldName(element);
      expect(fieldName).toBe('email');
    });

    it('should return null when element has no id', () => {
      const element = document.createElement('input');

      const fieldName = resolveFieldName(element);
      expect(fieldName).toBeNull();
    });

    it('should return null for empty id attribute', () => {
      const element = document.createElement('input');
      element.setAttribute('id', '');

      const fieldName = resolveFieldName(element);
      expect(fieldName).toBeNull();
    });
  });

  describe('generateErrorId', () => {
    it('should generate error ID for simple field name', () => {
      expect(generateErrorId('email')).toBe('email-error');
    });

    it('should generate error ID for nested field path', () => {
      expect(generateErrorId('address.city')).toBe('address.city-error');
    });

    it('should generate error ID for array field', () => {
      expect(generateErrorId('items[0].name')).toBe('items[0].name-error');
    });
  });

  describe('generateWarningId', () => {
    it('should generate warning ID for a field name', () => {
      expect(generateWarningId('email')).toBe('email-warning');
    });
  });

  describe('buildAriaDescribedBy', () => {
    it('should return null when no options provided', () => {
      expect(buildAriaDescribedBy('email')).toBeNull();
    });

    it('should return null for empty baseIds and no flags', () => {
      expect(buildAriaDescribedBy('email', { baseIds: [] })).toBeNull();
    });

    it('should return base IDs only when no flags set', () => {
      expect(buildAriaDescribedBy('email', { baseIds: ['email-hint'] })).toBe(
        'email-hint',
      );
    });

    it('should append error ID when showErrors is true', () => {
      expect(
        buildAriaDescribedBy('email', {
          baseIds: ['email-hint'],
          showErrors: true,
        }),
      ).toBe('email-hint email-error');
    });

    it('should append warning ID when showWarnings is true', () => {
      expect(
        buildAriaDescribedBy('email', {
          baseIds: ['email-hint'],
          showWarnings: true,
        }),
      ).toBe('email-hint email-warning');
    });

    it('should append both error and warning IDs', () => {
      expect(
        buildAriaDescribedBy('email', {
          baseIds: ['email-hint'],
          showErrors: true,
          showWarnings: true,
        }),
      ).toBe('email-hint email-error email-warning');
    });

    it('should return error ID alone without base IDs', () => {
      expect(buildAriaDescribedBy('email', { showErrors: true })).toBe(
        'email-error',
      );
    });

    it('should return warning ID alone without base IDs', () => {
      expect(buildAriaDescribedBy('email', { showWarnings: true })).toBe(
        'email-warning',
      );
    });

    it('should return null when flags are false', () => {
      expect(
        buildAriaDescribedBy('email', {
          showErrors: false,
          showWarnings: false,
        }),
      ).toBeNull();
    });

    it('should support multiple base IDs', () => {
      expect(
        buildAriaDescribedBy('email', {
          baseIds: ['email-hint', 'email-description'],
          showErrors: true,
        }),
      ).toBe('email-hint email-description email-error');
    });
  });
});
