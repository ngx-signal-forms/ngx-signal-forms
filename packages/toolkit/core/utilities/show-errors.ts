import { computed, type Signal } from '@angular/core';
import type {
  ErrorDisplayStrategy,
  ReactiveOrStatic,
  SubmittedStatus,
} from '../types';
import { shouldShowErrors } from './error-strategies';
import type {
  ErrorVisibilityState,
  PartialErrorVisibilityState,
} from './field-state-types';
import { unwrapValue } from './unwrap-signal-or-value';

/**
 * Creates a reactive computed signal that determines if a form field's errors should
 * be shown to the user based on the error display strategy.
 *
 * This is the **single source of truth** for error-visibility timing across the
 * toolkit. `createErrorState()`, `NgxHeadlessErrorStateDirective`,
 * `NgxHeadlessErrorSummaryDirective`, and the wrapper component all route
 * through `shouldShowErrors()` (or this computed wrapper) so visibility timing
 * cannot drift between the factory and directive surfaces. If you find
 * yourself writing a parallel visibility predicate, use this instead.
 *
 * ## Simplified Architecture (aligned with Angular Signal Forms)
 *
 * Angular's `submit()` helper calls `markAllAsTouched()`, which means `field.touched()`
 * becomes true for all fields after submission. This makes `submittedStatus` **optional**
 * for the default `'on-touch'` strategy - we just check `field.touched()`.
 *
 * ## When to use it?
 * Use `showErrors()` when you need to:
 * - Implement error visibility logic for form fields
 * - Control when validation errors appear based on user interaction
 *
 * ## How does it work?
 * 1. Accepts field state, error display strategy, and optional submission status
 * 2. Evaluates whether errors should be shown based on the strategy:
 *    - `'immediate'`: Errors shown as soon as field is invalid
 *    - `'on-touch'`: Errors shown after blur or submit (WCAG recommended) - **default**
 *    - `'on-submit'`: Errors shown only after form submission
 * 3. Returns a computed signal that updates when field state changes
 *
 * @param field - The form field state (FieldTree from Angular Signal Forms)
 * @param strategy - The error display strategy (defaults to 'on-touch')
 * @param submittedStatus - Optional: Only needed for 'on-submit' strategy
 * @returns A computed signal returning `true` when errors should be displayed
 *
 * @example Simple usage (recommended - no submittedStatus needed)
 * ```typescript
 * import { showErrors } from '@ngx-signal-forms/toolkit';
 *
 * @Component({
 *   template: `
 *     @if (shouldShowErrors()) {
 *       <span>{{ form.email().errors()[0].message }}</span>
 *     }
 *   `
 * })
 * class MyComponent {
 *   readonly #model = signal({ email: '' });
 *   protected readonly form = form(this.#model, emailSchema);
 *
 *   // Simple! Angular's submit() marks fields touched, so this just works.
 *   protected readonly shouldShowErrors = showErrors(
 *     this.form.email,
 *     'on-touch'
 *   );
 * }
 * ```
 *
 * @example With on-submit strategy (needs submittedStatus)
 * ```typescript
 * protected readonly shouldShowErrors = showErrors(
 *   this.form.email,
 *   'on-submit',
 *   computed<SubmittedStatus>(() => {
 *     const state = this.form();
 *     if (state.submitting()) return 'submitting';
 *     return state.touched() ? 'submitted' : 'unsubmitted';
 *   })
 * );
 * ```
 *
 * @see {@link combineShowErrors} For combining multiple error signals
 */
export function showErrors(
  field: ReactiveOrStatic<ErrorVisibilityState | PartialErrorVisibilityState>,
  strategy: ReactiveOrStatic<ErrorDisplayStrategy>,
  submittedStatus?: ReactiveOrStatic<SubmittedStatus | undefined>,
): Signal<boolean> {
  return computeShowErrorsInternal(field, strategy, submittedStatus);
}

