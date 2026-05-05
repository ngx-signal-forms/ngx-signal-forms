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
import { MaterialHintRenderer } from './material-hint-renderer';

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
export { MaterialHintRenderer } from './material-hint-renderer';
export {
  NgxMatErrorSlot,
  NgxMatHintSlot,
  type NgxMatErrorSlotContext,
  type NgxMatHintSlotContext,
} from './slot-directives';

/**
 * Optional override shape for `provideNgxMatForms*`. When omitted, the
 * Material reference's defaults are used: `MaterialFeedbackRenderer` for the
 * error slot and `MaterialHintRenderer` for the hint slot.
 */
export interface NgxMatFormsProviderOptions {
  /**
   * Override the renderer instantiated inside `<mat-error>` slots and the
   * error/warning blocks of `*ngxMatFeedback`.
   */
  readonly feedbackRenderer?: { readonly component: Type<unknown> };
  /**
   * Override the renderer dispatched by `NgxFormFieldHint` via
   * `NGX_FORM_FIELD_HINT_RENDERER`. Defaults to `MaterialHintRenderer`.
   */
  readonly hintRenderer?: { readonly component: Type<unknown> };
}

/**
 * Application-level provider that registers the Material feedback renderer
 * for `NGX_FORM_FIELD_ERROR_RENDERER` and a Material-styled hint renderer
 * for `NGX_FORM_FIELD_HINT_RENDERER`.
 *
 * Recommended path for apps that consume the Material reference wrapper —
 * one call at bootstrap registers the defaults (or consumer-supplied
 * overrides) once for the entire app.
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
  const feedbackComponent =
    options?.feedbackRenderer?.component ?? MaterialFeedbackRenderer;
  const hintComponent =
    options?.hintRenderer?.component ?? MaterialHintRenderer;
  return [
    provideFormFieldErrorRenderer({ component: feedbackComponent }),
    provideFormFieldHintRenderer({ component: hintComponent }),
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
  const feedbackComponent =
    options?.feedbackRenderer?.component ?? MaterialFeedbackRenderer;
  const hintComponent =
    options?.hintRenderer?.component ?? MaterialHintRenderer;
  return [
    ...provideFormFieldErrorRendererForComponent({
      component: feedbackComponent,
    }),
    ...provideFormFieldHintRendererForComponent({ component: hintComponent }),
  ];
}
