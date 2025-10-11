import type { Signal } from '@angular/core';
import { computed } from '@angular/core';
import type { ErrorDisplayStrategy, SignalOrValue } from '../types';
import { unwrapSignalOrValue } from './unwrap-signal-or-value';

/**
 * Computes whether errors should be shown based on field state and error display strategy.
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
 * // Works with signals
 * const showErrors = computeShowErrors(
 *   form.email,
 *   signal('on-touch'),
 *   formSubmitted
 * );
 *
 * // Works with computed signals
 * const showErrors = computeShowErrors(
 *   form.email,
 *   computed(() => conditionalStrategy()),
 *   formSubmitted
 * );
 *
 * // Works with static values
 * const showErrors = computeShowErrors(
 *   form.email,
 *   'on-touch',
 *   formSubmitted
 * );
 * ```
 */
export function computeShowErrors<T>(
  field: SignalOrValue<T>,
  strategy: SignalOrValue<ErrorDisplayStrategy>,
  hasSubmitted: SignalOrValue<boolean>,
): Signal<boolean> {
  return computed(() => {
    // Unwrap all SignalOrValue inputs
    const fieldState = unwrapSignalOrValue(field);
    const strategyValue = unwrapSignalOrValue(strategy);
    const submitted = unwrapSignalOrValue(hasSubmitted);

    // Handle null/undefined field state
    if (!fieldState || typeof fieldState !== 'object') {
      return false;
    }

    // Extract field state properties
    // Signal Forms field state has: invalid(), valid(), touched(), etc.
    const isInvalid =
      typeof (fieldState as unknown as { invalid?: () => boolean }).invalid ===
      'function'
        ? (fieldState as unknown as { invalid: () => boolean }).invalid()
        : false;

    const isTouched =
      typeof (fieldState as unknown as { touched?: () => boolean }).touched ===
      'function'
        ? (fieldState as unknown as { touched: () => boolean }).touched()
        : false;

    // Apply strategy logic
    switch (strategyValue) {
      case 'immediate':
        // Show errors immediately as they occur
        return isInvalid;

      case 'on-touch':
        // Show errors after field is touched OR form is submitted
        return isInvalid && (isTouched || submitted);

      case 'on-submit':
        // Show errors only after form submission
        return isInvalid && submitted;

      case 'manual':
        // Don't automatically show errors - developer controls this
        return false;

      default:
        // Default to 'on-touch' behavior
        return isInvalid && (isTouched || submitted);
    }
  });
}

/**
 * Checks if a field should show errors based on the current strategy.
 * This is a helper that doesn't require a computed signal.
 *
 * @param fieldState - The field state object from Signal Forms
 * @param strategy - The error display strategy
 * @param hasSubmitted - Whether the form has been submitted
 * @returns boolean indicating if errors should be shown
 */
export function shouldShowErrors(
  fieldState: {
    invalid: () => boolean;
    touched: () => boolean;
  },
  strategy: ErrorDisplayStrategy,
  hasSubmitted: boolean,
): boolean {
  const isInvalid = fieldState.invalid();
  const isTouched = fieldState.touched();

  switch (strategy) {
    case 'immediate':
      return isInvalid;

    case 'on-touch':
      return isInvalid && (isTouched || hasSubmitted);

    case 'on-submit':
      return isInvalid && hasSubmitted;

    case 'manual':
      return false;

    default:
      return isInvalid && (isTouched || hasSubmitted);
  }
}
