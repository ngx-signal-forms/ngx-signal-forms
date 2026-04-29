import {
  assertInInjectionContext,
  computed,
  effect,
  isSignal,
  linkedSignal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import {
  submit,
  type FieldTree,
  type ValidationError,
} from '@angular/forms/signals';
import type { SubmittedStatus } from '../types';
import { walkFieldTreeEntries } from './walk-field-tree';
import { isBlockingError } from './warning-error';

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
    return assertFieldTree(resolvedFieldTree);
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
      if (
        prev !== undefined &&
        prev.source.touched &&
        !curr.touched &&
        !curr.submitting
      ) {
        return false;
      }

      if (prev !== undefined && prev.source.submitting && !curr.submitting) {
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

    return submittedHistory() || submitAttempted?.()
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
  return errors.filter(isBlockingError);
}

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
 * Angular's native `submit()` now owns the "mark every field as touched"
 * side effect, so this helper delegates that step and keeps only the
 * warning-aware gate in toolkit land.
 *
 * @public
 */
export async function submitWithWarnings<TModel>(
  formTree: FieldTree<TModel>,
  action: () => Promise<void>,
): Promise<void> {
  // This native submit call exists only for Angular's touch-all side effect.
  // The warning-aware gate and the real user action still live below.
  await submit(formTree, {
    ignoreValidators: 'all',
    action: async () => undefined,
  });

  await waitForValidationSettlement();

  if (getBlockingErrors(formTree().errorSummary()).length > 0) {
    return;
  }

  await action();
}

function assertFieldTree(value: unknown): FieldTree<unknown> {
  if (typeof value !== 'function') {
    throw new TypeError(
      'createSubmittedStatusTracker requires a FieldTree or Signal<FieldTree>.',
    );
  }

  // A single iteration is enough to force `walkFieldTreeEntries()` to read the
  // root FieldState contract. We intentionally stop immediately because the
  // tracker only needs validation, not a full traversal.
  for (const { state: treeState } of walkFieldTreeEntries(
    value as FieldTree<unknown>,
  )) {
    break;
  }

  return value as FieldTree<unknown>;
}

function waitForValidationSettlement(): Promise<void> {
  // Preserve the existing blur-vs-submit safety gap: touched state is now
  // delegated to Angular's native submit flow, but the error summary can still
  // lag by one microtask when the active control is mid-blur as submit fires.
  return new Promise((resolve) => {
    queueMicrotask(resolve);
  });
}
