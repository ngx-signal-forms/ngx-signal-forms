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
 * <ngx-form-field-assistive-row>
 *   <ngx-form-field-hint>Format: 123-456-7890</ngx-form-field-hint>
 *   <ngx-form-field-character-count [formField]="form.phone" [maxLength]="14" />
 * </ngx-form-field-assistive-row>
 *
 * <ngx-form-field-error [formField]="form.email" fieldName="email" />
 * ```
 */

export { NgxFormFieldAssistiveRow } from './assistive-row';
export { NgxFormFieldCharacterCount } from './character-count';
export {
  NgxFormFieldError,
  type NgxFormFieldErrorListStyle,
} from './form-field-error';
export { NgxFormFieldErrorSummary } from './form-field-error-summary';
export { NgxFormFieldHint } from './hint';
export { isBlockingError, isWarningError, warningError } from './warning-error';
