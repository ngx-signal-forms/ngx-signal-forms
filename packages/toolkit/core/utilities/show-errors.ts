import type { Signal } from '@angular/core';
import { computed } from '@angular/core';
import type { SignalLike } from '@angular/aria/ui-patterns';
import type { ErrorDisplayStrategy } from '../types';
import { computeShowErrors as baseComputeShowErrors } from './error-strategies';

/**
 * Re-export the computeShowErrors function from error-strategies.
 * This provides a cleaner import path for consumers.
 *
 * Uses SignalLike<T> from @angular/aria for flexible inputs.
 *
 * @param field - SignalLike containing the field state from Signal Forms
 * @param strategy - Error display strategy (SignalLike or static value)
 * @param hasSubmitted - SignalLike indicating if the form has been submitted
 * @returns Signal<boolean> indicating if errors should be displayed
 *
 * @example
 * ```typescript
 * import { showErrors } from '@ngx-signal-forms/toolkit/utilities';
 *
 * const shouldShowErrors = showErrors(
 *   form.email,
 *   signal('on-touch'),
 *   formSubmitted
 * );
 * ```
 */
export const showErrors = baseComputeShowErrors;

/**
 * Creates a computed signal that determines if errors should be shown for a field.
 * This is a convenience wrapper that handles common use cases.
 *
 * @param field - SignalLike containing the field state
 * @param options - Configuration options
 * @returns Signal<boolean> indicating if errors should be displayed
 *
 * @example
 * ```typescript
 * // With default 'on-touch' strategy
 * const showEmailErrors = createShowErrorsSignal(form.email, {
 *   hasSubmitted: formSubmitted
 * });
 *
 * // With custom strategy
 * const showPasswordErrors = createShowErrorsSignal(form.password, {
 *   strategy: 'immediate',
 *   hasSubmitted: formSubmitted
 * });
 * ```
 */
export function createShowErrorsSignal<T>(
  field: SignalLike<T>,
  options: {
    strategy?: SignalLike<ErrorDisplayStrategy> | ErrorDisplayStrategy;
    hasSubmitted: SignalLike<boolean>;
  },
): Signal<boolean> {
  const strategy = options.strategy ?? 'on-touch';
  return baseComputeShowErrors(field, strategy, options.hasSubmitted);
}

/**
 * Utility to combine multiple error visibility signals.
 * Useful when you want to show errors if ANY field has errors.
 *
 * @param showErrorsSignals - Array of show errors signals
 * @returns Signal<boolean> that is true if any field should show errors
 *
 * @example
 * ```typescript
 * const showAnyErrors = combineShowErrors([
 *   showErrors(form.email, 'on-touch', submitted),
 *   showErrors(form.password, 'on-touch', submitted)
 * ]);
 * ```
 */
export function combineShowErrors(
  showErrorsSignals: Signal<boolean>[],
): Signal<boolean> {
  return computed(() => showErrorsSignals.some((signal) => signal()));
}
