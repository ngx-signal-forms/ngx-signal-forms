import type { EnvironmentProviders } from '@angular/core';
import { makeEnvironmentProviders } from '@angular/core';
import type { NgxSignalFormsConfig } from '../types';
import { NGX_SIGNAL_FORMS_CONFIG } from '../tokens';

/**
 * Provides global configuration for ngx-signal-forms toolkit.
 *
 * @param config - Configuration options
 * @returns Environment providers
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideNgxSignalFormsConfig({
 *       autoAria: true,
 *       autoTouch: true,
 *       defaultErrorStrategy: 'on-touch',
 *     }),
 *   ],
 * };
 * ```
 */
export function provideNgxSignalFormsConfig(
  config: NgxSignalFormsConfig
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: NGX_SIGNAL_FORMS_CONFIG,
      useValue: config,
    },
  ]);
}
