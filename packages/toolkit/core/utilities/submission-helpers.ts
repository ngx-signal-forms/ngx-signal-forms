import {
  assertInInjectionContext,
  computed,
  effect,
  isSignal,
  linkedSignal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { type FieldTree, type ValidationError } from '@angular/forms/signals';
import type { SubmittedStatus } from '../types';
import { isBlockingError } from './warning-error';
import { isFieldTree } from './walk-field-tree';

/**
 * Tracks completed-once submission history on top of native
 * `FieldState.submitting()`.
 *
 * Angular Signal Forms exposes `submitting()` and `touched()` but does not
 * retain whether a submission has already completed. This helper derives that
 * history:
 * - `'unsubmitted'` — no submission attempt has completed yet
 * - `'submitting'` — `submitting()` is currently `true`
 * - `'submitted'` — `submitting()` completed at least once, or an invalid
 *   submit attempt was recorded via the optional `submitAttempted` signal
 *
 * When `form.reset()` flips `touched()` from `true` to `false`, the derived
 * history resets to `'unsubmitted'`.
 *
 * @param formTree A `FieldTree` or `Signal<FieldTree>` (supports deferred resolution via `input.required()`)
 * @param submitAttempted Optional `WritableSignal<boolean>` consumers set to
 *   `true` when an invalid-form submit attempt would otherwise leave native
 *   `submitting()` flat (Angular's `submit()` short-circuits on invalid forms
 *   without ever flipping the signal). The tracker treats a `true` value as
 *   evidence of a completed attempt and reports `'submitted'`. The signal is
 *   cleared automatically when `touched()` returns to `false` (form reset).
 * @returns Signal with the current `SubmittedStatus`
 *
 * @remarks
 * Must be called in an injection context (uses `effect()` internally).
 *
 * @public
 */
/* oxlint-disable @typescript-eslint/prefer-readonly-parameter-types -- Angular Signal Forms models FieldTree as a callable object, and wrapping it in Readonly<T> removes its call signature. */
export function createSubmittedStatusTracker(
  formTree: FieldTree<unknown> | Signal<FieldTree<unknown>>,
  submitAttempted?: WritableSignal<boolean>,
): Signal<SubmittedStatus> {
  assertInInjectionContext(createSubmittedStatusTracker);

  const resolve = (): FieldTree<unknown> => {
    const resolvedFieldTree = isSignal(formTree) ? formTree() : formTree;
    assertFieldTree(resolvedFieldTree);
    return resolvedFieldTree;
  };

  if (!isSignal(formTree)) {
    resolve();
  }

  const submittedHistory = linkedSignal<
    { submitting: boolean; touched: boolean },
    boolean
  >({
    source: () => {
      const state = resolve()();
      return {
        submitting: state.submitting(),
        touched: state.touched(),
      };
    },
    computation: (curr, prev) => {
      const previousSource = prev?.source;

      if (
        previousSource?.touched === true &&
        !curr.touched &&
        !curr.submitting
      ) {
        return false;
      }

      if (previousSource?.submitting === true && !curr.submitting) {
        return true;
      }

      return prev?.value ?? false;
    },
  });

  effect(() => {
    submittedHistory();
  });

  if (submitAttempted !== undefined) {
    let previousTouched = false;
    effect(() => {
      const state = resolve()();
      const touched = state.touched();
      const submitting = state.submitting();
      const wasTouched = previousTouched;
      previousTouched = touched;

      if (wasTouched && !touched && !submitting && submitAttempted()) {
        submitAttempted.set(false);
      }
    });
  }

  return computed(() => {
    const state = resolve()();
    if (state.submitting()) {
      return 'submitting';
    }

    return submittedHistory() || (submitAttempted?.() ?? false)
      ? 'submitted'
      : 'unsubmitted';
  });
}
/* oxlint-enable @typescript-eslint/prefer-readonly-parameter-types */

/**
 * Computed signal indicating whether a form has been submitted.
 *
 * Returns `true` when:
 * - Form has completed at least one submission attempt
 * - Derived submission status resolves to `'submitted'`
 *
 * Use this to conditionally show messages or change UI after submission.
 *
 * @param formTree The form tree to check submission history for
 * @returns Signal that emits `true` when form has been submitted
 *
 * @public
 */
export function hasSubmitted(formTree: FieldTree<unknown>): Signal<boolean> {
  const submittedStatus = createSubmittedStatusTracker(formTree);
  return computed(() => submittedStatus() === 'submitted');
}

/**
 * Checks whether a form has only warnings (no blocking errors).
 *
 * @public
 */
export function hasOnlyWarnings(errors: readonly ValidationError[]): boolean {
  if (errors.length === 0) return true;
  return errors.every((error) => !isBlockingError(error));
}

/**
 * Gets blocking errors only (excludes warnings).
 *
 * @public
 */
export function getBlockingErrors(
  errors: readonly ValidationError[],
): ValidationError[] {
  return errors.filter((error) => isBlockingError(error));
}

// Tracks form trees with a submitWithWarnings() call in flight. Native
// submitting() cannot serve as this guard: the helper runs the user action
// OUTSIDE any native submit, so submitting() is false during `await action()`
// — exactly the window a double-click hits.
const inFlightSubmits = new WeakSet<FieldTree<unknown>>();

/**
 * Computed signal indicating whether a form can be submitted with warnings.
 *
 * @public
 */
export function canSubmitWithWarnings(
  formTree: FieldTree<unknown>,
): Signal<boolean> {
  return computed(() => {
    const formState = formTree();
    if (formState.submitting() || formState.pending()) {
      return false;
    }

    return getBlockingErrors(formState.errors()).length === 0;
  });
}

/**
 * Submits a form, allowing warnings to pass through.
 *
 * Marks all form fields as touched (including all descendants), yields one
 * microtask so that synchronously-resolving validation state propagates, then
 * invokes `action` only when there are no blocking errors. Still-pending async
 * validators are handled by the `pending()` guard that follows the yield.
 * Warnings (errors whose `kind` starts with `'warn:'`) do not block submission.
 *
 * **Re-entrancy**: concurrent calls for the same `formTree` — from a
 * double-click, Enter spam, or an overlapping native submit — are silently
 * dropped. The in-flight guard is cleared in the `finally` block so the form
 * is always re-submittable after the current call settles (even on rejection).
 *
 * @param formTree - The root `FieldTree` of the form to submit
 * @param action - Async callback invoked only when no blocking errors remain
 *
 * @public
 */
export async function submitWithWarnings<TModel>(
  formTree: FieldTree<TModel>,
  action: () => Promise<void>,
): Promise<void> {
  // Re-entrant call (double-click, Enter spam) or overlapping native
  // submission: bail out instead of running the action a second time.
  if (formTree().submitting() || inFlightSubmits.has(formTree)) {
    return;
  }

  inFlightSubmits.add(formTree);
  try {
    // Signal Forms (stable since Angular 22) exposes markAsTouched(), which
    // marks the field AND all descendants touched — the only side effect the
    // previous native-submit-with-noop-action delegation existed to trigger.
    formTree().markAsTouched();

    await waitForValidationSettlement();

    // Mirrors the canSubmitWithWarnings() guard: async validators may still be
    // settling after the microtask delay — skip action until they resolve.
    if (formTree().pending()) {
      return;
    }

    if (getBlockingErrors(formTree().errorSummary()).length > 0) {
      return;
    }

    await action();
  } finally {
    inFlightSubmits.delete(formTree);
  }
}

function assertFieldTree(value: unknown): asserts value is FieldTree<unknown> {
  if (!isFieldTree(value)) {
    throw new TypeError(
      'createSubmittedStatusTracker requires a FieldTree or Signal<FieldTree>.',
    );
  }
}

function waitForValidationSettlement(): Promise<void> {
  // Preserve the blur-vs-submit safety gap: the error summary can lag by one
  // microtask when the active control is mid-blur as markAsTouched() fires.
  return new Promise((resolve) => {
    queueMicrotask(resolve);
  });
}
