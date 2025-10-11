import type { Signal } from '@angular/core';
import { computed } from '@angular/core';
import type { FieldState } from '@angular/forms/signals';
import type { ErrorDisplayStrategy, ReactiveOrStatic } from '../types';
import { unwrapValue } from './unwrap-signal-or-value';

/**
 * Computes whether validation errors should be displayed based on field state and strategy.
 *
 * ## What does it do?
 * Creates a reactive computed signal that determines if a form field's errors should
 * be shown to the user, based on the error display strategy and form/field state.
 *
 * ## When to use it?
 * Use `computeShowErrors()` when you need to:
 * - Implement conditional error display logic in custom form components
 * - Apply different error visibility strategies (immediate, on-touch, on-submit)
 * - Create reactive error display that updates automatically with field state
 * - Build custom form field wrappers with automatic error handling
 *
 * ## How does it work?
 * 1. Accepts reactive or static inputs for field state, strategy, and submission status
 * 2. Creates a computed signal that unwraps all inputs using {@link unwrapValue}
 * 3. Applies strategy logic to determine if errors should be visible
 * 4. Returns a reactive signal that updates when any input changes
 *
 * ## Error Display Strategies
 * - `immediate`: Show errors as soon as field becomes invalid
 * - `on-touch`: Show errors after field is touched (blurred) or form is submitted (WCAG recommended)
 * - `on-submit`: Show errors only after form submission attempt
 * - `manual`: Never show automatically (developer controls display)
 *
 * @template T The type of the field value
 * @param field - The form field state (typically a FieldTree from Angular Signal Forms)
 * @param strategy - The error display strategy
 * @param hasSubmitted - Whether the form has been submitted
 * @returns A computed signal returning `true` when errors should be displayed
 *
 * @example Basic usage with signals
 * ```typescript
 * const showEmailErrors = computeShowErrors(
 *   form.email,           // FieldTree<string> (signal)
 *   signal('on-touch'),   // Reactive strategy
 *   formSubmitted         // Signal<boolean>
 * );
 *
 * /// Use in template
 * @if (showEmailErrors()) {
 *   <span>{{ form.email().errors()[0].message }}</span>
 * }
 * ```
 *
 * @example Static values for simplicity
 * ```typescript
 * const showErrors = computeShowErrors(
 *   form.password,  // FieldTree<string>
 *   'immediate',    // Static strategy
 *   false           // Static boolean
 * );
 * ```
 *
 * @example Dynamic strategy based on field type
 * ```typescript
 * const strategy = computed(() =>
 *   isPasswordField() ? 'immediate' : 'on-touch'
 * );
 *
 * const showErrors = computeShowErrors(
 *   form.field,
 *   strategy,      // Computed strategy
 *   hasSubmitted
 * );
 * ```
 *
 * @example Custom component integration
 * ```typescript
 * @Component({...})
 * export class FormFieldComponent<T> {
 *   readonly field = input.required<FieldTree<T>>();
 *   readonly strategy = input<ReactiveOrStatic<ErrorDisplayStrategy>>('on-touch');
 *   readonly hasSubmitted = input<ReactiveOrStatic<boolean>>(false);
 *
 *   protected readonly showErrors = computed(() =>
 *     computeShowErrors(
 *       this.field(),
 *       this.strategy(),
 *       this.hasSubmitted()
 *     )()
 *   );
 * }
 * ```
 *
 * @see {@link ReactiveOrStatic} For understanding the flexible input types
 * @see {@link unwrapValue} For how inputs are unwrapped internally
 * @see {@link showErrors} For a convenience wrapper of this function
 */
export function computeShowErrors<T>(
  field: ReactiveOrStatic<FieldState<T>>,
  strategy: ReactiveOrStatic<ErrorDisplayStrategy>,
  hasSubmitted: ReactiveOrStatic<boolean>,
): Signal<boolean> {
  return computed(() => {
    // Unwrap all ReactiveOrStatic inputs
    const fieldState = unwrapValue(field);
    const strategyValue = unwrapValue(strategy);
    const submitted = unwrapValue(hasSubmitted);

    // Handle null/undefined field state
    if (!fieldState || typeof fieldState !== 'object') {
      return false;
    }

    // Use official FieldState API
    const isInvalid =
      typeof fieldState.invalid === 'function' ? fieldState.invalid() : false;
    const isTouched =
      typeof fieldState.touched === 'function' ? fieldState.touched() : false;

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
 * 2. Immediately evaluates the strategy logic
 * 3. Returns a boolean result without creating signals or subscriptions
 *
 * @param fieldState - The field state object with `invalid()` and `touched()` methods
 * @param strategy - The error display strategy
 * @param hasSubmitted - Whether the form has been submitted
 * @returns `true` if errors should be displayed
 *
 * @example Imperative validation check
 * ```typescript
 * function handleSubmit() {
 *   const field = form.email();
 *   const showErrors = shouldShowErrors(field, 'on-touch', true);
 *
 *   if (showErrors) {
 *     displayErrors(field.errors());
 *   }
 * }
 * ```
 *
 * @example Custom error display logic
 * ```typescript
 * function getFieldCssClasses(field: FieldState<string>) {
 *   const hasErrors = shouldShowErrors(field, 'immediate', false);
 *   return {
 *     'field-error': hasErrors,
 *     'field-valid': !hasErrors && field.valid()
 *   };
 * }
 * ```
 *
 * @example One-time validation in event handler
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   protected handleBlur() {
 *     const field = this.form.username();
 *     const showErrors = shouldShowErrors(field, 'on-touch', false);
 *
 *     if (showErrors) {
 *       this.logger.logValidationError(field.errors());
 *     }
 *   }
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
