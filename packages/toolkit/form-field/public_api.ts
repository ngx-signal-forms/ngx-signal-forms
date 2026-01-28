export * from './floating-label.directive';
export * from './form-field-character-count.component';
export * from './form-field-hint.component';
export * from './form-field-wrapper.component';
export * from './form-fieldset.component';

import { NgxFloatingLabelDirective } from './floating-label.directive';
import { NgxSignalFormFieldCharacterCountComponent } from './form-field-character-count.component';
import { NgxSignalFormFieldHintComponent } from './form-field-hint.component';
import { NgxSignalFormFieldWrapperComponent } from './form-field-wrapper.component';
import { NgxSignalFormFieldset } from './form-fieldset.component';

/**
 * Convenience bundle for outlined form field components.
 *
 * Includes all components and directives needed for the outlined
 * Material Design inspired form field layout:
 * - NgxSignalFormFieldWrapperComponent - Form field wrapper
 * - NgxFloatingLabelDirective - Outlined layout with floating label
 * - NgxSignalFormFieldHintComponent - Helper text
 * - NgxSignalFormFieldCharacterCountComponent - Character counter
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
 *       <input id="email" [formField]="form.email" />
 *     </ngx-signal-form-field-wrapper>
 *   `
 * })
 * ```
 */
export const NgxOutlinedFormField = [
  NgxSignalFormFieldWrapperComponent,
  NgxFloatingLabelDirective,
  NgxSignalFormFieldHintComponent,
  NgxSignalFormFieldCharacterCountComponent,
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
 *     </ngx-signal-form-field-wrapper>
 *   `
 * })
 * ```
 */
export const NgxFormField = [
  NgxSignalFormFieldWrapperComponent,
  NgxSignalFormFieldHintComponent,
  NgxSignalFormFieldCharacterCountComponent,
  NgxSignalFormFieldset,
] as const;
