import { computed, signal, type Signal } from '@angular/core';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  CASCADING_SOURCE,
  createCascadingResolver,
  type CascadingTier,
} from './cascading-resolver';

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

  // ─── Reactive tiers ──────────────────────────────────────────────────────

  describe('Reactive signal updates propagate', () => {
    it('returns a Signal<T> when input is a Signal', () => {
      const inputSig = signal<string | null>('hello');
      const result = createCascadingResolver({
        input: inputSig,
        fallback: 'fallback',
      });
      expect(typeof result).toBe('function');
      expectTypeOf(result).toEqualTypeOf<Signal<string>>();
      expect(result()).toBe('hello');
    });

    it('reflects updated signal value after input signal changes', () => {
      const inputSig = signal<string | null>('initial');
      const result = createCascadingResolver({
        input: inputSig,
        fallback: 'fallback',
      });

      expect(result()).toBe('initial');
      inputSig.set('updated');
      expect(result()).toBe('updated');
    });

    it('falls through to fallback when signal emits null', () => {
      const inputSig = signal<string | null>('present');
      const result = createCascadingResolver({
        input: inputSig,
        fallback: 'fallback',
      });

      expect(result()).toBe('present');
      inputSig.set(null);
      expect(result()).toBe('fallback');
    });

    it('correctly cascades across reactive and static tiers', () => {
      const inputSig = signal<string | null | undefined>(null);
      const contextSig = signal<string | null | undefined>('ctx-value');

      const result = createCascadingResolver({
        input: inputSig,
        context: contextSig,
        configDefault: 'config',
        fallback: 'fallback',
      });

      expect(result()).toBe('ctx-value');

      contextSig.set(null);
      expect(result()).toBe('config');

      inputSig.set('input-wins');
      expect(result()).toBe('input-wins');
    });

    it('returns Signal<T> when configDefault is a computed signal', () => {
      const base = signal(42);
      const configSig = computed(() => (base() > 0 ? 100 : null));

      const result = createCascadingResolver({
        input: null as number | null,
        configDefault: configSig,
        fallback: 0,
      });

      expect(result()).toBe(100);
      base.set(-1);
      expect(result()).toBe(0);
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

  // ─── Dev-mode __source introspection ────────────────────────────────────
  // Unit tests run in Angular dev mode (isDevMode() === true), so these
  // assertions execute unconditionally.

  describe('Dev-mode __source introspection', () => {
    it('attaches CASCADING_SOURCE to resolved object in dev mode', () => {
      const value = { autoAria: true };
      const result = createCascadingResolver({
        input: null as typeof value | null,
        configDefault: value,
        fallback: { autoAria: false },
      });
      // In dev mode, the winning object carries the source tier
      const source = (result as Record<symbol, CascadingTier>)[
        CASCADING_SOURCE
      ];
      expect(source).toBe('configDefault');
    });

    it('reports "input" tier when input wins', () => {
      const value = { key: 'val' };
      const result = createCascadingResolver({
        input: value,
        fallback: { key: 'fallback' },
      });
      const source = (result as Record<symbol, CascadingTier>)[
        CASCADING_SOURCE
      ];
      expect(source).toBe('input');
    });

    it('reports "fallback" tier when all upstream tiers are nullish', () => {
      const fallback = { key: 'fallback' };
      const result = createCascadingResolver({
        input: null as typeof fallback | null,
        fallback,
      });
      const source = (result as Record<symbol, CascadingTier>)[
        CASCADING_SOURCE
      ];
      expect(source).toBe('fallback');
    });

    it('does not attach CASCADING_SOURCE to primitives', () => {
      // Symbol-keyed properties are not possible on primitives; no error thrown.
      const result = createCascadingResolver({
        input: null as string | null,
        fallback: 'primitive',
      });
      // Just confirm no error and value is correct
      expect(result).toBe('primitive');
    });
  });
});
