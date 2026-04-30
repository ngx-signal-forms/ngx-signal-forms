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
 * <ngx-form-field-hint>Format: 123-456-7890</ngx-form-field-hint>
 * <ngx-form-field-character-count [formField]="form.phone" [maxLength]="14" />
 * <ngx-form-field-error [formField]="form.email" fieldName="email" />
 * ```
 */

export { NgxFormFieldCharacterCount } from './character-count';
export {
  NgxFormFieldError,
  type NgxFormFieldListStyle,
  type NgxFormFieldErrorListStyle,
} from './form-field-error';
export {
  NgxFormFieldNotification,
  type NgxFormFieldNotificationListStyle,
  type NgxFormFieldNotificationTone,
} from './form-field-notification';
export { NgxFormFieldErrorSummary } from './form-field-error-summary';
export { NgxFormFieldHint } from './hint';
export { isBlockingError, isWarningError, warningError } from './warning-error';
