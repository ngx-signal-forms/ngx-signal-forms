import { describe, expect, it } from 'vitest';
import { generateErrorId, resolveFieldName } from './field-resolution';

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
});
