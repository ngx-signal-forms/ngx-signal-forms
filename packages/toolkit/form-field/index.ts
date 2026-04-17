// Core form field components
export * from './form-field-wrapper.component';
export * from './form-fieldset.component';

import { NgxSignalFormAutoAriaDirective } from '@ngx-signal-forms/toolkit';
import {
  NgxFormFieldAssistiveRowComponent,
  NgxFormFieldCharacterCountComponent,
  NgxFormFieldErrorComponent,
  NgxFormFieldHintComponent,
} from '@ngx-signal-forms/toolkit/assistive';
import { NgxSignalFormFieldWrapperComponent } from './form-field-wrapper.component';
import { NgxSignalFormFieldset } from './form-fieldset.component';

/**
 * Convenience bundle for the basic form field wrapper.
 *
 * Includes `NgxSignalFormAutoAriaDirective` so projected hints, errors, and
 * character counts are automatically linked to the input via
 * `aria-describedby` even when consumers don't separately import
 * `NgxSignalFormToolkit`. The directive is idempotent — importing it twice
 * (e.g. via both bundles) is safe.
 *
 * @example
 * ```typescript
 * import { FormField } from '@angular/forms/signals';
 * import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
 *
 * @Component({
 *   imports: [FormField, NgxFormField],
 *   template: `
 *     <ngx-signal-form-field-wrapper [formField]="form.email">
 *       <label for="email">Email</label>
 *       <input id="email" [formField]="form.email" />
 *       <ngx-signal-form-field-hint>
 *         Enter your email address
 *       </ngx-signal-form-field-hint>
 *     </ngx-signal-form-field-wrapper>
 *   `
 * })
 * ```
 */
export const NgxFormField = [
  NgxSignalFormAutoAriaDirective,
  NgxSignalFormFieldWrapperComponent,
  NgxFormFieldHintComponent,
  NgxFormFieldCharacterCountComponent,
  NgxFormFieldAssistiveRowComponent,
  NgxFormFieldErrorComponent,
  NgxSignalFormFieldset,
] as const;
