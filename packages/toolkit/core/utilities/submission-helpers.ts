import {
  assertInInjectionContext,
  computed,
  effect,
  signal,
  type Signal,
} from '@angular/core';
import type {
  FieldTree,
  SubmittedStatus,
  ValidationError,
} from '@angular/forms/signals';
import { isBlockingError } from './warning-error';

/**
 * Computed signal indicating whether a form can be submitted.
 *
 * Returns `true` when:
 * - Form is valid (all validation rules pass)
 * - Form is not currently submitting
 *
 * Use this to control submit button state and prevent duplicate submissions.
 *
 * @param formTree The form tree to check submission readiness for
 * @returns Signal that emits `true` when form can be submitted
 *
 * @example Disable submit button
 * ```typescript
 * import { canSubmit } from '@ngx-signal-forms/toolkit';
 *
 * @Component({
 *   template: `
 *     <button
 *       type="submit"
 *       [disabled]="!canSubmit()">
 *       Submit
 *     </button>
 *   `
 * })
 * export class MyFormComponent {
 *   protected readonly canSubmit = canSubmit(this.userForm);
 * }
 * ```
 *
 * @example Show loading state
 * ```typescript
 * @Component({
 *   template: `
 *     <button type="submit" [disabled]="!canSubmit()">
 *       @if (isSubmitting()) {
 *         <span>Saving...</span>
 *       } @else {
 *         <span>Submit</span>
 *       }
 *     </button>
 *   `
 * })
 * export class MyFormComponent {
 *   protected readonly canSubmit = canSubmit(this.userForm);
 *   protected readonly isSubmitting = isSubmitting(this.userForm);
 * }
 * ```
 *
 * @remarks
 * This is a convenience wrapper around:
 * ```typescript
 * computed(() => form().valid() && !form().submitting())
 * ```
 *
 * **Benefits:**
 * - Consistent naming across applications
 * - Less template boilerplate
 * - Self-documenting code
 * - Type-safe computed signal
 *
 * @public
 */
export function canSubmit(formTree: FieldTree<unknown>): Signal<boolean> {
  return computed(() => {
    const formState = formTree();
    return formState.valid() && !formState.submitting();
  });
}

/**
 * Computed signal indicating whether a form is currently submitting.
 *
 * Returns `true` when:
 * - Form submission is in progress (via `submit()` helper)
 * - `submitting()` signal from Angular Signal Forms is `true`
 *
 * Use this to show loading indicators and prevent user actions during submission.
 *
 * @param formTree The form tree to check submission status for
 * @returns Signal that emits `true` when form is submitting
 *
 * @example Show loading spinner
 * ```typescript
 * import { isSubmitting } from '@ngx-signal-forms/toolkit';
 *
 * @Component({
 *   template: `
 *     @if (isSubmitting()) {
 *       <div class="spinner">Loading...</div>
 *     }
 *   `
 * })
 * export class MyFormComponent {
 *   protected readonly isSubmitting = isSubmitting(this.userForm);
 * }
 * ```
 *
 * @example Disable form during submission
 * ```typescript
 * @Component({
 *   template: `
 *     <fieldset [disabled]="isSubmitting()">
 *       <!-- All inputs disabled during submission -->
 *     </fieldset>
 *   `
 * })
 * ```
 *
 * @remarks
 * This is a convenience wrapper around:
 * ```typescript
 * computed(() => form().submitting())
 * ```
 *
 * **When to use:**
 * - Showing loading indicators
 * - Disabling form controls during submission
 * - Preventing duplicate submissions
 * - Conditional rendering based on submission state
 *
 * @public
 */
export function isSubmitting(formTree: FieldTree<unknown>): Signal<boolean> {
  return computed(() => {
    const formState = formTree();
    return formState.submitting();
  });
}

function createSubmittedStatusTracker(
  formTree: FieldTree<unknown>,
): Signal<SubmittedStatus> {
  assertInInjectionContext(createSubmittedStatusTracker);

  const hasSubmitted = signal(false);
  const wasSubmitting = signal(false);
  const wasTouched = signal(false);

  effect(() => {
    const formState = formTree();
    if (!formState) {
      wasSubmitting.set(false);
      wasTouched.set(false);
      return;
    }

    const isSubmitting = formState.submitting();
    const isTouched = formState.touched();
    const prevSubmitting = wasSubmitting();
    const prevTouched = wasTouched();

    // Detect submit completion: submitting went from true to false
    if (prevSubmitting && !isSubmitting) {
      hasSubmitted.set(true);
    }

    // Detect reset: touched went from true to false (form.reset() clears touched)
    // Only reset if not currently submitting to avoid false positives
    if (prevTouched && !isTouched && !isSubmitting) {
      hasSubmitted.set(false);
    }

    wasSubmitting.set(isSubmitting);
    wasTouched.set(isTouched);
  });

  return computed(() => {
    const formState = formTree();
    if (!formState) {
      return 'unsubmitted';
    }

    if (formState.submitting()) {
      return 'submitting';
    }

    return hasSubmitted() ? 'submitted' : 'unsubmitted';
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
 * Unlike `canSubmit()` which requires `form().valid()` (no errors at all),
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
  } catch {
    return false;
  }
}
