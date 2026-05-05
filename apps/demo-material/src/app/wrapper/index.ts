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
  NgxMatFeedbackOutlet,
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
 * Material reference registers `MaterialFeedbackRenderer` for the error slot
 * and `MaterialHintRenderer` for the hint slot.
 *
 * The two slots use distinct default renderers because the error renderer's
 * input contract (`{ message, severity }`) is wired by the slot directives
 * (`*ngxMatErrorSlot` / `*ngxMatFeedback`), whereas the hint renderer's input
 * contract (`{ resolvedFieldName, resolvedId, position }`) is supplied by
 * `<ngx-form-field-hint>` when consumers project it into the form-field.
 */
export interface NgxMatFormsProviderOptions {
  /**
   * Override the renderer instantiated inside `<mat-error>` slots and the
   * error/warning blocks of `*ngxMatFeedback`.
   */
  readonly feedbackRenderer?: { readonly component: Type<unknown> };
  /**
   * Override the renderer dispatched by `<ngx-form-field-hint>` via
   * `NGX_FORM_FIELD_HINT_RENDERER` when consumers project the toolkit's hint
   * component into a `<mat-form-field>`.
   */
  readonly hintRenderer?: { readonly component: Type<unknown> };
}

/**
 * Application-level provider that registers the Material renderers for the
 * toolkit's feedback and hint slots: `MaterialFeedbackRenderer` for
 * `NGX_FORM_FIELD_ERROR_RENDERER` and `MaterialHintRenderer` for
 * `NGX_FORM_FIELD_HINT_RENDERER`. The two slots get distinct renderers
 * because the feedback renderer requires `message` + `severity` inputs that
 * the hint dispatch can't supply.
 *
 * Recommended path for apps that consume the Material reference wrapper —
 * one call at bootstrap registers both defaults (or consumer-supplied
 * overrides via `feedbackRenderer` / `hintRenderer`) once for the entire app.
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
  const errorComponent =
    options?.feedbackRenderer?.component ?? MaterialFeedbackRenderer;
  const hintComponent =
    options?.hintRenderer?.component ?? MaterialHintRenderer;
  return [
    provideFormFieldErrorRenderer({ component: errorComponent }),
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
  const errorComponent =
    options?.feedbackRenderer?.component ?? MaterialFeedbackRenderer;
  const hintComponent =
    options?.hintRenderer?.component ?? MaterialHintRenderer;
  return [
    ...provideFormFieldErrorRendererForComponent({ component: errorComponent }),
    ...provideFormFieldHintRendererForComponent({ component: hintComponent }),
  ];
}
