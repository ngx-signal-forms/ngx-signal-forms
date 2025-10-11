import { computed, type Signal } from '@angular/core';
import type { FieldState } from '@angular/forms/signals';
import type { ErrorDisplayStrategy, ReactiveOrStatic } from '../types';
import { computeShowErrors as baseComputeShowErrors } from './error-strategies';

/**
 * Convenience wrapper for {@link computeShowErrors} with cleaner import path.
 *
 * ## What does it do?
 * Creates a reactive computed signal that determines if a form field's errors should
 * be shown to the user. This is an alias for `computeShowErrors` with a shorter name
 * and cleaner import path for common use cases.
 *
 * ## When to use it?
 * Use `showErrors()` when you need to:
 * - Quickly implement error visibility logic without importing from error-strategies
 * - Prefer shorter function names in your code
 * - Match naming conventions in your codebase
 *
 * **This is functionally identical to {@link computeShowErrors}** - use whichever
 * name you prefer or matches your team's conventions.
 *
 * ## How does it work?
 * Directly delegates to {@link computeShowErrors} - see that function for full
 * implementation details, examples, and behavior documentation.
 *
 * @template T The type of the field value
 * @param field - The form field state (typically a FieldTree from Angular Signal Forms)
 * @param strategy - The error display strategy (immediate, on-touch, on-submit, manual)
 * @param hasSubmitted - Whether the form has been submitted
 * @returns A computed signal returning `true` when errors should be displayed
 *
 * @example Basic usage
 * ```typescript
 * import { showErrors } from '@ngx-signal-forms/toolkit/utilities';
 *
 * const shouldShowErrors = showErrors(
 *   form.email,
 *   signal('on-touch'),
 *   formSubmitted
 * );
 *
 * /// Use in template
 * @if (shouldShowErrors()) {
 *   <span>{{ form.email().errors()[0].message }}</span>
 * }
 * ```
 *
 * @example Static strategy
 * ```typescript
 * const shouldShowErrors = showErrors(
 *   form.password,
 *   'immediate',  // Static strategy
 *   false         // Not submitted yet
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
  hasSubmitted: ReactiveOrStatic<boolean>,
): Signal<boolean> {
  return baseComputeShowErrors(field, strategy, hasSubmitted);
  // End of showErrors function
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
 * @param options.hasSubmitted - Whether the form has been submitted
 * @returns A computed signal returning `true` when errors should be displayed
 *
 * @example With default strategy (on-touch)
 * ```typescript
 * const showEmailErrors = createShowErrorsSignal(form.email, {
 *   hasSubmitted: formSubmitted
 * });
 * ```
 *
 * @example With custom strategy
 * ```typescript
 * const showPasswordErrors = createShowErrorsSignal(form.password, {
 *   strategy: 'immediate',
 *   hasSubmitted: formSubmitted
 * });
 * ```
 *
 * @example With reactive strategy
 * ```typescript
 * const dynamicStrategy = computed(() =>
 *   isLoginForm() ? 'immediate' : 'on-touch'
 * );
 *
 * const showErrors = createShowErrorsSignal(form.username, {
 *   strategy: dynamicStrategy,
 *   hasSubmitted: submitted
 * });
 * ```
 *
 * @example Building a reusable utility
 * ```typescript
 * function createFormFieldErrors<T>(
 *   field: FieldTree<T>,
 *   config: { strict?: boolean; submitted: Signal<boolean> }
 * ) {
 *   return createShowErrorsSignal(field, {
 *     strategy: config.strict ? 'immediate' : 'on-touch',
 *     hasSubmitted: config.submitted
 *   });
 * }
 * ```
 *
 * @see {@link showErrors} For positional parameter API
 * @see {@link computeShowErrors} For full implementation details
 * @see {@link combineShowErrors} For combining multiple error signals
 */
export function createShowErrorsSignal<T>(
  field: ReactiveOrStatic<T>,
  options: {
    strategy?: ReactiveOrStatic<ErrorDisplayStrategy>;
    hasSubmitted: ReactiveOrStatic<boolean>;
  },
): Signal<boolean> {
  const strategy = options.strategy ?? 'on-touch';
  return baseComputeShowErrors(field, strategy, options.hasSubmitted);
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
