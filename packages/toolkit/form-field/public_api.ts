// Re-export assistive components from the assistive directory
export {
  isBlockingError,
  isWarningError,
  NgxFormFieldAssistiveRowComponent,
  NgxFormFieldCharacterCountComponent,
  NgxFormFieldHintComponent,
  NgxSignalFormErrorComponent,
  warningError,
} from '@ngx-signal-forms/toolkit/assistive';

// Core form field components
export * from './floating-label.directive';
export * from './form-field-wrapper.component';
export * from './form-fieldset.component';

import {
  NgxFormFieldAssistiveRowComponent,
  NgxFormFieldCharacterCountComponent,
  NgxFormFieldHintComponent,
  NgxSignalFormErrorComponent,
} from '@ngx-signal-forms/toolkit/assistive';
import { NgxFloatingLabelDirective } from './floating-label.directive';
import { NgxSignalFormFieldWrapperComponent } from './form-field-wrapper.component';
import { NgxSignalFormFieldset } from './form-fieldset.component';

/**
 * Convenience bundle for outlined form field components.
 *
 * Includes all components and directives needed for the outlined
 * Material Design inspired form field layout:
 * - NgxSignalFormFieldWrapperComponent - Form field wrapper
 * - NgxFloatingLabelDirective - Outlined layout with floating label
 * - NgxFormFieldHintComponent - Helper text
 * - NgxFormFieldCharacterCountComponent - Character counter
 * - NgxFormFieldAssistiveRowComponent - Assistive content row
 * - NgxSignalFormErrorComponent - Error and warning display
 *
 * @example
 * ```typescript
 * import { NgxOutlinedFormField } from '@ngx-signal-forms/toolkit/form-field';
 *
 * @Component({
 *   imports: [FormField, NgxOutlinedFormField],
 *   template: `
 *     <ngx-signal-form-field-wrapper [formField]="form.email" outline>
 *       <label for="email">Email</label>
 *       <input id="email" [formField]="form.email" placeholder="you@example.com" />
 *       <ngx-form-field-hint>We'll never share your email</ngx-form-field-hint>
 *       <ngx-form-field-character-count [formField]="form.email" [maxLength]="100" />
 *     </ngx-signal-form-field-wrapper>
 *   `
 * })
 * ```
 */
export const NgxOutlinedFormField = [
  NgxSignalFormFieldWrapperComponent,
  NgxFloatingLabelDirective,
  NgxFormFieldHintComponent,
  NgxFormFieldCharacterCountComponent,
  NgxFormFieldAssistiveRowComponent,
  NgxSignalFormErrorComponent,
  NgxSignalFormFieldset,
] as const;

/**
 * Convenience bundle for the basic form field wrapper.
 *
 * @example
 * ```typescript
 * import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
 *
 * @Component({
 *   imports: [FormField, NgxFormField],
 *   template: `
 *     <ngx-signal-form-field-wrapper [formField]="form.email">
 *       <label for="email">Email</label>
 *       <input id="email" [formField]="form.email" />
 *       <ngx-form-field-hint>Enter your email address</ngx-form-field-hint>
 *     </ngx-signal-form-field-wrapper>
 *   `
 * })
 * ```
 */
export const NgxFormField = [
  NgxSignalFormFieldWrapperComponent,
  NgxFormFieldHintComponent,
  NgxFormFieldCharacterCountComponent,
  NgxFormFieldAssistiveRowComponent,
  NgxSignalFormErrorComponent,
  NgxSignalFormFieldset,
] as const;
