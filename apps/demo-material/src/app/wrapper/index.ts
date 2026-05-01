import {
  provideFormFieldErrorRendererForComponent,
  provideFormFieldHintRendererForComponent,
} from '@ngx-signal-forms/toolkit';
import { MaterialFeedbackRenderer } from './material-error-renderer';

export { MatCheckboxFeedback } from './mat-checkbox-feedback';
export {
  MatFormFieldBundle,
  MatFormFieldWrapper,
} from './mat-form-field-wrapper';
export { MaterialFeedbackRenderer } from './material-error-renderer';

/**
 * Component-scoped provider that registers the Material feedback renderer
 * for both the `NGX_FORM_FIELD_ERROR_RENDERER` and
 * `NGX_FORM_FIELD_HINT_RENDERER` tokens.
 *
 * Drop this in any component that hosts a `<mat-form-field ngxMatFormField>`
 * and:
 *
 * - The wrapper instantiates `MaterialFeedbackRenderer` inside `<mat-error>`
 *   (slot=`'error'`) and `<mat-hint>` (slot=`'warning'`) for blocking
 *   errors and warnings.
 * - Any descendant component that consults `NGX_FORM_FIELD_HINT_RENDERER`
 *   (e.g. a different wrapper deeper in the tree, or a test) sees the same
 *   Material renderer rather than the toolkit's default `NgxFormFieldHint`.
 *
 * The Material wrapper itself reads `NGX_FORM_FIELD_ERROR_RENDERER` for the
 * outlet binding; the hint-renderer provider is wired so the README claim
 * (and the toolkit's renderer-token contract) holds end-to-end.
 */
export function provideMaterialFeedbackRenderer() {
  return [
    ...provideFormFieldErrorRendererForComponent({
      component: MaterialFeedbackRenderer,
    }),
    ...provideFormFieldHintRendererForComponent({
      component: MaterialFeedbackRenderer,
    }),
  ];
}
