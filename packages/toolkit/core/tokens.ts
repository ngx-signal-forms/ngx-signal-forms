import { InjectionToken, type Signal } from '@angular/core';
import type { NgxSignalFormContext } from './directives/ngx-signal-form.directive';
import type {
  NgxSignalFormControlPresetRegistry,
  NgxSignalFormsConfig,
} from './types';

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
  defaultErrorStrategy: 'on-touch',
  defaultFormFieldAppearance: 'stacked',
  showRequiredMarker: true,
  requiredMarker: ' *',
} as const;

/**
 * Default semantic presets applied when consumers opt into explicit control
 * semantics.
 */
export const DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS: NgxSignalFormControlPresetRegistry =
  {
    'input-like': {
      layout: 'stacked',
      ariaMode: 'auto',
    },
    'standalone-field-like': {
      layout: 'stacked',
      ariaMode: 'auto',
    },
    switch: {
      layout: 'inline-control',
      ariaMode: 'auto',
    },
    checkbox: {
      layout: 'group',
      ariaMode: 'auto',
    },
    'radio-group': {
      layout: 'group',
      ariaMode: 'auto',
    },
    slider: {
      layout: 'stacked',
      ariaMode: 'auto',
    },
    composite: {
      layout: 'custom',
      ariaMode: 'auto',
    },
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
 * Injection token for semantic control presets used by explicit control
 * metadata and wrapper inference.
 */
export const NGX_SIGNAL_FORM_CONTROL_PRESETS =
  new InjectionToken<NgxSignalFormControlPresetRegistry>(
    'NGX_SIGNAL_FORM_CONTROL_PRESETS',
    {
      factory: () => ({
        ...DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
      }),
    },
  );

/**
 * Injection token for the form context (provided by `NgxSignalFormDirective`
 * when `ngxSignalForm` is present alongside Angular's `[formRoot]`).
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
