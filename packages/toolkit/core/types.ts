import type { Signal } from '@angular/core';
import type { DeepPartial } from 'ts-essentials';

/**
 * Submission status of a form.
 *
 * Angular Signal Forms exposes `submitting()` but does NOT provide a
 * `submittedStatus()` signal. The toolkit derives this from native signals.
 *
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
 * @internal Used internally by toolkit utilities. Not part of the public API.
 * @template T The type of value when unwrapped
 */
export type ReactiveOrStatic<T> = SignalLike<T> | T;

/**
 * Resolved error display strategy used by forms and config defaults.
 *
 * This excludes `'inherit'`, which only makes sense for field-level overrides.
 */
export type ResolvedErrorDisplayStrategy =
  | 'immediate'
  | 'on-touch'
  | 'on-submit';

/**
 * Error display strategy determines when validation errors are shown to the user.
 *
 * - `'immediate'` — Show errors as they occur (real-time)
 * - `'on-touch'` — Show after blur or submit (WCAG recommended, default)
 * - `'on-submit'` — Show only after form submission
 * - `'inherit'` — Inherit from form provider (field-level only)
 */
export type ErrorDisplayStrategy = ResolvedErrorDisplayStrategy | 'inherit';

/**
 * Form field appearance for global configuration.
 *
 * - `'standard'`: Label above input (default)
 * - `'outline'`: Material Design outlined appearance with floating label
 */
export type FormFieldAppearance = 'standard' | 'outline';

/**
 * Form field appearance input for component-level control.
 *
 * Extends FormFieldAppearance with 'inherit' option to use global config default.
 *
 * - `'standard'`: Default appearance with label above input
 * - `'outline'`: Material Design outlined appearance with floating label
 * - `'inherit'`: Use the global config default (component-level only)
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
export type FormFieldAppearanceInput = FormFieldAppearance | 'inherit';

/**
 * Configuration options for the ngx-signal-forms toolkit.
 */
export interface NgxSignalFormsConfig {
  /**
   * Enable automatic ARIA attributes (aria-invalid, aria-describedby).
   * @default true
   */
  autoAria: boolean;

  /**
   * Default error display strategy.
   * @default 'on-touch'
   */
  defaultErrorStrategy: ResolvedErrorDisplayStrategy;

  /**
   * Default appearance for form fields.
   * @default 'standard'
   */
  defaultFormFieldAppearance: FormFieldAppearance;

  /**
   * Whether to show the required marker for outlined fields.
   * @default true
   */
  showRequiredMarker: boolean;

  /**
   * Custom character(s) to display as the required marker in outlined fields.
   * @default ' *'
   */
  requiredMarker: string;
}

/**
 * User-provided configuration (all properties optional).
 * Uses DeepPartial to allow partial configuration with type safety.
 */
export type NgxSignalFormsUserConfig = DeepPartial<NgxSignalFormsConfig>;
