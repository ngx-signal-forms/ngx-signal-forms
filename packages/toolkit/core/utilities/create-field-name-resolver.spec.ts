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
});
