import { describe, expect, expectTypeOf, it } from 'vitest';
import { createCascadingResolver } from './cascading-resolver';

describe('createCascadingResolver', () => {
  // ─── Tier-precedence matrix ──────────────────────────────────────────────

  describe('Tier precedence — static', () => {
    it('input wins when all tiers are present', () => {
      const result = createCascadingResolver({
        input: 'input-value',
        context: 'context-value',
        configDefault: 'config-value',
        fallback: 'fallback-value',
      });
      expect(result).toBe('input-value');
    });

    it('context wins when input is null', () => {
      const result = createCascadingResolver({
        input: null,
        context: 'context-value',
        configDefault: 'config-value',
        fallback: 'fallback-value',
      });
      expect(result).toBe('context-value');
    });

    it('context wins when input is undefined', () => {
      const result = createCascadingResolver({
        input: undefined,
        context: 'context-value',
        configDefault: 'config-value',
        fallback: 'fallback-value',
      });
      expect(result).toBe('context-value');
    });

    it('configDefault wins when input and context are nullish', () => {
      const result = createCascadingResolver({
        input: null,
        context: undefined,
        configDefault: 'config-value',
        fallback: 'fallback-value',
      });
      expect(result).toBe('config-value');
    });

    it('fallback wins when all upstream tiers are nullish', () => {
      const result = createCascadingResolver({
        input: null,
        context: null,
        configDefault: undefined,
        fallback: 'fallback-value',
      });
      expect(result).toBe('fallback-value');
    });

    it('fallback wins when optional tiers are absent', () => {
      const result = createCascadingResolver({
        input: undefined,
        fallback: 'fallback-value',
      });
      expect(result).toBe('fallback-value');
    });

    it('fallback wins when only input and fallback given and input is nullish', () => {
      const result = createCascadingResolver({
        input: null,
        fallback: 42,
      });
      expect(result).toBe(42);
    });

    it('context wins when input is absent and context is present', () => {
      const result = createCascadingResolver({
        input: undefined,
        context: 'ctx',
        fallback: 'fallback',
      });
      expect(result).toBe('ctx');
    });
  });

  // ─── Falsy-value preservation ────────────────────────────────────────────

  describe('Falsy-value preservation (nullish-only short-circuit)', () => {
    it('preserves empty-string input over non-empty fallback', () => {
      const result = createCascadingResolver({
        input: '',
        fallback: 'non-empty',
      });
      expect(result).toBe('');
    });

    it('preserves empty-string context over fallback', () => {
      const result = createCascadingResolver({
        input: null,
        context: '',
        fallback: 'non-empty',
      });
      expect(result).toBe('');
    });

    it('preserves empty-string configDefault over fallback', () => {
      const result = createCascadingResolver({
        input: null,
        context: null,
        configDefault: '',
        fallback: 'non-empty',
      });
      expect(result).toBe('');
    });

    it('preserves zero as input', () => {
      const result = createCascadingResolver({
        input: 0,
        fallback: 99,
      });
      expect(result).toBe(0);
    });

    it('preserves zero as configDefault', () => {
      const result = createCascadingResolver({
        input: null,
        configDefault: 0,
        fallback: 99,
      });
      expect(result).toBe(0);
    });

    it('preserves zero as context', () => {
      const result = createCascadingResolver({
        input: null,
        context: 0,
        configDefault: 5,
        fallback: 99,
      });
      expect(result).toBe(0);
    });

    it('preserves false as input', () => {
      const result = createCascadingResolver({
        input: false,
        fallback: true,
      });
      expect(result).toBe(false);
    });

    it('preserves false as configDefault', () => {
      const result = createCascadingResolver({
        input: null,
        configDefault: false,
        fallback: true,
      });
      expect(result).toBe(false);
    });
  });

  // ─── Return type ─────────────────────────────────────────────────────────

  describe('Return type', () => {
    it('returns T directly when all tiers are static', () => {
      const result = createCascadingResolver({
        input: null as string | null,
        fallback: 'direct',
      });
      expectTypeOf(result).toEqualTypeOf<string>();
      expect(result).toBe('direct');
    });

    it('never returns undefined — fallback is always reachable', () => {
      const result = createCascadingResolver({
        input: null as string | null,
        context: undefined,
        configDefault: undefined,
        fallback: 'always-present',
      });
      expect(result).not.toBeUndefined();
    });
  });
});
