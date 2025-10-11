import type { Signal } from '@angular/core';
import type { DeepPartial } from 'ts-essentials';

/**
 * Represents a value that can be provided as:
 * - A Signal (from `signal()` or `computed()`)
 * - A function returning the value
 * - A static value
 *
 * This type is compatible with Angular Signal Forms' pattern of using
 * callable functions (FieldTree) while also accepting static values.
 *
 * **Why this custom type?**
 * Angular doesn't export a similar type in `@angular/forms/signals`.
 * The `@angular/aria` package had `SignalLike<T>`, but it's experimental
 * and not available in the forms package.
 *
 * @template T The type of value
 *
 * @example
 * ```typescript
 * // All valid:
 * const staticStrategy: SignalOrValue<string> = 'on-touch';
 * const signalStrategy: SignalOrValue<string> = signal('on-touch');
 * const computedStrategy: SignalOrValue<string> = computed(() => 'on-touch');
 * const functionStrategy: SignalOrValue<string> = () => 'on-touch';
 * ```
 */
export type SignalOrValue<T> = Signal<T> | (() => T) | T;

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
   * Enable automatic touch state on blur.
   * @default true
   */
  autoTouch: boolean;

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
  defaultErrorStrategy: SignalOrValue<ErrorDisplayStrategy>;

  /**
   * Custom field name resolver function.
   * Used to extract field names from HTML elements.
   * Can be a static function, signal, or function returning a function.
   * If not provided, falls back to built-in priority: id > name
   */
  fieldNameResolver?: SignalOrValue<(element: HTMLElement) => string | null>;

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
