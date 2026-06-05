import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFieldNameResolver } from './create-field-name-resolver';

describe('createFieldNameResolver', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns the explicit input when provided and non-empty', () => {
    TestBed.runInInjectionContext(() => {
      const explicit = signal<string | undefined>('email');
      const resolver = createFieldNameResolver({
        explicit,
        boundControl: () => null,
        wrapperName: 'test-wrapper',
      });

      expect(resolver()).toBe('email');
    });
  });

  it('trims whitespace from the explicit input', () => {
    TestBed.runInInjectionContext(() => {
      const resolver = createFieldNameResolver({
        explicit: signal<string | undefined>('  email  '),
        boundControl: () => null,
        wrapperName: 'test-wrapper',
      });

      expect(resolver()).toBe('email');
    });
  });

  it('falls back to labelFor when explicit is undefined', () => {
    TestBed.runInInjectionContext(() => {
      const resolver = createFieldNameResolver({
        explicit: signal<string | undefined>(undefined),
        labelFor: () => 'rating',
        boundControl: () => null,
        wrapperName: 'test-wrapper',
      });

      expect(resolver()).toBe('rating');
    });
  });

  it('falls back to bound control id when labelFor is empty', () => {
    TestBed.runInInjectionContext(() => {
      const element = document.createElement('input');
      element.id = 'phone';

      const resolver = createFieldNameResolver({
        explicit: signal<string | undefined>(undefined),
        labelFor: () => null,
        boundControl: () => element,
        wrapperName: 'test-wrapper',
      });

      expect(resolver()).toBe('phone');
    });
  });

  it('skips the labelFor tier when reader is omitted', () => {
    TestBed.runInInjectionContext(() => {
      const element = document.createElement('input');
      element.id = 'firstname';

      const resolver = createFieldNameResolver({
        explicit: signal<string | undefined>(undefined),
        boundControl: () => element,
        wrapperName: 'test-wrapper',
      });

      expect(resolver()).toBe('firstname');
    });
  });

  it('returns null when no tier resolves and warns once in dev mode', () => {
    TestBed.runInInjectionContext(() => {
      const resolver = createFieldNameResolver({
        explicit: signal<string | undefined>(undefined),
        boundControl: () => null,
        wrapperName: 'spartan-form-field',
      });

      expect(resolver()).toBeNull();
      expect(resolver()).toBeNull();
      expect(resolver()).toBeNull();

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[spartan-form-field]'),
      );
    });
  });

  it('reactively switches between tiers as inputs change', () => {
    TestBed.runInInjectionContext(() => {
      const explicit = signal<string | undefined>(undefined);
      const labelTarget = signal<string | null>(null);
      const element = document.createElement('input');
      element.id = 'fallback-id';

      const resolver = createFieldNameResolver({
        explicit,
        labelFor: () => labelTarget(),
        boundControl: () => element,
        wrapperName: 'test-wrapper',
      });

      expect(resolver()).toBe('fallback-id');

      labelTarget.set('label-target');
      expect(resolver()).toBe('label-target');

      explicit.set('explicit-name');
      expect(resolver()).toBe('explicit-name');

      explicit.set(undefined);
      expect(resolver()).toBe('label-target');
    });
  });

  it('treats whitespace-only explicit inputs as missing', () => {
    TestBed.runInInjectionContext(() => {
      const element = document.createElement('input');
      element.id = 'fallback';

      const resolver = createFieldNameResolver({
        explicit: signal<string | undefined>('   '),
        boundControl: () => element,
        wrapperName: 'test-wrapper',
      });

      expect(resolver()).toBe('fallback');
    });
  });

  // Pins the full precedence cascade in a single deterministic snapshot so a
  // future refactor that reorders the tiers, or quietly adds/removes a tier,
  // fails loudly. Mirrors the canonical wrapper's explicit -> id chain when
  // `labelFor` is omitted, and the opt-in explicit -> label `for=` -> id chain
  // when it is supplied. Both shapes share the same trimming + null-collapse.
  it('pins the precedence cascade: explicit > labelFor > bound id > null', () => {
    TestBed.runInInjectionContext(() => {
      const explicit = signal<string | undefined>('explicit-name');
      const labelFor = signal<string | null>('label-name');
      const idEl = document.createElement('input');
      idEl.id = 'bound-id';
      const boundControl = signal<HTMLElement | null>(idEl);

      const resolver = createFieldNameResolver({
        explicit,
        labelFor: () => labelFor(),
        boundControl: () => boundControl(),
        wrapperName: 'cascade-wrapper',
      });

      // Tier 1 wins over every lower tier.
      expect(resolver()).toBe('explicit-name');

      // Tier 1 missing -> tier 2 (label `for=`) wins over the bound id.
      explicit.set(undefined);
      expect(resolver()).toBe('label-name');

      // Tier 2 missing -> tier 3 (bound control id) wins.
      labelFor.set(null);
      expect(resolver()).toBe('bound-id');

      // Tier 3 missing -> null.
      boundControl.set(null);
      expect(resolver()).toBeNull();
    });
  });

  // The label `for=` tier is OPT-IN: omitting the reader must reproduce the
  // canonical wrapper's explicit -> id cascade EXACTLY, so the native-binding
  // path and the CSS-fallback path emit byte-identical names.
  it('produces identical names with and without the label tier when the label is absent', () => {
    TestBed.runInInjectionContext(() => {
      const el = document.createElement('input');
      el.id = 'shared-id';

      const withLabelTier = createFieldNameResolver({
        explicit: signal<string | undefined>(undefined),
        labelFor: () => null,
        boundControl: () => el,
        wrapperName: 'with-label',
      });
      const withoutLabelTier = createFieldNameResolver({
        explicit: signal<string | undefined>(undefined),
        boundControl: () => el,
        wrapperName: 'without-label',
      });

      expect(withLabelTier()).toBe(withoutLabelTier());
      expect(withLabelTier()).toBe('shared-id');
    });
  });

  // The dev warning latches on the FIRST miss and never fires again for the
  // resolver's lifetime — neither on subsequent misses NOR after a later hit
  // followed by another miss.
  it('latches the dev warning to one emission across miss -> hit -> miss', () => {
    TestBed.runInInjectionContext(() => {
      const explicit = signal<string | undefined>(undefined);
      const resolver = createFieldNameResolver({
        explicit,
        boundControl: () => null,
        wrapperName: 'latch-wrapper',
      });

      // First miss: warns once.
      expect(resolver()).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      // Recovers to a hit: still latched, no further warning.
      explicit.set('now-resolved');
      expect(resolver()).toBe('now-resolved');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      // Misses again: latch holds, no second warning.
      explicit.set(undefined);
      expect(resolver()).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });
});
