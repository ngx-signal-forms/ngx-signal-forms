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
import { NgxSpartanFormFieldError } from './spartan-form-field-error';
import { NgxSpartanFormFieldHint } from './spartan-form-field-hint';

export {
  NgxSpartanFormBundle,
  NgxSpartanFormField,
} from './spartan-form-field';
export { NgxSpartanFormFieldError } from './spartan-form-field-error';
export { NgxSpartanFormFieldHint } from './spartan-form-field-hint';

/**
 * Optional override shape for `provideNgxSpartanForms*`. When omitted, the
 * Spartan reference's default `NgxSpartanFormFieldError` and
 * `NgxSpartanFormFieldHint` are registered. Mirrors the override surface of
 * `provideNgxMatForms` and `provideNgxPrimeForms` so the three references
 * stay shape-compatible (see ADR-0002 §8).
 */
export interface NgxSpartanFormsProviderOptions {
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
 * Application-level provider that registers the Spartan-flavoured renderer
 * pair for both error and hint slots in one call. Mirrors `provideNgxMatForms`
 * and `provideNgxPrimeForms` so consumers get a single bootstrap entry point
 * per design-system reference.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideNgxSpartanForms()],
 * });
 * ```
 */
export function provideNgxSpartanForms(
  options?: NgxSpartanFormsProviderOptions,
): EnvironmentProviders[] {
  const errorComponent =
    options?.errorRenderer?.component ?? NgxSpartanFormFieldError;
  const hintComponent =
    options?.hintRenderer?.component ?? NgxSpartanFormFieldHint;
  return [
    provideFormFieldErrorRenderer({ component: errorComponent }),
    provideFormFieldHintRenderer({ component: hintComponent }),
  ];
}

/**
 * Component-scoped override for the "swap renderer in one screen" use case.
 * Mirrors `provideNgxMatFormsForComponent` / `provideNgxPrimeFormsForComponent`.
 */
export function provideNgxSpartanFormsForComponent(
  options?: NgxSpartanFormsProviderOptions,
): Provider[] {
  const errorComponent =
    options?.errorRenderer?.component ?? NgxSpartanFormFieldError;
  const hintComponent =
    options?.hintRenderer?.component ?? NgxSpartanFormFieldHint;
  return [
    ...provideFormFieldErrorRendererForComponent({ component: errorComponent }),
    ...provideFormFieldHintRendererForComponent({ component: hintComponent }),
  ];
}
