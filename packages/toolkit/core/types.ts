import type { SignalLike } from '@angular/aria/ui-patterns';

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
 * Uses SignalLike<T> from @angular/aria for flexible signal inputs.
 * This allows configuration values to be signals, computed signals, or plain values.
 */
export interface NgxSignalFormsConfig {
  /**
   * Enable automatic ARIA attributes (aria-invalid, aria-describedby).
   * @default true
   */
  autoAria?: boolean;

  /**
   * Enable automatic touch state on blur.
   * @default true
   */
  autoTouch?: boolean;

  /**
   * Enable automatic aria-busy during async operations.
   * @default true
   */
  autoFormBusy?: boolean;

  /**
   * Default error display strategy.
   * Can be a static value, signal, or computed signal.
   * @default 'on-touch'
   */
  defaultErrorStrategy?: SignalLike<ErrorDisplayStrategy>;

  /**
   * Custom field name resolver function.
   * Used to extract field names from HTML elements.
   * Can be a static function, signal, or computed signal.
   */
  fieldNameResolver?: SignalLike<(element: HTMLElement) => string | null>;

  /**
   * Throw error when field name cannot be resolved.
   * @default false
   */
  strictFieldResolution?: boolean;

  /**
   * Enable debug logging.
   * @default false
   */
  debug?: boolean;
}
