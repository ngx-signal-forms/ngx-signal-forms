import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { createAriaDescribedByBridge } from './create-aria-described-by-bridge';

describe('createAriaDescribedByBridge', () => {
  it('returns the toolkit composition verbatim when no IDs are registered', () => {
    TestBed.runInInjectionContext(() => {
      const toolkit = signal<string | null>('field-error field-hint');

      const bridge = createAriaDescribedByBridge({ toolkit });

      expect(bridge.describedBy()).toBe('field-error field-hint');
    });
  });

  it('returns null when the toolkit signal is null and no IDs registered', () => {
    TestBed.runInInjectionContext(() => {
      const bridge = createAriaDescribedByBridge({
        toolkit: signal<string | null>(null),
      });

      expect(bridge.describedBy()).toBeNull();
    });
  });

  it('appends registered descriptions and errors after toolkit IDs', () => {
    TestBed.runInInjectionContext(() => {
      const bridge = createAriaDescribedByBridge({
        toolkit: signal<string | null>('field-error'),
      });
      bridge.registerDescription('custom-description');
      bridge.registerError('vendor-error');

      expect(bridge.describedBy()).toBe(
        'field-error custom-description vendor-error',
      );
    });
  });

  it('deduplicates IDs while preserving toolkit-first ordering', () => {
    TestBed.runInInjectionContext(() => {
      const bridge = createAriaDescribedByBridge({
        toolkit: signal<string | null>('field-error duplicate-id'),
      });

      bridge.registerDescription('duplicate-id');
      bridge.registerError('field-error');

      expect(bridge.describedBy()).toBe('field-error duplicate-id');
    });
  });

  it('reactively updates when the toolkit signal changes', () => {
    TestBed.runInInjectionContext(() => {
      const toolkit = signal<string | null>(null);
      const bridge = createAriaDescribedByBridge({ toolkit });

      expect(bridge.describedBy()).toBeNull();

      toolkit.set('field-error');
      expect(bridge.describedBy()).toBe('field-error');

      toolkit.set('field-error field-warning');
      expect(bridge.describedBy()).toBe('field-error field-warning');
    });
  });

  it('removes IDs on unregister', () => {
    TestBed.runInInjectionContext(() => {
      const bridge = createAriaDescribedByBridge({
        toolkit: signal<string | null>(null),
      });
      bridge.registerDescription('hint');
      bridge.registerError('vendor-error');

      expect(bridge.describedBy()).toBe('hint vendor-error');

      bridge.unregisterDescription('hint');
      expect(bridge.describedBy()).toBe('vendor-error');

      bridge.unregisterError('vendor-error');
      expect(bridge.describedBy()).toBeNull();
    });
  });

  it('treats double registration as a no-op (set semantics)', () => {
    TestBed.runInInjectionContext(() => {
      const bridge = createAriaDescribedByBridge({
        toolkit: signal<string | null>(null),
      });
      bridge.registerDescription('hint');
      bridge.registerDescription('hint');

      expect(bridge.describedBy()).toBe('hint');
    });
  });

  it('ignores empty toolkit values when splitting', () => {
    TestBed.runInInjectionContext(() => {
      const bridge = createAriaDescribedByBridge({
        toolkit: signal<string | null>('   '),
      });

      expect(bridge.describedBy()).toBeNull();
    });
  });
});
