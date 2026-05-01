import { provideFormFieldErrorRendererForComponent } from '@ngx-signal-forms/toolkit';
import { MaterialFeedbackRenderer } from './material-error-renderer';

export { MatCheckboxFeedback } from './mat-checkbox-feedback';
export {
  MatFormFieldBundle,
  MatFormFieldWrapper,
} from './mat-form-field-wrapper';
export { MaterialFeedbackRenderer } from './material-error-renderer';

/**
 * Component-scoped provider that registers the Material feedback renderer
 * for the toolkit's `NGX_FORM_FIELD_ERROR_RENDERER` token.
 *
 * Drop this in any component that hosts a `<ngx-mat-form-field>` and the
 * wrapper will render `<mat-error>` / `<mat-hint>` content through this
 * Material-styled renderer instead of the toolkit's default
 * `NgxFormFieldError`.
 */
export function provideMaterialFeedbackRenderer() {
  return provideFormFieldErrorRendererForComponent({
    component: MaterialFeedbackRenderer,
  });
}
