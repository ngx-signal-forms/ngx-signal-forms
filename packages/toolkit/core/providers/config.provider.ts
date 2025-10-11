import type { EnvironmentProviders } from '@angular/core';
import { makeEnvironmentProviders } from '@angular/core';
import type { NgxSignalFormsUserConfig } from '../types';
import { NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import { normalizeSignalFormsConfig } from '../utilities/normalize-config';

/**
 * Provides global configuration for ngx-signal-forms toolkit.
 *
 * @param config - User configuration options (all properties optional)
 * @returns Environment providers
 *
 * @example
 * ```typescript
 * /// app.config.ts
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
  config: NgxSignalFormsUserConfig,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: NGX_SIGNAL_FORMS_CONFIG,
      useValue: normalizeSignalFormsConfig(config),
    },
  ]);
}
