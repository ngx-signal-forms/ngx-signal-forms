import { ApplicationRef, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  form,
  schema,
  validate,
  type FieldTree,
  type ValidationError,
} from '@angular/forms/signals';
import { describe, expect, it, vi } from 'vitest';
import {
  canSubmitWithWarnings,
  createSubmittedStatusTracker,
  getBlockingErrors,
  hasOnlyWarnings,
} from './submission-helpers';
import { warningError } from './warning-error';

/**
 * Coverage spec for previously-untested public exports of submission-helpers.
 *
 * Pins the contract for:
 * - `createSubmittedStatusTracker` — direct tests of the linkedSignal-based
 *   transition tracker (independent of the `hasSubmitted` wrapper).
 * - `hasOnlyWarnings` — predicate over a ValidationError[].
 * - `getBlockingErrors` — filter over ValidationError[].
 * - `canSubmitWithWarnings` — computed signal against a real Angular form.
 */
describe('createSubmittedStatusTracker', () => {
  const flush = async (): Promise<void> => {
    await TestBed.inject(ApplicationRef).whenStable();
  };

  const makeMockForm = (
    submitting: () => boolean,
    touched: () => boolean,
  ): FieldTree<unknown> => {
    return signal({
      value: () => ({}),
      valid: () => true,
      invalid: () => false,
      touched,
      dirty: () => false,
      errors: () => [],
      pending: () => false,
      disabled: () => false,
      readonly: () => false,
      hidden: () => false,
      submitting,
      submittedStatus: () => 'unsubmitted' as const,
      reset: vi.fn(),
      markAsTouched: vi.fn(),
      markAsDirty: vi.fn(),
      resetSubmittedStatus: vi.fn(),
      errorSummary: () => [],
    });
  };

  it('returns "unsubmitted" → "submitting" → "submitted" through a successful cycle', async () => {
    const submittingState = signal(false);
    const touchedState = signal(false);
    const mockForm = makeMockForm(
      () => submittingState(),
      () => touchedState(),
    );

    const status = TestBed.runInInjectionContext(() =>
      createSubmittedStatusTracker(mockForm),
    );

    // Initial.
    expect(status()).toBe('unsubmitted');

    // Submit fired: native `submitting()` flips true and the form is touched.
    submittingState.set(true);
    touchedState.set(true);
    await flush();
    expect(status()).toBe('submitting');

    // Submit settles: `submitting()` returns to false → tracker captures the
    // true → false transition and surfaces 'submitted'.
    submittingState.set(false);
    await flush();
    expect(status()).toBe('submitted');
  });

  it('flips to "submitted" on submitAttempted even when submitting() never fires (invalid form)', async () => {
    const submittingState = signal(false);
    const touchedState = signal(false);
    const submitAttempted: WritableSignal<boolean> = signal(false);
    const mockForm = makeMockForm(
      () => submittingState(),
      () => touchedState(),
    );

    const status = TestBed.runInInjectionContext(() =>
      createSubmittedStatusTracker(mockForm, submitAttempted),
    );

    // Pre-submit baseline.
    expect(status()).toBe('unsubmitted');

    // Invalid form: Angular's `submit()` short-circuits and never sets
    // `submitting=true`. Consumers signal the attempt via the optional
    // submitAttempted writable.
    submitAttempted.set(true);
    await flush();
    expect(status()).toBe('submitted');
  });

  it('resets to "unsubmitted" and clears submitAttempted when touched returns to false', async () => {
    const submittingState = signal(false);
    const touchedState = signal(false);
    const submitAttempted: WritableSignal<boolean> = signal(false);
    const mockForm = makeMockForm(
      () => submittingState(),
      () => touchedState(),
    );

    const status = TestBed.runInInjectionContext(() =>
      createSubmittedStatusTracker(mockForm, submitAttempted),
    );

    // Drive a full submit cycle.
    submittingState.set(true);
    touchedState.set(true);
    await flush();
    submittingState.set(false);
    await flush();
    expect(status()).toBe('submitted');

    // Reset: form.reset() flips touched back to false. Tracker must roll
    // back to 'unsubmitted' AND clear the external submitAttempted signal.
    touchedState.set(false);
    await flush();
    expect(status()).toBe('unsubmitted');
    expect(submitAttempted()).toBe(false);
  });

  it("should not reset to 'unsubmitted' when touched flips false during in-flight submission", async () => {
    // Pins the WCAG-equivalent invariant: the `!curr.submitting` guard at
    // submission-helpers.ts protects against mid-submit rollback so users
    // never see the form's submitted-status flicker back while a request
    // is still in flight.
    const submittingState = signal(false);
    const touchedState = signal(false);
    const mockForm = makeMockForm(
      () => submittingState(),
      () => touchedState(),
    );

    const status = TestBed.runInInjectionContext(() =>
      createSubmittedStatusTracker(mockForm),
    );

    // Submit fired: native `submitting()` flips true and the form is touched.
    submittingState.set(true);
    touchedState.set(true);
    await flush();
    expect(status()).toBe('submitting');

    // Mid-flight: a touched true → false transition arrives while
    // `submitting()` is STILL true. The guard must hold the status at
    // 'submitting' and refuse to roll back to 'unsubmitted'.
    touchedState.set(false);
    await flush();
    expect(status()).toBe('submitting');

    // Submit settles: `submitting()` returns to false → 'submitted'.
    submittingState.set(false);
    await flush();
    expect(status()).toBe('submitted');
  });

  it('throws synchronously when given neither a FieldTree nor a Signal<FieldTree>', () => {
    // Negative: passing a value that fails the `isFieldTree` guard must
    // surface a clear error rather than silently producing 'unsubmitted'.
    expect(() =>
      TestBed.runInInjectionContext(() =>
        createSubmittedStatusTracker(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {} as any,
        ),
      ),
    ).toThrow(/FieldTree or Signal<FieldTree>/);
  });
});

