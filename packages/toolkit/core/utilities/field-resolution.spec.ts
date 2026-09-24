import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAriaDescribedBy,
  createFieldMessageIdSignals,
  generateErrorId,
  generateRequiredHintId,
  generateWarningId,
  normalizeFieldName,
  resolveFieldName,
  resolveFieldNameFromCandidates,
  sanitizeFieldNameForId,
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

    it('does not touch inner whitespace — path lookups and controlId reporting need the raw id', () => {
      // Regression: `resolveFieldName` used to hyphenate inner whitespace,
      // which broke two callers that need the exact DOM/model characters:
      // `injectFieldControl` (walks a form path built from this string) and
      // `NgxFieldIdentity.controlId` (must match the control's actual `id`
      // attribute). ARIA id generation sanitizes separately, at the point
      // an id is built — see `sanitizeFieldNameForId`.
      const element = document.createElement('input');
      element.setAttribute('id', 'x other-id');

      expect(resolveFieldName(element)).toBe('x other-id');
    });
  });

  describe('normalizeFieldName', () => {
    it('should trim non-empty values', () => {
      expect(normalizeFieldName('  email  ')).toBe('email');
    });

    it('should return null for blank values', () => {
      expect(normalizeFieldName('   ')).toBeNull();
    });

    it('does not touch inner whitespace', () => {
      expect(normalizeFieldName('x other-id')).toBe('x other-id');
    });
  });

  describe('sanitizeFieldNameForId', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('returns the name unchanged when it has no inner whitespace', () => {
      expect(sanitizeFieldNameForId('email')).toBe('email');
    });

    it('replaces inner whitespace with a single hyphen so the name stays one id token', () => {
      // Regression: `generateErrorId('x other-id')` used to produce
      // `x other-id-error`, and `aria-describedby` splits on whitespace —
      // the rendered attribute pointed at two ids, the second one
      // (`other-id-error`) unrelated to the field. A single-token name keeps
      // `id=` and the generated `aria-describedby` token identical.
      const name = sanitizeFieldNameForId('x other-id');
      expect(name).toBe('x-other-id');
      expect(name.split(/\s/)).toHaveLength(1);
      expect(generateErrorId(name).split(/\s/)).toHaveLength(1);
    });

    it('collapses multiple inner whitespace characters into one hyphen', () => {
      expect(sanitizeFieldNameForId('foo   bar\tbaz')).toBe('foo-bar-baz');
    });

    it('warns once in dev mode when inner whitespace is replaced', async () => {
      // The one-shot latch is module-scoped (process lifetime), so it must
      // start unflipped for this test regardless of what earlier tests in
      // this file already triggered — hence the isolated re-import.
      vi.resetModules();
      const isolated = await import('./field-resolution');

      isolated.sanitizeFieldNameForId('a b');
      isolated.sanitizeFieldNameForId('c d');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      // The message names the utility but never interpolates the (possibly
      // user-entered) field name into it — see `dev-warn-once.ts`'s
      // contract that caller data goes in `...args`, not the message.
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('sanitizeFieldNameForId'),
        'a b',
      );
      const [message] = consoleWarnSpy.mock.calls[0] as [string];
      expect(message).not.toContain('a b');
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

    it('sanitizes inner whitespace in fieldName so the id stays one token', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      expect(generateErrorId('x other-id')).toBe('x-other-id-error');
      consoleWarnSpy.mockRestore();
    });
  });

  describe('generateWarningId', () => {
    it('should generate warning ID for a field name', () => {
      expect(generateWarningId('email')).toBe('email-warning');
    });

    it('sanitizes inner whitespace in fieldName so the id stays one token', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      expect(generateWarningId('x other-id')).toBe('x-other-id-warning');
      consoleWarnSpy.mockRestore();
    });
  });

  describe('generateRequiredHintId', () => {
    it('should generate the required-hint ID for a field name', () => {
      expect(generateRequiredHintId('consent')).toBe('consent-required-hint');
    });

    it('sanitizes inner whitespace in fieldName so the id stays one token', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      expect(generateRequiredHintId('x other-id')).toBe(
        'x-other-id-required-hint',
      );
      consoleWarnSpy.mockRestore();
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
