import type { Signal } from '@angular/core';
import { computed } from '@angular/core';
import type { FieldState, SubmittedStatus } from '@angular/forms/signals';
import type { ErrorDisplayStrategy, ReactiveOrStatic } from '../types';
import { unwrapValue } from './unwrap-signal-or-value';

/**
 * Computes whether validation errors should be displayed based on field state and strategy.
 *
 * ## What does it do?
 * Creates a reactive computed signal that determines if a form field's errors should
 * be shown to the user, based on the error display strategy and field state.
 *
 * ## Simplified Architecture (aligned with Angular Signal Forms)
 *
 * Angular Signal Forms provides all necessary signals per-field:
 * - `field.touched()` - true after blur OR after `submit()` calls `markAllAsTouched()`
 * - `field.invalid()` - true when field has validation errors
 *
 * This means for the default `'on-touch'` strategy, we only need `field.touched()`.
 * The `submittedStatus` parameter is now **optional** and only needed for `'on-submit'` strategy.
 *
 * ## When to use it?
 * Use `computeShowErrors()` when you need to:
 * - Implement conditional error display logic in custom form components
 * - Apply different error visibility strategies (immediate, on-touch, on-submit)
 * - Create reactive error display that updates automatically with field state
 * - Build custom form field wrappers with automatic error handling
 *
 * ## How does it work?
 * 1. Accepts reactive or static inputs for field state, strategy, and optional submission status
 * 2. Creates a computed signal that unwraps all inputs using {@link unwrapValue}
 * 3. For `'on-touch'`: Uses `field.touched()` directly (Angular's `submit()` marks all touched)
 * 4. For `'on-submit'`: Uses `submittedStatus` if provided, otherwise falls back to `touched()`
 * 5. Returns a reactive signal that updates when any input changes
 *
 * ## Error Display Strategies
 * - `immediate`: Show errors as soon as field becomes invalid
 * - `on-touch`: Show errors after field is touched (blurred or form submitted) - **WCAG recommended**
 * - `on-submit`: Show errors only after form submission attempt
 * - `manual`: Never show automatically (developer controls display)
 *
 * @template T The type of the field value
 * @param field - The form field state (FieldTree from Angular Signal Forms)
 * @param strategy - The error display strategy
 * @param submittedStatus - Optional: Only needed for 'on-submit' strategy. For 'on-touch', Angular's `submit()` already marks fields as touched.
 * @returns A computed signal returning `true` when errors should be displayed
 *
 * @example Simple usage (no submittedStatus needed for on-touch)
 * ```typescript
 * const showEmailErrors = computeShowErrors(
 *   form.email,
 *   'on-touch'
 * );
 *
 * /// Errors show when: field.invalid() && field.touched()
 * /// Angular's submit() calls markAllAsTouched(), so errors show after submit too!
 * ```
 *
 * @example With on-submit strategy (needs submittedStatus)
 * ```typescript
 * const showEmailErrors = computeShowErrors(
 *   form.email,
 *   'on-submit',
 *   computed<SubmittedStatus>(() =>
 *     form().submitting() ? 'submitting' : form().touched() ? 'submitted' : 'unsubmitted'
 *   )
 * );
 * ```
 *
 * @example Dynamic strategy
 * ```typescript
 * const strategy = computed(() =>
 *   isPasswordField() ? 'immediate' : 'on-touch'
 * );
 *
 * const showErrors = computeShowErrors(form.field, strategy);
 * ```
 *
 * @see {@link ReactiveOrStatic} For understanding the flexible input types
 * @see {@link unwrapValue} For how inputs are unwrapped internally
 * @see {@link showErrors} For a convenience wrapper of this function
 */
