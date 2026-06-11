import { signal } from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import { describe, expect, it, vi } from 'vitest';

import { submitWithWarnings } from './submission-helpers';

describe('submitWithWarnings markAsTouched() delegation', () => {
  it('delegates touch-all to markAsTouched() on the root form tree', async () => {
    const errorsState = signal<ValidationError[]>([]);
    const markAsTouched = vi.fn((): void => undefined);

    const formTree = createMockFieldTree({
      value: () => ({}),
      valid: () => true,
      invalid: () => false,
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

    await submitWithWarnings(formTree, action);

    // markAsTouched() must be called before any validation gate check.
    expect(markAsTouched).toHaveBeenCalledOnce();
    // No blocking errors → action runs.
    expect(action).toHaveBeenCalledOnce();
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

    await submitWithWarnings(formTree, action);

    // markAsTouched() must still be called even when submission is blocked.
    expect(markAsTouched).toHaveBeenCalledOnce();
    // Blocking errors → action does NOT run.
    expect(action).not.toHaveBeenCalled();
  });

  it('skips the action when pending() is true after the microtask settlement delay', async () => {
    // Regression for Bug 1 (issue #73): submitWithWarnings was missing the
    // pending() guard that canSubmitWithWarnings already had. An async validator
    // still in flight after the microtask delay could leave pending()=true while
    // errorSummary() appears empty, causing the action to fire prematurely.
    const pendingState = signal(true);
    const errorsState = signal<ValidationError[]>([]);
    const markAsTouched = vi.fn((): void => undefined);

    const formTree = createMockFieldTree({
      value: () => ({}),
      valid: () => true,
      invalid: () => false,
      touched: () => true,
      dirty: () => false,
      errors: () => errorsState(),
      pending: () => pendingState(),
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

    // pending()=true → action must NOT fire.
    await submitWithWarnings(formTree, action);
    expect(action).not.toHaveBeenCalled();

    // Once async validators settle, pending()=false → action fires.
    pendingState.set(false);
    await submitWithWarnings(formTree, action);
    expect(action).toHaveBeenCalledOnce();
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
