export * from './floating-label.directive';
export * from './form-field-character-count.component';
export * from './form-field-hint.component';
export * from './form-field.component';

import { NgxFloatingLabelDirective } from './floating-label.directive';
import { NgxSignalFormFieldCharacterCountComponent } from './form-field-character-count.component';
import { NgxSignalFormFieldHintComponent } from './form-field-hint.component';
import { NgxSignalFormFieldComponent } from './form-field.component';

/**
 * Convenience bundle for outlined form field components.
 *
 * Includes all components and directives needed for the outlined
 * Material Design inspired form field layout:
 * - NgxSignalFormFieldComponent - Form field wrapper
 * - NgxFloatingLabelDirective - Outlined layout with floating label
 * - NgxSignalFormFieldHintComponent - Helper text
 * - NgxSignalFormFieldCharacterCountComponent - Character counter
 *
 * @example
 * ```typescript
 * import { NgxOutlinedFormField } from '@ngx-signal-forms/toolkit/form-field';
 *
 * @Component({
 *   imports: [Field, NgxOutlinedFormField],
 *   template: `
 *     <ngx-signal-form-field [field]="form.email" outline>
 *       <label for="email">Email</label>
 *       <input id="email" [field]="form.email" />
 *     </ngx-signal-form-field>
 *   `
 * })
 * ```
 */
export const NgxOutlinedFormField = [
  NgxSignalFormFieldComponent,
  NgxFloatingLabelDirective,
  NgxSignalFormFieldHintComponent,
  NgxSignalFormFieldCharacterCountComponent,
] as const;
