import { computed, type Signal } from '@angular/core';
import type { FieldState, SubmittedStatus } from '@angular/forms/signals';
import type { ErrorDisplayStrategy, ReactiveOrStatic } from '../types';
import { computeShowErrors as baseComputeShowErrors } from './error-strategies';

/**
 * Convenience wrapper for {@link computeShowErrors} with cleaner import path.
 *
 * ## What does it do?
 * Creates a reactive computed signal that determines if a form field's errors should
 * be shown to the user based on the error display strategy and form submission status.
 *
 * ## When to use it?
 * Use `showErrors()` when you need to:
 * - Implement error visibility logic for form fields
 * - Integrate with Angular Signal Forms' built-in `submittedStatus`
 * - Control when validation errors appear based on user interaction
 *
 * ## How does it work?
 * 1. Accepts field state, error display strategy, and submission status
 * 2. Evaluates whether errors should be shown based on the strategy:
 *    - `'immediate'`: Errors shown as soon as field is invalid
 *    - `'on-touch'`: Errors shown after blur or submit (WCAG recommended)
 *    - `'on-submit'`: Errors shown only after form submission
 *    - `'manual'`: Developer controls visibility (always returns `true`)
 * 3. Returns a computed signal that updates when field state or submission status changes
 *
 * @template T The type of the field value
 * @param field - The form field state (FieldTree from Angular Signal Forms)
 * @param strategy - The error display strategy
 * @param submittedStatus - Angular's built-in submission status signal
 * @returns A computed signal returning `true` when errors should be displayed
 *
 * @example With Angular's submit() helper
 * ```typescript
 * import { submit } from '@angular/forms/signals';
 * import { showErrors } from '@ngx-signal-forms/toolkit/utilities';
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
 *   protected readonly shouldShowErrors = showErrors(
 *     this.form.email,
 *     'on-touch',
 *     computed(() => this.form().submittedStatus())
 *   );
 * }
 * ```
 *
 * @example With form provider context (recommended)
 * ```typescript
 * import { inject } from '@angular/core';
 * import { NGX_SIGNAL_FORM_CONTEXT } from '@ngx-signal-forms/toolkit/core';
 *
 * @Component({
 *   template: `
 *     <form [ngxSignalForm]="form">
 *       @if (shouldShowErrors()) {
 *         <span>{{ form.email().errors()[0].message }}</span>
 *       }
 *     </form>
 *   `
 * })
 * class MyComponent {
 *   readonly #context = inject(NGX_SIGNAL_FORM_CONTEXT);
 *   readonly #model = signal({ email: '' });
 *   protected readonly form = form(this.#model, emailSchema);
 *
 *   protected readonly shouldShowErrors = showErrors(
 *     this.form.email,
 *     'on-touch',
 *     this.#context.submittedStatus  // Auto-injected from provider
 *   );
 * }
 * ```
 *
 * @example Static strategy
 * ```typescript
 * const shouldShowErrors = showErrors(
 *   form.password,
 *   'immediate',  // Show errors immediately
 *   computed(() => form().submittedStatus())
 * );
 * ```
 *
 * @see {@link computeShowErrors} For full documentation and additional examples
 * @see {@link createShowErrorsSignal} For options-based API
 * @see {@link combineShowErrors} For combining multiple error signals
 */
export function showErrors<T>(
  field: ReactiveOrStatic<FieldState<T>>,
  strategy: ReactiveOrStatic<ErrorDisplayStrategy>,
  submittedStatus: ReactiveOrStatic<SubmittedStatus>,
): Signal<boolean> {
  return baseComputeShowErrors(field, strategy, submittedStatus);
}

/**
 * Creates a computed signal for error visibility using an options-based API.
 *
 * ## What does it do?
 * Provides an alternative, options-based API for creating error visibility signals.
 * Uses sensible defaults (on-touch strategy) while allowing customization through
 * a configuration object.
 *
 * ## When to use it?
 * Use `createShowErrorsSignal()` when you:
 * - Prefer options-object API over positional parameters
 * - Want default 'on-touch' strategy without explicitly passing it
 * - Need to pass many configuration options clearly
 * - Are building reusable utilities that accept configuration
 *
 * **Use {@link showErrors} if you prefer positional parameters.**
 *
 * ## How does it work?
 * 1. Accepts field and an options object with optional strategy
 * 2. Defaults to 'on-touch' strategy if not specified
 * 3. Delegates to {@link computeShowErrors} with unwrapped options
 *
 * @template T The type of the field value
 * @param field - The form field state
 * @param options - Configuration options
 * @param options.strategy - Error display strategy (defaults to 'on-touch')
 * @param options.submittedStatus - Angular's built-in submission status
 * @returns A computed signal returning `true` when errors should be displayed
 *
 * @example With default strategy (on-touch)
 * ```typescript
 * const showEmailErrors = createShowErrorsSignal(form.email, {
 *   submittedStatus: computed(() => form().submittedStatus())
 * });
 * ```
 *
 * @example With custom strategy
 * ```typescript
 * const showPasswordErrors = createShowErrorsSignal(form.password, {
 *   strategy: 'immediate',
 *   submittedStatus: computed(() => form().submittedStatus())
 * });
 * ```
 *
 * @example With form provider context
 * ```typescript
 * const context = inject(NGX_SIGNAL_FORM_CONTEXT);
 *
 * const showErrors = createShowErrorsSignal(form.username, {
 *   strategy: 'on-touch',
 *   submittedStatus: context.submittedStatus
 * });
 * ```
 *
 * @see {@link showErrors} For positional parameter API
 * @see {@link computeShowErrors} For full implementation details
 * @see {@link combineShowErrors} For combining multiple error signals
 */
export function createShowErrorsSignal<T extends FieldState<unknown>>(
  field: ReactiveOrStatic<T>,
  options: {
    strategy?: ReactiveOrStatic<ErrorDisplayStrategy>;
    submittedStatus: ReactiveOrStatic<SubmittedStatus>;
  },
): Signal<boolean> {
  const strategy = options.strategy ?? 'on-touch';
  return baseComputeShowErrors(field, strategy, options.submittedStatus);
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
 * @see {@link computeShowErrors} For the underlying implementation
 */
export function combineShowErrors(
  showErrorsSignals: Signal<boolean>[],
): Signal<boolean> {
  return computed(() => showErrorsSignals.some((signal) => signal()));
}
