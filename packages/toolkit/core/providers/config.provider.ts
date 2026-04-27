import type { EnvironmentProviders, Provider } from '@angular/core';
import { inject, makeEnvironmentProviders } from '@angular/core';
import {
  DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
  NGX_SIGNAL_FORMS_CONFIG,
} from '../tokens';
import type { NgxSignalFormsConfig, NgxSignalFormsUserConfig } from '../types';
import { createCascadingResolver } from '../utilities/cascading-resolver';

/**
 * Factory that merges the parent-scope `NGX_SIGNAL_FORMS_CONFIG` (if one is
 * provided higher up the injector tree) with the caller-supplied user
 * overrides. Used by both the environment-level and component-level
 * providers so the inheritance contract is identical across DI scopes:
 * parent config bubbles down, child overrides win per property.
 *
 * Mirrors the factory-with-skipSelf pattern in
 * `provideNgxSignalFormControlPresetsForComponent` to keep the two providers
 * behaviorally symmetric.
 *
 * Tiers per property: `userConfig` → `parentConfig` → `DEFAULT_NGX_SIGNAL_FORMS_CONFIG`.
 * Uses nullish-only short-circuit so falsy overrides (e.g. `requiredMarker: ''`,
 * `autoAria: false`) are preserved and do not fall through to parent defaults.
 *
 * @internal
 */
function createConfigFactory(
  userConfig: NgxSignalFormsUserConfig,
): () => NgxSignalFormsConfig {
  return () => {
    const parentOrNull = inject(NGX_SIGNAL_FORMS_CONFIG, {
      optional: true,
      skipSelf: true,
    });

    return {
      autoAria: createCascadingResolver({
        input: userConfig.autoAria,
        configDefault: parentOrNull?.autoAria,
        fallback: DEFAULT_NGX_SIGNAL_FORMS_CONFIG.autoAria,
      }),
      defaultErrorStrategy: createCascadingResolver({
        input: userConfig.defaultErrorStrategy,
        configDefault: parentOrNull?.defaultErrorStrategy,
        fallback: DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy,
      }),
      defaultFormFieldAppearance: createCascadingResolver({
        input: userConfig.defaultFormFieldAppearance,
        configDefault: parentOrNull?.defaultFormFieldAppearance,
        fallback: DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultFormFieldAppearance,
      }),
      defaultFormFieldOrientation: createCascadingResolver({
        input: userConfig.defaultFormFieldOrientation,
        configDefault: parentOrNull?.defaultFormFieldOrientation,
        fallback: DEFAULT_NGX_SIGNAL_FORMS_CONFIG.defaultFormFieldOrientation,
      }),
      showRequiredMarker: createCascadingResolver({
        input: userConfig.showRequiredMarker,
        configDefault: parentOrNull?.showRequiredMarker,
        fallback: DEFAULT_NGX_SIGNAL_FORMS_CONFIG.showRequiredMarker,
      }),
      requiredMarker: createCascadingResolver({
        input: userConfig.requiredMarker,
        configDefault: parentOrNull?.requiredMarker,
        fallback: DEFAULT_NGX_SIGNAL_FORMS_CONFIG.requiredMarker,
      }),
    };
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
 *       autoAria: true,
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