/**
 * Combines multiple error visibility signals into a single signal.
 *
 * ## What does it do?
 * Creates a computed signal that returns `true` if ANY of the provided error
 * visibility signals are `true`. This is useful for showing aggregate error
 * states, form-level validation, or section-level error indicators.
 *
 * ## When to use it?
 * Use `combineShowErrors()` when you need to:
 * - Show form-level error indicator if any field has errors
 * - Disable submit button when any field should show errors
 * - Display section-level validation status (e.g., "Address has errors")
 * - Implement custom error aggregation logic
 *
 * ## How does it work?
 * 1. Accepts an array of error visibility signals
 * 2. Creates a computed signal that checks all inputs
 * 3. Returns `true` if ANY signal is `true` (logical OR operation)
 * 4. Updates automatically when any input signal changes
 *
 * @param showErrorsSignals - Array of error visibility signals to combine
 * @returns A computed signal that is `true` if any input signal is `true`
 *
 * @example Form-level error indicator
 * ```typescript
 * const showAnyFormErrors = combineShowErrors([
 *   showErrors(form.email, 'on-touch', submitted),
 *   showErrors(form.password, 'on-touch', submitted),
 *   showErrors(form.confirmPassword, 'on-touch', submitted)
 * ]);
 *
 * /// Use in template
 * @if (showAnyFormErrors()) {
 *   <div class="form-error-banner">
 *     Please fix the errors below before submitting
 *   </div>
 * }
 * ```
 *
 * @example Disable submit button
 * ```typescript
 * const hasVisibleErrors = combineShowErrors([
 *   showErrors(form.username, strategy, submitted),
 *   showErrors(form.email, strategy, submitted)
 * ]);
 *
 * /// In template
 * <button [disabled]="hasVisibleErrors()">Submit</button>
 * ```
 *
 * @example Section-level validation
 * ```typescript
 * const showAddressErrors = combineShowErrors([
 *   showErrors(form.street, strategy, submitted),
 *   showErrors(form.city, strategy, submitted),
 *   showErrors(form.zipCode, strategy, submitted)
 * ]);
 *
 * const showPaymentErrors = combineShowErrors([
 *   showErrors(form.cardNumber, strategy, submitted),
 *   showErrors(form.cvv, strategy, submitted)
 * ]);
 * ```
 *
 * @example Custom error count
 * ```typescript
 * const errorSignals = [
 *   showErrors(form.field1, 'on-touch', submitted),
 *   showErrors(form.field2, 'on-touch', submitted),
 *   showErrors(form.field3, 'on-touch', submitted)
 * ];
 *
 * const hasErrors = combineShowErrors(errorSignals);
 * const errorCount = computed(() =>
 *   errorSignals.filter(signal => signal()).length
 * );
 * ```
 *
 * @see {@link showErrors} For creating individual error visibility signals
 */
export function combineShowErrors(
  showErrorsSignals: readonly Signal<boolean>[],
): Signal<boolean> {
  return computed(() => showErrorsSignals.some((signal) => signal()));
}

function computeShowErrorsInternal(
  field: ReactiveOrStatic<ErrorVisibilityState | PartialErrorVisibilityState>,
  strategy: ReactiveOrStatic<ErrorDisplayStrategy>,
  submittedStatus?: ReactiveOrStatic<SubmittedStatus | undefined>,
): Signal<boolean> {
  return computed(() => {
    const fieldState = unwrapValue(field);
    const strategyValue = unwrapValue(strategy);

    const isInvalid =
      fieldState &&
      typeof fieldState === 'object' &&
      typeof fieldState.invalid === 'function'
        ? fieldState.invalid()
        : false;
    const isTouched =
      fieldState &&
      typeof fieldState === 'object' &&
      typeof fieldState.touched === 'function'
        ? fieldState.touched()
        : false;

    const status = submittedStatus ? unwrapValue(submittedStatus) : undefined;
    const fallbackStatus = status ?? (isTouched ? 'submitted' : 'unsubmitted');

    return shouldShowErrors(
      isInvalid,
      isTouched,
      strategyValue,
      fallbackStatus,
    );
  });
}
