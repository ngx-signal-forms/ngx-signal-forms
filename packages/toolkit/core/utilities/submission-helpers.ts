import {
  assertInInjectionContext,
  computed,
  effect,
  signal,
  type Signal,
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
 * Resets to `'unsubmitted'` when `touched()` transitions from `true` to `false`
 * (i.e. after `form.reset()`).
 *
 * @param formTree A `FieldTree` or `Signal<FieldTree>` (supports deferred resolution via `input.required()`)
 * @returns Signal with the current `SubmittedStatus`
 *
 * @remarks
 * Must be called in an injection context (uses `effect()` internally).
 *
 * @public
 */
export function createSubmittedStatusTracker(
  formTree: FieldTree<unknown> | Signal<FieldTree<unknown>>,
): Signal<SubmittedStatus> {
  assertInInjectionContext(createSubmittedStatusTracker);

  const resolve = (): FieldTree<unknown> => {
    if (typeof formTree === 'function') {
      const result = (formTree as () => unknown)();
      // Signal<FieldTree>: calling the signal returns the FieldTree (a function)
      if (typeof result === 'function') {
        return result as FieldTree<unknown>;
      }
      // Plain FieldTree: calling it returned a FieldState (an object)
      if (result && typeof result === 'object') {
        return formTree as FieldTree<unknown>;
      }
    }
    throw new Error(
      'createSubmittedStatusTracker requires a FieldTree or Signal<FieldTree>.',
    );
  };

  const submitted = signal(false);
  const prevSubmitting = signal(false);
  const prevTouched = signal(false);

  effect(() => {
    const state = resolve()();
    const nowSubmitting = state.submitting();
    const nowTouched = state.touched();

    if (prevSubmitting() && !nowSubmitting) {
      submitted.set(true);
    }
    if (prevTouched() && !nowTouched && !nowSubmitting) {
      submitted.set(false);
    }

    prevSubmitting.set(nowSubmitting);
    prevTouched.set(nowTouched);
  });

  return computed(() => {
    const state = resolve()();
    if (state.submitting()) return 'submitting';
    return submitted() ? 'submitted' : 'unsubmitted';
  });
}

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
 *     <ngx-signal-form-error
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
export function hasOnlyWarnings(errors: ValidationError[]): boolean {
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
  errors: ValidationError[],
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
 * This uses Angular's `submit()` helper internally, which calls `markAllAsTouched()`
 * and manages the `submitting()` state. However, we intercept before the callback
 * to check for blocking errors instead of `form().invalid()`.
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

  // Check if this field has children (object or array)
  // Signal Forms fields have dynamic properties for child fields
  for (const key of Object.keys(field)) {
    if (key === 'length' || typeof key === 'symbol') continue;

    const child = (field as Record<string, unknown>)[key];
    if (typeof child === 'function' && isFieldTree(child)) {
      markAllFieldsAsTouched(child as FieldTree<unknown>);
    }
  }
}

/**
 * Type guard to check if a value is a FieldTree.
 * A FieldTree is a function that returns a FieldState with specific methods.
 *
 * @internal
 */
function isFieldTree(value: unknown): boolean {
  if (typeof value !== 'function') return false;

  try {
    const result = (value as () => unknown)();
    return (
      result !== null &&
      typeof result === 'object' &&
      'markAsTouched' in result &&
      typeof (result as Record<string, unknown>)['markAsTouched'] === 'function'
    );
  } catch (error) {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      console.warn(
        '[ngx-signal-forms] FieldTree detection failed unexpectedly.',
        error,
      );
    }
    return false;
  }
}
