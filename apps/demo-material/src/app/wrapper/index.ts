import {
  type EnvironmentProviders,
  type Provider,
  type Type,
} from '@angular/core';
import {
  provideFormFieldErrorRendererForComponent,
  provideFormFieldHintRendererForComponent,
  provideFormFieldErrorRenderer,
  provideFormFieldHintRenderer,
} from '@ngx-signal-forms/toolkit';
import { MaterialFeedbackRenderer } from './material-error-renderer';

export {
  NgxMatBoundControl,
  NgxMatCheckboxControl,
  NgxMatSelectControl,
  NgxMatSlideToggleControl,
  NgxMatTextControl,
} from './control-directives';
export {
  NgxMatFeedback,
  type NgxMatFeedbackContext,
} from './feedback-directive';
export {
  MatFormFieldWrapper,
  NgxMatFormBundle,
} from './mat-form-field-wrapper';
export {
  MaterialFeedbackRenderer,
  type NgxMatFeedbackSeverity,
} from './material-error-renderer';
export {
  NgxMatErrorSlot,
  NgxMatHintSlot,
  type NgxMatErrorSlotContext,
  type NgxMatHintSlotContext,
} from './slot-directives';

/**
 * Optional override shape for `provideNgxMatForms*`. When omitted, the
 * Material reference's default `MaterialFeedbackRenderer` is registered
 * for both error and hint slots.
 */
export interface NgxMatFormsProviderOptions {
  /**
   * Override the renderer instantiated inside `<mat-error>` slots and the
   * error/warning blocks of `*ngxMatFeedback`.
   */
  readonly feedbackRenderer?: { readonly component: Type<unknown> };
}

/**
 * Application-level provider that registers the Material feedback renderer
 * for both `NGX_FORM_FIELD_ERROR_RENDERER` and `NGX_FORM_FIELD_HINT_RENDERER`.
 *
 * Recommended path for apps that consume the Material reference wrapper —
 * one call at bootstrap registers the default `MaterialFeedbackRenderer`
 * (or a consumer-supplied override) once for the entire app.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideNgxMatForms(),
 *     // …
 *   ],
 * });
 * ```
 */
export function provideNgxMatForms(
  options?: NgxMatFormsProviderOptions,
): EnvironmentProviders[] {
  const component =
    options?.feedbackRenderer?.component ?? MaterialFeedbackRenderer;
  return [
    provideFormFieldErrorRenderer({ component }),
    provideFormFieldHintRenderer({ component }),
  ];
}

/**
 * Component-scoped override for the "swap renderer in one screen" use case.
 *
 * Registers the same renderer pair as `provideNgxMatForms` but at component
 * scope — useful when a single screen (e.g. a marketing landing page) needs
 * a different renderer than the rest of the app, without touching the
 * environment-level `provideNgxMatForms` registration.
 *
 * @example
 * ```ts
 * @Component({
 *   providers: [
 *     provideNgxMatFormsForComponent({
 *       feedbackRenderer: { component: MyIconPrefixedRenderer },
 *     }),
 *   ],
 *   // …
 * })
 * export class FlashyContactComponent {}
 * ```
 */
export function provideNgxMatFormsForComponent(
  options?: NgxMatFormsProviderOptions,
): Provider[] {
  const component =
    options?.feedbackRenderer?.component ?? MaterialFeedbackRenderer;
  return [
    ...provideFormFieldErrorRendererForComponent({ component }),
    ...provideFormFieldHintRendererForComponent({ component }),
  ];
}
