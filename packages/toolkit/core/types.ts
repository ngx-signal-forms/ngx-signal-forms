import type { Signal } from '@angular/core';
import type { ValidationError } from '@angular/forms/signals';
import type { DeepPartial } from 'ts-essentials';

/**
 * Submission status of a form.
 *
 * Note: Angular Signal Forms does not export this type, so we define it locally.
 * This matches the expected behavior for tracking form submission state.
 *
 * @remarks
 * - `'unsubmitted'` - Form has not been submitted yet
 * - `'submitting'` - Form is currently being submitted
 * - `'submitted'` - Form has been submitted (regardless of success/failure)
 */
export type SubmittedStatus = 'unsubmitted' | 'submitting' | 'submitted';

/**
 * A signal-like value that can be called to get the current value.
 * Represents either an Angular Signal or a zero-argument function.
 *
 * @template T The type of value returned when called
 */
export type SignalLike<T> = Signal<T> | (() => T);

/**
 * Accepts reactive (Signal/function) or static values.
 *
 * This type extends Angular's `SignalLike<T>` to also accept static values,
 * providing maximum flexibility for APIs that can work with both reactive
 * and non-reactive data.
 *
 * ## What is it?
 * A union type that accepts:
 * - `Signal<T>` - Angular signals from `signal()` or `computed()`
 * - `() => T` - Zero-argument functions returning `T`
 * - `T` - Static values of type `T`
 *
 * ## When to use it?
 * Use `ReactiveOrStatic<T>` for function parameters or component inputs that:
 * - Should support both reactive and static values
 * - Need to adapt to different usage patterns (simple vs. dynamic)
 * - Want to provide flexibility without requiring signals everywhere
 *
 * ## How does it work?
 * The type builds on `SignalLike<T>` from `@angular/aria/ui-patterns`:
 * - `SignalLike<T>` = `Signal<T> | (() => T)` (reactive values only)
 * - `ReactiveOrStatic<T>` = `SignalLike<T> | T` (adds static values)
 *
 * Values are unwrapped using `unwrapValue()` to get the actual `T`.
 *
 * @template T The type of value when unwrapped
 *
 * @example Basic usage
 * ```typescript
 * /// All valid assignments:
 * const static: ReactiveOrStatic<string> = 'on-touch';
 * const signal: ReactiveOrStatic<string> = signal('on-touch');
 * const computed: ReactiveOrStatic<string> = computed(() => 'on-touch');
 * const fn: ReactiveOrStatic<string> = () => 'on-touch';
 * ```
 *
 * @example Component input
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   /// Accepts signal, function, or static strategy
 *   readonly strategy = input<ReactiveOrStatic<ErrorDisplayStrategy>>('on-touch');
 *
 *   protected readonly actualStrategy = computed(() =>
 *     unwrapValue(this.strategy())
 *   );
 * }
 * ```
 *
 * @example Function parameter
 * ```typescript
 * function computeShowErrors<T>(
 *   field: ReactiveOrStatic<FieldState<T>>,
 *   strategy: ReactiveOrStatic<ErrorDisplayStrategy>
 * ): Signal<boolean> {
 *   return computed(() => {
 *     const fieldState = unwrapValue(field);
 *     const strategyValue = unwrapValue(strategy);
 *     /// ... use unwrapped values
 *   });
 * }
 * ```
 *
 * @see {@link unwrapValue} To extract the static value from ReactiveOrStatic
 * @see https://angular.dev/guide/signals Angular Signals documentation
 */
export type ReactiveOrStatic<T> = SignalLike<T> | T;

/**
 * Error display strategy determines when validation errors are shown to the user.
 *
 * @example Form-level strategy (all fields inherit)
 * ```html
 * <form [ngxSignalForm]="form" [errorStrategy]="'on-touch'">
 *   <!-- All errors use 'on-touch' strategy -->
 * </form>
 * ```
 *
 * @example Field-level override
 * ```html
 * <form [ngxSignalForm]="form" [errorStrategy]="'on-touch'">
 *   <!-- Password shows errors immediately -->
 *   <ngx-signal-form-error
 *     [formField]="form.password"
 *     fieldName="password"
 *     strategy="immediate" />
 *
 *   <!-- Email inherits form-level 'on-touch' -->
 *   <ngx-signal-form-error
 *     [formField]="form.email"
 *     fieldName="email"
 *     strategy="inherit" />
 * </form>
 * ```
 */
export type ErrorDisplayStrategy =
  | 'immediate' // Show errors as they occur
  | 'on-touch' // Show after blur or submit (WCAG recommended)
  | 'on-submit' // Show only after submit
  | 'manual' // Developer controls display
  | 'inherit'; // Inherit from form provider (field-level only)

/**
 * Form field appearance variants.
 *
 * Controls the visual style of form field wrappers, matching design patterns
 * like Angular Material's form field appearance variants.
 *
 * - `'standard'`: Default appearance with label above input (default)
 * - `'outline'`: Material Design outlined appearance with floating label
 * - `'inherit'`: Inherit from global config (component-level only)
 *
 * @example Global configuration
 * ```typescript
 * provideNgxSignalFormsConfig({
 *   defaultFormFieldAppearance: 'outline', // All fields use outline by default
 * });
 * ```
 *
 * @example Component-level override
 * ```html
 * <!-- Override global config to use standard for specific field -->
 * <ngx-signal-form-field-wrapper [formField]="form.email" appearance="standard">
 *   <label for="email">Email</label>
 *   <input id="email" [formField]="form.email" />
 * </ngx-signal-form-field-wrapper>
 * ```
 *
 * @see https://material.angular.dev/components/form-field/overview#form-field-appearance-variants
 */
