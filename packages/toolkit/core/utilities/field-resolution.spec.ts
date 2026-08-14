import { describe, expect, it } from 'vitest';
import {
  buildAriaDescribedBy,
  createFieldMessageIdSignals,
  generateErrorId,
  generateWarningId,
  normalizeFieldName,
  resolveFieldName,
  resolveFieldNameFromCandidates,
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

    it('should trim whitespace around id values', () => {
      const element = document.createElement('input');
      element.setAttribute('id', '  email  ');

      const fieldName = resolveFieldName(element);
      expect(fieldName).toBe('email');
    });
  });

  describe('normalizeFieldName', () => {
    it('should trim non-empty values', () => {
      expect(normalizeFieldName('  email  ')).toBe('email');
    });

    it('should return null for blank values', () => {
      expect(normalizeFieldName('   ')).toBeNull();
    });
  });

  describe('resolveFieldNameFromCandidates', () => {
    it('should pick the first non-blank candidate', () => {
      expect(
        resolveFieldNameFromCandidates('   ', null, 'email', 'backup'),
      ).toBe('email');
    });

    it('should return null when all candidates are empty', () => {
      expect(resolveFieldNameFromCandidates(undefined, '', '   ')).toBeNull();
    });

    /**
     * Pins the toolkit-wide field-name cascade documented on this
     * function's JSDoc: explicit input (tier 1) > bound-control id
     * (tier 2) > inherited context (tier 3). `NgxFormFieldError` and
     * `NgxHeadlessFieldName` call this primitive with their candidates
     * in this order; `NgxFormFieldWrapper.resolvedFieldName` and
     * `createFieldNameResolver` implement the same cascade semantics
     * inline rather than calling it.
     */
    describe('canonical field-name cascade (explicit > bound-control id > context)', () => {
      it('tier 1 (explicit) wins even when tiers 2 and 3 also resolve', () => {
        expect(
          resolveFieldNameFromCandidates(
            'explicit-name',
            'id-derived-name',
            'context-name',
          ),
        ).toBe('explicit-name');
      });

      it('falls through to tier 2 (bound-control id) when explicit is absent', () => {
        expect(
          resolveFieldNameFromCandidates(
            undefined,
            'id-derived-name',
            'context-name',
          ),
        ).toBe('id-derived-name');
      });

      it('falls through to tier 3 (context) when tiers 1 and 2 are both absent', () => {
        expect(
          resolveFieldNameFromCandidates(undefined, null, 'context-name'),
        ).toBe('context-name');
      });

      it('resolves to null when no tier resolves', () => {
        expect(
          resolveFieldNameFromCandidates(undefined, null, undefined),
        ).toBeNull();
      });

      it('treats a whitespace-only explicit input as absent, falling through to tier 2', () => {
        expect(
          resolveFieldNameFromCandidates(
            '   ',
            'id-derived-name',
            'context-name',
          ),
        ).toBe('id-derived-name');
      });
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

    it('should append kind suffix when supplied', () => {
      expect(generateErrorId('email', 'required')).toBe('email-error-required');
    });

    it('should append kind suffix for nested field paths', () => {
      expect(generateErrorId('address.city', 'minLength')).toBe(
        'address.city-error-minLength',
      );
    });

    it('should append kind suffix for array fields', () => {
      expect(generateErrorId('items[0].name', 'required')).toBe(
        'items[0].name-error-required',
      );
    });

    it('should preserve container form when kind is undefined', () => {
      expect(generateErrorId('email', undefined)).toBe('email-error');
    });

    it('should treat empty-string kind as a literal suffix', () => {
      expect(generateErrorId('email', '')).toBe('email-error-');
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

  describe('createFieldMessageIdSignals', () => {
    it('should derive null ids from a null field name', () => {
      const ids = createFieldMessageIdSignals(() => null);

      expect(ids.errorId()).toBeNull();
      expect(ids.warningId()).toBeNull();
    });

    it('should derive error and warning ids from a resolved field name', () => {
      const ids = createFieldMessageIdSignals(() => 'email');

      expect(ids.errorId()).toBe('email-error');
      expect(ids.warningId()).toBe('email-warning');
    });
  });
});
