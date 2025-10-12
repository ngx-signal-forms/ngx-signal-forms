import type { SignalLike } from '@angular/aria/ui-patterns';
import type { DeepPartial } from 'ts-essentials';

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
 *   // Accepts signal, function, or static strategy
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
 *     // ... use unwrapped values
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
 */
export type ErrorDisplayStrategy =
  | 'immediate' // Show errors as they occur
  | 'on-touch' // Show after blur or submit (WCAG recommended)
  | 'on-submit' // Show only after submit
  | 'manual'; // Developer controls display

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
   * Enable automatic aria-busy during async operations.
   * @default true
   */
  autoFormBusy: boolean;

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
