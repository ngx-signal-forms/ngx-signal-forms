import {
  type EnvironmentProviders,
  type Provider,
  type Type,
} from '@angular/core';
import {
  provideFormFieldErrorRenderer,
  provideFormFieldErrorRendererForComponent,
  provideFormFieldHintRenderer,
  provideFormFieldHintRendererForComponent,
} from '@ngx-signal-forms/toolkit';
import { PrimeFieldErrorComponent } from './prime-field-error';
import { PrimeFieldHintComponent } from './prime-field-hint';

export {
  NgxPrimeFormBundle,
  PrimeFormFieldComponent,
} from './prime-form-field';
export { PrimeFieldErrorComponent } from './prime-field-error';
export { PrimeFieldHintComponent } from './prime-field-hint';

/**
 * Optional override shape for `provideNgxPrimeForms`. When omitted, the
 * PrimeNG reference's default `PrimeFieldErrorComponent` and
 * `PrimeFieldHintComponent` are registered.
 */
export interface NgxPrimeFormsProviderOptions {
  /**
   * Override the renderer instantiated for `NGX_FORM_FIELD_ERROR_RENDERER`.
   */
  readonly errorRenderer?: { readonly component: Type<unknown> };
  /**
   * Override the renderer instantiated for `NGX_FORM_FIELD_HINT_RENDERER`.
   */
  readonly hintRenderer?: { readonly component: Type<unknown> };
}

/**
 * Application-level provider that registers the PrimeNG-flavoured renderer
 * pair for both error and hint slots in one call. Mirrors
 * `provideNgxMatForms` from the Material reference so consumers get a
 * single bootstrap entry point per design-system.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideNgxPrimeForms()],
 * });
 * ```
 */
export function provideNgxPrimeForms(
  options?: NgxPrimeFormsProviderOptions,
): EnvironmentProviders[] {
  const errorComponent =
    options?.errorRenderer?.component ?? PrimeFieldErrorComponent;
  const hintComponent =
    options?.hintRenderer?.component ?? PrimeFieldHintComponent;
  return [
    provideFormFieldErrorRenderer({ component: errorComponent }),
    provideFormFieldHintRenderer({ component: hintComponent }),
  ];
}

/**
 * Component-scoped override for the "swap renderer in one screen" use case.
 * Mirrors `provideNgxMatFormsForComponent`.
 */
export function provideNgxPrimeFormsForComponent(
  options?: NgxPrimeFormsProviderOptions,
): Provider[] {
  const errorComponent =
    options?.errorRenderer?.component ?? PrimeFieldErrorComponent;
  const hintComponent =
    options?.hintRenderer?.component ?? PrimeFieldHintComponent;
  return [
    ...provideFormFieldErrorRendererForComponent({ component: errorComponent }),
    ...provideFormFieldHintRendererForComponent({ component: hintComponent }),
  ];
}
