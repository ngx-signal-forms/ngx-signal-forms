import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { FieldTree } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import {
  createErrorRendererInputs,
  toHintDescriptors,
  type HintLike,
} from './wrapper-helpers';

describe('toHintDescriptors', () => {
  it('maps hint primitives into the registry wire format', () => {
    TestBed.runInInjectionContext(() => {
      const hint: HintLike = {
        resolvedId: () => 'email-hint-0',
        resolvedFieldName: () => 'email',
      };
      const hints = signal<readonly HintLike[]>([hint]);

      const descriptors = toHintDescriptors(hints);

      expect(descriptors()).toEqual([
        { id: 'email-hint-0', fieldName: 'email' },
      ]);
    });
  });

  it('reactively re-derives when the hint list changes', () => {
    TestBed.runInInjectionContext(() => {
      const first: HintLike = {
        resolvedId: () => 'a',
        resolvedFieldName: () => 'name',
      };
      const second: HintLike = {
        resolvedId: () => 'b',
        resolvedFieldName: () => null,
      };

      const hints = signal<readonly HintLike[]>([first]);
      const descriptors = toHintDescriptors(hints);
      expect(descriptors()).toHaveLength(1);

      hints.set([first, second]);
      expect(descriptors()).toEqual([
        { id: 'a', fieldName: 'name' },
        { id: 'b', fieldName: null },
      ]);
    });
  });

  it('returns an empty array when no hints are projected', () => {
    TestBed.runInInjectionContext(() => {
      expect(toHintDescriptors(signal<readonly HintLike[]>([]))()).toEqual([]);
    });
  });
});

describe('createErrorRendererInputs', () => {
  it('packs the canonical { formField, strategy, submittedStatus } shape', () => {
    TestBed.runInInjectionContext(() => {
      // Minimal FieldTree shim — we only need reference identity here.
      const fieldTree = (() => null) as unknown as FieldTree<string>;
      const formField = signal<FieldTree<string>>(fieldTree);
      const strategy = signal('on-touch' as const);
      const submittedStatus = signal('unsubmitted' as const);

      const inputs = createErrorRendererInputs({
        formField,
        strategy,
        submittedStatus,
      });

      expect(inputs()).toEqual({
        formField: fieldTree,
        strategy: 'on-touch',
        submittedStatus: 'unsubmitted',
      });
    });
  });

  it('reactively recomputes when any source signal changes', () => {
    TestBed.runInInjectionContext(() => {
      const fieldTree = (() => null) as unknown as FieldTree<string>;
      const strategy = signal<'on-touch' | 'on-submit' | 'immediate'>(
        'on-touch',
      );
      const submittedStatus = signal<
        'unsubmitted' | 'submitting' | 'submitted'
      >('unsubmitted');

      const inputs = createErrorRendererInputs({
        formField: signal(fieldTree),
        strategy,
        submittedStatus,
      });

      strategy.set('immediate');
      submittedStatus.set('submitted');

      expect(inputs()).toEqual({
        formField: fieldTree,
        strategy: 'immediate',
        submittedStatus: 'submitted',
      });
    });
  });
});