describe('hasOnlyWarnings', () => {
  it('returns true for an empty errors array', () => {
    expect(hasOnlyWarnings([])).toBe(true);
  });

  it('returns true when every error is a warning', () => {
    const warnings: readonly ValidationError[] = [
      warningError('weak-password', 'Use 12+ characters'),
      warningError('disposable-email'),
    ];
    expect(hasOnlyWarnings(warnings)).toBe(true);
  });

  it('returns false when any blocking error is present', () => {
    const mixed: readonly ValidationError[] = [
      warningError('weak-password'),
      { kind: 'required', message: 'Password is required' },
    ];
    expect(hasOnlyWarnings(mixed)).toBe(false);
  });
});

describe('getBlockingErrors', () => {
  it('returns an empty array for empty input', () => {
    expect(getBlockingErrors([])).toEqual([]);
  });

  it('filters out warning errors and preserves order of blocking errors', () => {
    const required: ValidationError = {
      kind: 'required',
      message: 'Required',
    };
    const tooShort: ValidationError = { kind: 'minlength', message: 'Min 8' };
    const errors: readonly ValidationError[] = [
      required,
      warningError('weak-password'),
      tooShort,
      warningError('disposable-email'),
    ];

    const blocking = getBlockingErrors(errors);

    expect(blocking).toEqual([required, tooShort]);
    // Order preservation: indices should match the original blocking order.
    expect(blocking[0]).toBe(required);
    expect(blocking[1]).toBe(tooShort);
  });

  it('returns an empty array when all errors are warnings (negative path)', () => {
    const warnings: readonly ValidationError[] = [
      warningError('weak-password'),
      warningError('disposable-email'),
    ];
    expect(getBlockingErrors(warnings)).toEqual([]);
  });
});

describe('canSubmitWithWarnings', () => {
  // Real Angular forms — exercise the signal-form integration end-to-end so
  // that we'd catch any drift in `errors()`/`submitting()`/`pending()` shapes.
  const flush = async (): Promise<void> => {
    await TestBed.inject(ApplicationRef).whenStable();
  };

  it('returns true for a warning-only form', async () => {
    const model = signal({ username: 'abc' });
    const f = TestBed.runInInjectionContext(() =>
      form(
        model,
        schema<{ username: string }>((path) => {
          validate(path.username, (ctx) => {
            const value = ctx.value();
            if (value && value.length < 6) {
              return warningError('short-username', 'Use 6+ characters');
            }
            return null;
          });
        }),
      ),
    );

    const canSubmit = TestBed.runInInjectionContext(() =>
      canSubmitWithWarnings(f),
    );
    await flush();

    expect(canSubmit()).toBe(true);
  });

  it('returns false when the form has any blocking error', async () => {
    // Validator placed at the root path so the blocking error lands in
    // `errors()` of the root FieldState (which is what
    // `canSubmitWithWarnings` reads). Required-on-child errors live on the
    // child FieldState's `errors()`, not the root, and would surface only
    // through `errorSummary()`.
    const model = signal({ email: '' });
    const f = TestBed.runInInjectionContext(() =>
      form(
        model,
        schema<{ email: string }>((path) => {
          validate(path, (ctx) => {
            const value = ctx.value();
            if (!value.email) {
              return { kind: 'required', message: 'Email is required' };
            }
            return null;
          });
        }),
      ),
    );

    const canSubmit = TestBed.runInInjectionContext(() =>
      canSubmitWithWarnings(f),
    );
    await flush();

    expect(canSubmit()).toBe(false);
  });

  it('returns false while submitting()/pending() are true (mock form)', () => {
    // canSubmitWithWarnings reads `submitting()` and `pending()` on the
    // FieldState. Use a mock to drive both signals deterministically without
    // racing the Angular submit pipeline.
    const submittingState = signal(false);
    const pendingState = signal(false);
    const errorsState = signal<readonly ValidationError[]>([]);
    const mockForm = signal({
      value: () => ({}),
      valid: () => true,
      invalid: () => false,
      touched: () => false,
      dirty: () => false,
      errors: () => errorsState(),
      pending: () => pendingState(),
      disabled: () => false,
      readonly: () => false,
      hidden: () => false,
      submitting: () => submittingState(),
      submittedStatus: () => 'unsubmitted' as const,
      reset: vi.fn(),
      markAsTouched: vi.fn(),
      markAsDirty: vi.fn(),
      resetSubmittedStatus: vi.fn(),
      errorSummary: () => errorsState(),
    }) as unknown as FieldTree<unknown>;

    const canSubmit = TestBed.runInInjectionContext(() =>
      canSubmitWithWarnings(mockForm),
    );

    // Idle baseline.
    expect(canSubmit()).toBe(true);

    // submitting() true → block.
    submittingState.set(true);
    expect(canSubmit()).toBe(false);
    submittingState.set(false);

    // pending() true → block.
    pendingState.set(true);
    expect(canSubmit()).toBe(false);
    pendingState.set(false);

    // Back to idle.
    expect(canSubmit()).toBe(true);
  });
});