export function computeShowErrors<T>(
  field: ReactiveOrStatic<FieldState<T>>,
  strategy: ReactiveOrStatic<ErrorDisplayStrategy>,
  submittedStatus?: ReactiveOrStatic<SubmittedStatus | undefined>,
): Signal<boolean> {
  return computed(() => {
    // Unwrap all ReactiveOrStatic inputs
    const fieldState = unwrapValue(field);
    const strategyValue = unwrapValue(strategy);

    // Handle null/undefined field state
    if (!fieldState || typeof fieldState !== 'object') {
      return false;
    }

    // Use type guards to safely access field state methods
    const stateObj = fieldState as {
      invalid?: () => boolean;
      touched?: () => boolean;
    };
    const isInvalid =
      typeof stateObj?.invalid === 'function' ? stateObj.invalid() : false;
    const isTouched =
      typeof stateObj?.touched === 'function' ? stateObj.touched() : false;

    // Only unwrap submittedStatus if provided (for 'on-submit' strategy)
    const status = submittedStatus ? unwrapValue(submittedStatus) : undefined;
    const hasSubmitted = status !== undefined && status !== 'unsubmitted';

    // Apply strategy logic
    let result: boolean;
    switch (strategyValue) {
      case 'immediate':
        // Show errors immediately as they occur
        result = isInvalid;
        break;

      case 'on-touch':
        // Show errors after field is touched (blur OR submit)
        // Angular's submit() calls markAllAsTouched(), so touched() is true after submit
        result = isInvalid && isTouched;
        break;

      case 'on-submit':
        // Show errors only after form submission
        // If submittedStatus provided, use it; otherwise fall back to touched()
        // (touched becomes true after submit() calls markAllAsTouched())
        result =
          isInvalid && (hasSubmitted || (status === undefined && isTouched));
        break;

      case 'manual':
        // Don't automatically show errors - developer controls this
        result = false;
        break;

      default:
        // Default to 'on-touch' behavior
        result = isInvalid && isTouched;
    }

    // Debug logging
    if ((window as { __DEBUG_SHOW_ERRORS__?: boolean }).__DEBUG_SHOW_ERRORS__) {
      console.log('[computeShowErrors]', {
        strategy: strategyValue,
        isInvalid,
        isTouched,
        hasSubmitted,
        submittedStatusProvided: status !== undefined,
        result,
      });
    }

    return result;
  });
}

/**
 * Determines if errors should be shown immediately without creating a reactive signal.
 *
 * ## What does it do?
 * Performs a synchronous check to determine if form field errors should be displayed,
 * without the overhead of creating a computed signal. This is a lightweight helper
 * for non-reactive scenarios or one-time checks.
 *
 * ## When to use it?
 * Use `shouldShowErrors()` when you need to:
 * - Check error visibility in imperative code (event handlers, functions)
 * - Perform one-time validation checks without reactivity
 * - Implement custom logic that doesn't need automatic updates
 * - Reduce memory overhead when reactivity isn't needed
 *
 * **Use {@link computeShowErrors} instead when you need reactive updates.**
 *
 * ## How does it work?
 * 1. Accepts unwrapped (static) field state, strategy, and submission status
 * 2. Converts `submittedStatus` to boolean (`!== 'unsubmitted'`)
 * 3. Immediately evaluates the strategy logic
 * 4. Returns a boolean result without creating signals or subscriptions
 *
 * @param fieldState - The field state object with `invalid()` and `touched()` methods
 * @param strategy - The error display strategy
 * @param submittedStatus - Angular's submission status
 * @returns `true` if errors should be displayed
 *
 * @example Imperative validation check
 * ```typescript
 * function handleSave() {
 *   const field = form.email();
 *   const status: SubmittedStatus = form().submitting()
 *     ? 'submitting'
 *     : form().touched()
 *       ? 'submitted'
 *       : 'unsubmitted';
 *   const showErrors = shouldShowErrors(field, 'on-touch', status);
 *
 *   if (showErrors) {
 *     displayErrors(field.errors());
 *   }
 * }
 * ```
 *
 * @example Custom error display logic
 * ```typescript
 * function getFieldCssClasses(field: FieldState<string>, status: SubmittedStatus) {
 *   const hasErrors = shouldShowErrors(field, 'immediate', status);
 *   return {
 *     'field-error': hasErrors,
 *     'field-valid': !hasErrors && field.valid()
 *   };
 * }
 * ```
 *
 * @see {@link computeShowErrors} For reactive version that creates a computed signal
 * @see {@link ErrorDisplayStrategy} For available strategies
 */
export function shouldShowErrors(
  fieldState: {
    invalid: () => boolean;
    touched: () => boolean;
  },
  strategy: ErrorDisplayStrategy,
  submittedStatus: SubmittedStatus,
): boolean {
  const hasSubmitted = submittedStatus !== 'unsubmitted';
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
