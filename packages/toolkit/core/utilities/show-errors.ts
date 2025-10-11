import type { Signal } from '@angular/core';
import { computed } from '@angular/core';
import type { ErrorDisplayStrategy, SignalOrValue } from '../types';
import { computeShowErrors as baseComputeShowErrors } from './error-strategies';

/**
 * Re-export the computeShowErrors function from error-strategies.
 * This provides a cleaner import path for consumers.
 *
 * Accepts signals, functions, or plain values for flexible usage.
 *
 * @param field - Signal/function containing the field state from Signal Forms
 * @param strategy - Error display strategy (signal/function or static value)
 * @param hasSubmitted - Signal/function indicating if the form has been submitted
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
 * @param field - Signal/function containing the field state
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
  field: SignalOrValue<T>,
  options: {
    strategy?: SignalOrValue<ErrorDisplayStrategy>;
    hasSubmitted: SignalOrValue<boolean>;
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
