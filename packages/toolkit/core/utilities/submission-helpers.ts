import {
  assertInInjectionContext,
  computed,
  effect,
  isSignal,
  linkedSignal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import type { SubmittedStatus } from '../types';
import { isBlockingError } from './warning-error';

/**
 * Tracks submission lifecycle by watching `submitting()` transitions.
 *
 * Angular Signal Forms exposes `submitting()` and `touched()` but does NOT
 * provide a `submittedStatus()` signal. This function derives it:
 * - `'unsubmitted'` — no submission attempt yet
 * - `'submitting'` — `submitting()` is currently `true`
 * - `'submitted'` — `submitting()` transitioned from `true` to `false`
 *
 * When an optional writable submit-attempt signal is supplied, invalid submit
 * attempts can also transition the derived status to `'submitted'` even though
 * Angular's `submitting()` signal never becomes `true` for invalid forms.
 * The tracker **owns the reset lifecycle** for this signal: when `touched()`
 * transitions from `true` to `false` (i.e. after `form.reset()`), the tracker
 * resets both its internal `submitted` state and the external `submitAttempted`
 * signal back to `false`.
 *
 * @param formTree A `FieldTree` or `Signal<FieldTree>` (supports deferred resolution via `input.required()`)
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
    if (isFieldTree(formTree)) {
      return formTree;
    }

    if (isSignal(formTree)) {
      const resolvedFieldTree = formTree();
      if (isFieldTree(resolvedFieldTree)) {
        return resolvedFieldTree;
      }
    }

    throw new Error(
      'createSubmittedStatusTracker requires a FieldTree or Signal<FieldTree>.',
    );
  };

  // Validate eagerly so callers learn about a wiring bug at construction
  // time rather than asynchronously when the warm-effect runs. Signal-typed
  // inputs are deferred (`input.required()` may not yet have produced the
  // tree) — for those we delegate to the lazy `resolve()` path.
  if (!isSignal(formTree)) {
    resolve();
  }

  // Angular 21 idiom: derive submitted-history via `linkedSignal` so the
  // transition detection (true → false on `submitting`, true → false on
  // `touched`) is expressed declaratively against `prev` instead of through
  // a multi-write `effect()` that the previous implementation used.
  //
  // The previous shape wrote to THREE signals from one effect
  // (`submitted`, `prevSubmitting`, `prevTouched`) — the canonical
  // "effect writes to signals" antipattern that re-runs in the same tick
  // and makes change-detection ordering load-bearing. This rewrite captures
  // the previous source snapshot via `linkedSignal`'s `prev.source` so we
  // need no manually-managed mirror signals.
  //
  // Important: `linkedSignal` is lazy — its source is evaluated only on
  // read. Transition detection requires every source snapshot to be
  // observed, so a small `effect()` keeps the linkedSignal warm by reading
  // it on every reactive change. This is intentional and is the only
  // remaining side effect (a ZERO-write effect — single read, no writes,
  // so it cannot loop).
  const submittedHistory = linkedSignal<
    { submitting: boolean; touched: boolean; pending: boolean },
    boolean
  >({
    source: () => {
      const state = resolve()();
      return {
        submitting: state.submitting(),
        touched: state.touched(),
        pending: state.pending() ?? false,
      };
    },
    computation: (curr, prev) => {
      const previousValue = prev?.value ?? false;

      // Reset on touched: true → false (form.reset()) when not currently
      // submitting. Mirrors the original effect's reset condition.
      if (
        prev !== undefined &&
        prev.source.touched &&
        !curr.touched &&
        !curr.submitting
      ) {
        return false;
      }

      // Transition: submitting true → false marks a completed submission.
      if (prev !== undefined && prev.source.submitting && !curr.submitting) {
        return true;
      }

      return previousValue;
    },
  });

  // Keep the linkedSignal warm so transient transitions are not lost
  // between consumer reads. Single-statement effect, single read — does
  // NOT write to any signal, so it cannot loop.
  effect(() => {
    submittedHistory();
  });

  // Side effect (single, isolated): clear the external submit-attempt
  // signal when the form is reset. Detect the reset by tracking the
  // touched: true → false transition (same trigger the linkedSignal uses
  // to roll `submittedHistory` back to false). Kept out of the
  // linkedSignal computation because computations must be pure.
  //
  // This is a single-write effect — the only signal it writes is the
  // external `submitAttempted`, which is owned by the caller.
  if (submitAttempted !== undefined) {
    let prevTouched = false;
    effect(() => {
      const state = resolve()();
      const nowTouched = state.touched();
      const nowSubmitting = state.submitting();
      const wasTouched = prevTouched;
      prevTouched = nowTouched;

      // Reset transition only — never on initial steady-state reads.
      if (wasTouched && !nowTouched && !nowSubmitting) {
        if (submitAttempted()) {
          submitAttempted.set(false);
        }
      }
    });
  }

  return computed(() => {
    const state = resolve()();
    if (state.submitting()) return 'submitting';
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
 * @example Show success message
 * ```typescript
 * import { hasSubmitted } from '@ngx-signal-forms/toolkit';
 *
 * @Component({
 *   template: `
 *     @if (hasSubmitted() && userForm().valid()) {
 *       <div class="success">Form saved successfully!</div>
 *     }
 *   `
 * })
 * export class MyFormComponent {
 *   protected readonly hasSubmitted = hasSubmitted(this.userForm);
 * }
 * ```
 *
 * @example Change error strategy after first submit
 * ```typescript
 * @Component({
 *   template: `
 *     <ngx-form-field-error
 *       [formField]="form.email"
 *       fieldName="email"
 *       [strategy]="hasSubmitted() ? 'immediate' : 'on-touch'"
 *     />
 *   `
 * })
 * ```
 *
 * @remarks
 * **Injection context required**: This function uses `effect()` internally and must
 * be called within an injection context (e.g., property initializer or constructor).
 *
 * **Note:** Angular Signal Forms does **not** expose a `submittedStatus()` signal.
 * The toolkit derives the status by tracking transitions of the native
 * `submitting()` signal.
 *
 * **Reset behavior**: When `form.reset()` is called, this returns to `false`.
 * This is detected by watching for `touched()` becoming `false`.
 *
 * **When to use:**
 * - Success/confirmation messages
 * - Changing validation strategy after submit
 * - Conditional rendering based on submission history
 * - Analytics tracking
 *
 * @public
 */
export function hasSubmitted(formTree: FieldTree<unknown>): Signal<boolean> {
  const submittedStatus = createSubmittedStatusTracker(formTree);

  return computed(() => {
    return submittedStatus() === 'submitted';
  });
}

/**
 * Checks whether a form has only warnings (no blocking errors).
 *
 * **Signal Forms limitation:** Angular Signal Forms treats ALL ValidationErrors
 * as blockers - it doesn't distinguish warnings from errors. The `submit()` helper
 * only executes the callback if `form().valid()` is true.
 *
 * This utility provides WCAG-compliant warning support by checking if all
 * errors are warnings (kind starts with 'warn:').
 *
 * @param errors Array of ValidationError from the form
 * @returns `true` if all errors are warnings (non-blocking), `false` if any blocking errors exist
 *
 * @example
 * ```typescript
 * const formErrors = userForm().errors();
 * if (hasOnlyWarnings(formErrors)) {
 *   // Safe to submit - only warnings present
 * }
 * ```
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
 * Filters out warning errors (kind starting with 'warn:') and returns
 * only blocking errors that should prevent form submission.
 *
 * @param errors Array of ValidationError from the form
 * @returns Array of blocking errors only
 *
 * @example
 * ```typescript
 * const blockingErrors = getBlockingErrors(userForm().errors());
 * if (blockingErrors.length === 0) {
 *   // Can submit - no blocking errors
 * }
 * ```
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
 * Unlike checking `form().valid()` which requires no errors at all,
 * this allows submission when only warning errors exist.
 *
 * **WCAG Compliance:**
 * Per WCAG 2.2, warnings are guidance that should NOT block form submission.
 * This function enables that pattern with Signal Forms.
 *
 * Returns `true` when:
 * - Form has no blocking errors (warnings are allowed)
 * - Form is not currently submitting
 * - Form is not pending (async validation complete)
 *
 * @param formTree The form tree to check submission readiness for
 * @returns Signal that emits `true` when form can be submitted (warnings allowed)
 *
 * @example With warnings allowed
 * ```typescript
 * import { canSubmitWithWarnings } from '@ngx-signal-forms/toolkit';
 *
 * @Component({
 *   template: `
 *     <button type="submit" [disabled]="!canSubmitWithWarnings()">
 *       Submit
 *     </button>
 *     <!-- Warnings display but don't block submit -->
 *   `
 * })
 * export class MyFormComponent {
 *   protected readonly canSubmitWithWarnings = canSubmitWithWarnings(this.userForm);
 * }
 * ```
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

    const errors = formState.errors();
    const blockingErrors = getBlockingErrors(errors);
    return blockingErrors.length === 0;
  });
}

/**
 * Submits a form, allowing warnings to pass through.
 *
 * **Difference from Angular's `submit()`:**
 * - `submit()`: Blocks if form has ANY ValidationErrors (warnings included)
 * - `submitWithWarnings()`: Only blocks on BLOCKING errors (allows warnings)
 *
 * **WCAG Compliance:**
 * Per WCAG 2.2 SC 3.3.1 and 3.3.3, warnings should provide guidance without
 * blocking user actions. This function enables that pattern.
 *
 * **Behavior:**
 * 1. Marks all fields as touched via `submit()` (shows all errors/warnings)
 * 2. Checks for BLOCKING errors only (ignores warnings)
 * 3. If no blocking errors, executes the action callback
 * 4. Manages submitting state during async operation
 *
 * **Implementation Note:**
 * Angular's public `submit()` helper still gates submission on `invalid()` and does
 * not expose a warning-aware validity predicate. This helper therefore mirrors the
 * relevant parts of Angular's submission flow in user land: it marks fields as
 * touched, waits one microtask for the current input/blur cycle to settle, and then
 * filters the resulting validation summary down to blocking errors only.
 *
 * @param formTree The form tree to submit
 * @param action Async action to execute if no blocking errors
 * @returns Promise that resolves when submission completes
 *
 * @example
 * ```typescript
 * import { submitWithWarnings } from '@ngx-signal-forms/toolkit';
 *
 * protected async handleSubmit(event: Event): Promise<void> {
 *   event.preventDefault();
 *
 *   await submitWithWarnings(this.userForm, async () => {
 *     /// This runs even if warnings exist, but not if blocking errors exist
 *     await this.api.save(this.userForm().value());
 *   });
 * }
 * ```
 *
 * @see canSubmitWithWarnings - Computed signal for button disabled state
 * @see warningError - Helper to create warning ValidationErrors
 * @see isWarningError - Type guard for warning checks
 *
 * @public
 */
export async function submitWithWarnings<TModel>(
  formTree: FieldTree<TModel>,
  action: () => Promise<void>,
): Promise<void> {
  const formState = formTree();

  // Mark all fields as touched to show all validation feedback
  // We need to traverse all fields since FieldState doesn't have markAllAsTouched()
  markAllFieldsAsTouched(formTree);

  // Allow the current input/blur cycle to settle before reading errorSummary().
  // Without this, a submit fired while the last control still has focus can read
  // stale blocking errors from the pre-blur state.
  await waitForValidationSettlement();

  // Check for blocking errors only (allow warnings)
  const allErrors = formState.errorSummary();
  const blockingErrors = getBlockingErrors(allErrors);

  if (blockingErrors.length > 0) {
    // Has blocking errors - don't submit
    return;
  }

  // No blocking errors - execute the action
  await action();
}

/**
 * Recursively marks all fields in a form tree as touched.
 *
 * Angular Signal Forms doesn't expose `markAllAsTouched()` on FieldState,
 * so we traverse the form tree and call `markAsTouched()` on each field.
 *
 * @internal
 */
function markAllFieldsAsTouched(field: FieldTree<unknown>): void {
  const state = field();
  state.markAsTouched();

  for (const key of Object.keys(field)) {
    if (key === 'length' || typeof key === 'symbol') continue;

    const child = Reflect.get(field, key);
    if (typeof child !== 'function') continue;

    // Invoking the child callable is the only way to detect whether it is a
    // FieldTree — a throw here means either a genuine FieldTree whose
    // evaluation is broken, or a non-field callable we should skip. We cannot
    // safely distinguish the two, so we surface the throw to the caller: if
    // submitWithWarnings silently skipped a broken subtree, the form would
    // submit with unvalidated data.
    if (isFieldTree(child)) {
      markAllFieldsAsTouched(child);
    }
  }
}

function waitForValidationSettlement(): Promise<void> {
  return new Promise((resolve) => {
    queueMicrotask(resolve);
  });
}

/**
 * Type guard to check if a value is a FieldTree.
 * A FieldTree is a function that returns a FieldState with specific methods.
 *
 * Throws if invoking `value()` throws. Callers that already know `value` is
 * callable must decide how to handle that: {@link markAllFieldsAsTouched}
 * surfaces the throw so `submitWithWarnings` cannot silently ship a form with
 * an untouched, unvalidated subtree. {@link createSubmittedStatusTracker}
 * invokes the guard only on values it controls, so a throw there indicates a
 * wiring bug that should be surfaced.
 *
 * @internal
 */
function isFieldTree(value: unknown): value is FieldTree<unknown> {
  if (!isCallable(value)) return false;
  return hasCallableProperty(value(), 'markAsTouched');
}

function isCallable(value: unknown): value is () => unknown {
  return typeof value === 'function';
}

function hasCallableProperty<TProperty extends string>(
  value: unknown,
  property: TProperty,
): value is Record<TProperty, () => unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    isCallable(Reflect.get(value, property))
  );
}
