/**
 * @file Styled assistive components for form fields.
 *
 * These components provide visual feedback and supplementary information
 * for form fields, including hints, character counts, errors, warnings,
 * and layout containers.
 *
 * Architecture:
 * - Uses headless primitives from `@ngx-signal-forms/toolkit/headless`
 * - Provides styled, ready-to-use components
 * - Can be used standalone or with `@ngx-signal-forms/toolkit/form-field`
 *
 * @example
 * ```html
 * <ngx-signal-form-field-assistive-row>
 *   <ngx-signal-form-field-hint>Format: 123-456-7890</ngx-signal-form-field-hint>
 *   <ngx-signal-form-field-character-count [formField]="form.phone" [maxLength]="14" />
 * </ngx-signal-form-field-assistive-row>
 *
 * <ngx-form-field-error [formField]="form.email" fieldName="email" />
 * ```
 */

export { NgxFormFieldAssistiveRowComponent } from './assistive-row.component';
export { NgxFormFieldCharacterCountComponent } from './character-count.component';
export {
  NgxFormFieldErrorComponent,
  type NgxFormFieldErrorListStyle,
} from './form-field-error.component';
export { NgxFormFieldErrorSummaryComponent } from './form-field-error-summary.component';
export { NgxFormFieldHintComponent } from './hint.component';
export { isBlockingError, isWarningError, warningError } from './warning-error';
