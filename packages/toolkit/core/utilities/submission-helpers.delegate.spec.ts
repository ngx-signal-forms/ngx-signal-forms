import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  form,
  type FieldTree,
  type ValidationError,
} from '@angular/forms/signals';
import { describe, expect, it, vi } from 'vitest';

import { submitWithWarnings } from './submission-helpers';

describe('submitWithWarnings markAsTouched() delegation', () => {
  it('delegates touch-all to markAsTouched() on the root form tree', async () => {
    // The success path now delegates to Angular's native `submit()`, which
    // reads internal form-tree structure a hand-rolled mock cannot fake — use
    // a real, always-valid form so the delegation actually executes and
    // `touched()` reflects the real markAsTouched() call.
    const model = signal({ name: 'Ada' });
    const formTree = TestBed.runInInjectionContext(() => form(model));
    const action = vi.fn(async () => {});

    expect(formTree().touched()).toBe(false);

    const result = await submitWithWarnings(formTree, action);

    // markAsTouched() must be called before any validation gate check.
    expect(formTree().touched()).toBe(true);
    // No blocking errors → action runs.
    expect(action).toHaveBeenCalledOnce();
    expect(result).toBe(true);
  });

  it('calls markAsTouched() even when blocking errors remain (touch-all is unconditional)', async () => {
    const errorsState = signal<ValidationError[]>([
      { kind: 'required', message: 'Email is required' },
    ]);
    const markAsTouched = vi.fn((): void => undefined);

    const formTree = createMockFieldTree({
      value: () => ({}),
      valid: () => false,
      invalid: () => true,
      touched: () => false,
      dirty: () => false,
      errors: () => errorsState(),
      pending: () => false,
      disabled: () => false,
      readonly: () => false,
      hidden: () => false,
      submitting: () => false,
      reset: (): void => undefined,
      markAsTouched,
      markAsDirty: (): void => undefined,
      errorSummary: () => errorsState(),
    });
    const action = vi.fn(async () => {});

    const result = await submitWithWarnings(formTree, action);

    // markAsTouched() must still be called even when submission is blocked.
    expect(markAsTouched).toHaveBeenCalledOnce();
    // Blocking errors → action does NOT run.
    expect(action).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});

function createMockFieldTree<TValue>(
  state: Readonly<Record<string, unknown>>,
): FieldTree<TValue> {
  let fieldTree!: FieldTree<TValue>;

  fieldTree = (() => ({
    ...state,
    get fieldTree() {
      return fieldTree;
    },
  })) as FieldTree<TValue>;

  return fieldTree;
}
