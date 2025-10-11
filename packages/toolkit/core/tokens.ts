import { InjectionToken } from '@angular/core';
import type { NgxSignalFormsConfig } from './types';
import type { NgxSignalFormContext } from './directives/form-provider.directive';

/**
 * Default configuration applied when no explicit providers override values.
 */
export const DEFAULT_NGX_SIGNAL_FORMS_CONFIG: NgxSignalFormsConfig = {
  autoAria: true,
  autoTouch: true,
  autoFormBusy: true,
  defaultErrorStrategy: () => 'on-touch' as const,
  strictFieldResolution: false,
  debug: false,
};

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
 * Injection token for the form context (provided by ngxSignalFormProvider directive).
 *
 * @template TForm - The Signal Forms instance type
 */
export const NGX_SIGNAL_FORM_CONTEXT = new InjectionToken<NgxSignalFormContext>(
  'NGX_SIGNAL_FORM_CONTEXT',
);
