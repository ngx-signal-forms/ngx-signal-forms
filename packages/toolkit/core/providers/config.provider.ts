import type { EnvironmentProviders, Provider } from '@angular/core';
import { inject, makeEnvironmentProviders } from '@angular/core';
import {
  DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
  NGX_SIGNAL_FORMS_CONFIG,
} from '../tokens';
import type { NgxSignalFormsConfig, NgxSignalFormsUserConfig } from '../types';
import { createCascadingResolver } from '../utilities/cascading-resolver';

/**
 * Merges each config property in three tiers: `userConfig`, then the parent
 * scope's `NGX_SIGNAL_FORMS_CONFIG`, then `DEFAULT_NGX_SIGNAL_FORMS_CONFIG`.
 * The environment-level and component-level providers both use this factory,
 * so inheritance works the same in every DI scope.
 *
 * Only `null` and `undefined` fall through. Falsy overrides such as
 * `requiredMarker: ''` or `errorSummaryAnnouncesAlone: false` stay in effect.
 *
 * @internal
 */
function createConfigFactory(
  userConfig: NgxSignalFormsUserConfig,
): () => NgxSignalFormsConfig {
  return () => {
    const parent = inject(NGX_SIGNAL_FORMS_CONFIG, {
      optional: true,
      skipSelf: true,
    });

    const keys = Object.keys(
      DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
    ) as (keyof NgxSignalFormsConfig)[];

    // `Object.fromEntries` drops key types. Every key comes from the defaults,
    // which `satisfies NgxSignalFormsConfig`, so the result is complete.
    return Object.fromEntries(
      keys.map((key) => [
        key,
        createCascadingResolver({
          input: userConfig[key],
          configDefault: parent?.[key],
          fallback: DEFAULT_NGX_SIGNAL_FORMS_CONFIG[key],
        }),
      ]),
    ) as unknown as NgxSignalFormsConfig;
  };
}

/**
 * Provides global configuration for ngx-signal-forms toolkit.
 *
 * **Inheritance**: when nested under another `provideNgxSignalFormsConfig`,
 * the child call inherits parent values for any property it does not
 * override. This matches the behavior of
 * `provideNgxSignalFormControlPresets`.
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
 *       defaultErrorStrategy: 'on-touch',
 *     }),
 *   ],
 * };
 * ```
 *
 * @public
 */
export function provideNgxSignalFormsConfig(
  config: NgxSignalFormsUserConfig,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: NGX_SIGNAL_FORMS_CONFIG,
      useFactory: createConfigFactory(config),
    },
  ]);
}

/**
 * Provides component-level configuration for ngx-signal-forms toolkit.
 *
 * Use this function when you need to configure signal forms at the component
 * level (in a component's `providers` array). For application-level
 * configuration, use `provideNgxSignalFormsConfig()` instead.
 *
 * **Inheritance**: parent-scope config is inherited via `inject(..., {
 * optional: true, skipSelf: true })` and merged property-by-property with
 * the supplied overrides — matching `provideNgxSignalFormControlPresetsForComponent`.
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
 *
 * @public
 */
export function provideNgxSignalFormsConfigForComponent(
  config: NgxSignalFormsUserConfig,
): Provider[] {
  return [
    {
      provide: NGX_SIGNAL_FORMS_CONFIG,
      useFactory: createConfigFactory(config),
    },
  ];
}
