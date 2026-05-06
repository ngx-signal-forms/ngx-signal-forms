import { signal } from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { submitSpy } = vi.hoisted(() => ({
  submitSpy: vi.fn(),
}));

vi.mock('@angular/forms/signals', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@angular/forms/signals')>();
  return {
    ...actual,
    submit: submitSpy,
  };
});

import { submitWithWarnings } from './submission-helpers';

describe('submitWithWarnings native submit() delegation', () => {
  beforeEach(() => {
    submitSpy.mockReset();
  });

  it('delegates touched-state updates to Angular submit() with ignoreValidators="all"', async () => {
    const errorsState = signal<ValidationError[]>([
      { kind: 'required', message: 'Password is required' },
    ]);
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
      markAsTouched: (): void => undefined,
      markAsDirty: (): void => undefined,
      errorSummary: () => errorsState(),
    });
    const action = vi.fn(async () => {});

    submitSpy.mockImplementation(async (_form, options) => {
      expect(options).toMatchObject({
        ignoreValidators: 'all',
        action: expect.any(Function),
      });
      queueMicrotask(() => {
        errorsState.set([
          { kind: 'warn:weak-password', message: 'Weak password' },
        ]);
      });
      if (typeof options === 'object') {
        await options.action?.();
      }
      return true;
    });

    await submitWithWarnings(formTree, action);

    expect(submitSpy).toHaveBeenCalledOnce();
    expect(action).toHaveBeenCalledOnce();
  });

  it('keeps the warning-aware gate at the caller layer after native submit() runs', async () => {
    const errorsState = signal<ValidationError[]>([
      { kind: 'required', message: 'Email is required' },
    ]);
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
      markAsTouched: (): void => undefined,
      markAsDirty: (): void => undefined,
      errorSummary: () => errorsState(),
    });
    const action = vi.fn(async () => {});

    submitSpy.mockImplementation(async (_form, options) => {
      expect(options).toMatchObject({
        ignoreValidators: 'all',
        action: expect.any(Function),
      });
      queueMicrotask(() => {
        errorsState.set([{ kind: 'required', message: 'Email is required' }]);
      });
      if (typeof options === 'object') {
        await options.action?.();
      }
      return false;
    });

    await submitWithWarnings(formTree, action);

    expect(submitSpy).toHaveBeenCalledOnce();
    expect(action).not.toHaveBeenCalled();
  });

  it('skips the action when pending() is true after the microtask settlement delay', async () => {
    // Regression for Bug 1 (issue #73): submitWithWarnings was missing the
    // pending() guard that canSubmitWithWarnings already had. An async validator
    // still in flight after the microtask delay could leave pending()=true while
    // errorSummary() appears empty, causing the action to fire prematurely.
    const pendingState = signal(true);
    const errorsState = signal<ValidationError[]>([]);
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
      markAsTouched: (): void => undefined,
      markAsDirty: (): void => undefined,
      errorSummary: () => errorsState(),
    });
    const action = vi.fn(async () => {});

    submitSpy.mockImplementation(async (_form, options) => {
      if (typeof options === 'object') await options.action?.();
      return true;
    });

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
