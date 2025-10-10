import { InjectionToken } from '@angular/core';
import type { NgxSignalFormsConfig } from './types';

/**
 * Injection token for the global ngx-signal-forms configuration.
 */
export const NGX_SIGNAL_FORMS_CONFIG = new InjectionToken<NgxSignalFormsConfig>(
  'NGX_SIGNAL_FORMS_CONFIG',
  {
    factory: () => ({
      autoAria: true,
      autoTouch: true,
      autoFormBusy: true,
      defaultErrorStrategy: 'on-touch',
      strictFieldResolution: false,
      debug: false,
    }),
  }
);

/**
 * Injection token for the form context (provided by ngxSignalFormProvider directive).
 */
export const NGX_SIGNAL_FORM_CONTEXT = new InjectionToken<any>(
  'NGX_SIGNAL_FORM_CONTEXT'
);