export type FormFieldAppearance = 'standard' | 'outline' | 'inherit';

/**
 * Configuration options for the ngx-signal-forms toolkit.
 *
 * Allows configuration values to be signals, functions, or plain values.
 */
export interface NgxSignalFormsConfig {
  /**
   * Enable automatic ARIA attributes (aria-invalid, aria-describedby).
   * @default true
   */
  autoAria: boolean;

  /**
   * Default error display strategy.
   * Can be a static value, signal, or function.
   * @default 'on-touch'
   */
  defaultErrorStrategy: ReactiveOrStatic<ErrorDisplayStrategy>;

  /**
   * Custom field name resolver function.
   * Used to extract field names from HTML elements.
   * Can be a static function, signal, or function returning a function.
   * If not provided, falls back to built-in priority: id > name
   */
  fieldNameResolver?: ReactiveOrStatic<(element: HTMLElement) => string | null>;

  /**
   * Throw error when field name cannot be resolved.
   * @default false
   */
  strictFieldResolution: boolean;

  /**
   * Enable debug logging.
   * @default false
   */
  debug: boolean;

  /**
   * Default appearance for form fields.
   * When set, all NgxSignalFormFieldWrapperComponent instances will use this appearance
   * unless explicitly overridden with the `appearance` input.
   *
   * @default 'standard'
   *
   * @example Global outline mode
   * ```typescript
   * provideNgxSignalFormsConfig({
   *   defaultFormFieldAppearance: 'outline',
   * });
   * ```
   *
   * @example Component-level override
   * ```html
   * <!-- Force standard appearance even if global config is 'outline' -->
   * <ngx-signal-form-field-wrapper [formField]="form.email" appearance="standard">
   *   <label for="email">Email</label>
   *   <input id="email" [formField]="form.email" />
   * </ngx-signal-form-field-wrapper>
   * ```
   */
  defaultFormFieldAppearance: FormFieldAppearance;

  /**
   * Whether to show the required marker for outlined fields.
   * When false, outlined fields do not append the required marker.
   *
   * @default true
   */
  showRequiredMarker: boolean;

  /**
   * Custom character(s) to display as the required marker in outlined fields.
   *
   * @default '*'
   */
  requiredMarker: string;
}

/**
 * User-provided configuration (all properties optional).
 * Uses DeepPartial to allow partial configuration with type safety.
 */
export type NgxSignalFormsUserConfig = DeepPartial<NgxSignalFormsConfig>;

/**
 * Type utility: Extract FieldState type from a FieldTree.
 *
 * @template T The FieldTree type
 *
 * @example
 * ```typescript
 * const emailField = form.email; // FieldTree<string>
 * type EmailState = ExtractFieldState<typeof emailField>; // FieldState<string>
 * ```
 */
export type ExtractFieldState<T> = T extends () => infer State ? State : never;

/**
 * Type utility: Extract value type from a FieldState.
 *
 * @template T The FieldState type
 *
 * @example
 * ```typescript
 * import type { FieldState } from '@angular/forms/signals';
 *
 * type EmailValue = ExtractFieldValue<FieldState<string>>; // string
 * ```
 */
export type ExtractFieldValue<T> = T extends { value: () => infer V }
  ? V
  : never;

/**
 * ValidationError with additional validator-specific properties.
 *
 * Angular's ValidationError has a strict shape (kind, message), but validators
 * can add additional properties (minLength, min, max, pattern, etc.).
 *
 * This type safely represents those additional properties as Record<string, unknown>,
 * avoiding unsafe `as any` casts while maintaining type safety.
 *
 * ## Why this exists
 *
 * When validators create errors, they often include additional data:
 * - `minLength` validator adds `{ kind: 'minLength', minLength: 8 }`
 * - `min` validator adds `{ kind: 'min', min: 0 }`
 * - Custom validators can add any properties
 *
 * TypeScript's strict type checking prevents direct access to these properties
 * because ValidationError's interface doesn't include them. This intersection type
 * provides a type-safe way to access validator parameters.
 *
 * @example Factory function with type-safe parameter access
 * ```typescript
 * const registry: ErrorMessageRegistry = {
 *   minLength: (params) => {
 *     /// params is Record<string, unknown>, need type assertion for specific properties
 *     const min = (params as { minLength: number }).minLength;
 *     return `Minimum ${min} characters required`;
 *   },
 * };
 * ```
 *
 * @example Component usage
 * ```typescript
 * function resolveMessage(error: ValidationError): string {
 *   /// Cast to ValidationErrorWithParams for factory function calls
 *   const errorWithParams = error as ValidationErrorWithParams;
 *   return factoryFn(errorWithParams);
 * }
 * ```
 */
export type ValidationErrorWithParams = ValidationError &
  Record<string, unknown>;
