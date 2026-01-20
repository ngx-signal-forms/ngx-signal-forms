import {
  assertInInjectionContext,
  computed,
  effect,
  signal,
  type Signal,
} from '@angular/core';
import type { FieldTree, SubmittedStatus } from '@angular/forms/signals';

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
 * import { canSubmit } from '@ngx-signal-forms/toolkit/core';
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
 * import { isSubmitting } from '@ngx-signal-forms/toolkit/core';
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
 * import { hasSubmitted } from '@ngx-signal-forms/toolkit/core';
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
