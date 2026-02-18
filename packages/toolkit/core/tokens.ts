import { InjectionToken, type Signal } from '@angular/core';
import type { NgxSignalFormContext } from './directives/ngx-signal-form.directive';
import type { NgxSignalFormsConfig } from './types';

/**
 * Context provided by form field wrapper components.
 * Allows child components (like error display) to inherit field name.
 */
export interface NgxSignalFormFieldContext {
  /** Resolved field name signal */
  readonly fieldName: Signal<string>;
}

/**
 * Default configuration applied when no explicit providers override values.
 * @internal
 */
export const DEFAULT_NGX_SIGNAL_FORMS_CONFIG: NgxSignalFormsConfig = {
  autoAria: true,
  defaultErrorStrategy: () => 'on-touch' as const,
  strictFieldResolution: false,
  debug: false,
  defaultFormFieldAppearance: 'standard',
  showRequiredMarker: true,
  requiredMarker: ' *',
} as const;

/**
 * Injection token for the global ngx-signal-forms configuration.
 */
export const NGX_SIGNAL_FORMS_CONFIG = new InjectionToken<NgxSignalFormsConfig>(
  'NGX_SIGNAL_FORMS_CONFIG',
  {
    factory: () => ({
      ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
    }),
  },
);

/**
 * Injection token for the form context (provided by ngxSignalForm directive).
 *
 * @template TForm - The Signal Forms instance type
 */
export const NGX_SIGNAL_FORM_CONTEXT = new InjectionToken<NgxSignalFormContext>(
  'NGX_SIGNAL_FORM_CONTEXT',
);

/**
 * Injection token for field-level context (provided by form field wrapper).
 * Allows child components to inherit resolved field name without explicit input.
 */
export const NGX_SIGNAL_FORM_FIELD_CONTEXT =
  new InjectionToken<NgxSignalFormFieldContext>(
    'NGX_SIGNAL_FORM_FIELD_CONTEXT',
  );
