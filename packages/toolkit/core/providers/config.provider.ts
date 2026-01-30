import type { EnvironmentProviders, Provider } from '@angular/core';
import { makeEnvironmentProviders } from '@angular/core';
import { NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type { NgxSignalFormsUserConfig } from '../types';
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

/**
 * Provides component-level configuration for ngx-signal-forms toolkit.
 *
 * Use this function when you need to configure signal forms at the component level
 * (in a component's `providers` array). For application-level configuration,
 * use `provideNgxSignalFormsConfig()` instead.
 *
 * @param config - User configuration options (all properties optional)
 * @returns Provider array for component-level injection
 *
 * @example
 * ```typescript
 * @Component({
 *   providers: [
 *     provideNgxSignalFormsConfigForComponent({
 *       defaultFormFieldAppearance: 'outline',
 *     }),
 *   ],
 * })
 * export class MyComponent {}
 * ```
 */
export function provideNgxSignalFormsConfigForComponent(
  config: NgxSignalFormsUserConfig,
): Provider[] {
  return [
    {
      provide: NGX_SIGNAL_FORMS_CONFIG,
      useValue: normalizeSignalFormsConfig(config),
    },
  ];
}
