// Core form field components
export * from './form-field-wrapper';
export * from './form-fieldset';

// Re-export the shared placement type from core so consumers importing from
// `@ngx-signal-forms/toolkit/form-field` keep resolving it after the type
// moved to the core barrel during v1 hardening.
export type { NgxFormFieldErrorPlacement } from '@ngx-signal-forms/toolkit';

import { NgxSignalFormAutoAria } from '@ngx-signal-forms/toolkit';
import {
  NgxFormFieldCharacterCount,
  NgxFormFieldError,
  NgxFormFieldHint,
} from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormFieldWrapper } from './form-field-wrapper';
import { NgxFormFieldset } from './form-fieldset';

/**
 * Convenience bundle for the basic form field wrapper.
 *
 * Includes `NgxSignalFormAutoAria` so projected hints, errors, and
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
 *     <ngx-form-field-wrapper [formField]="form.email">
 *       <label for="email">Email</label>
 *       <input id="email" [formField]="form.email" />
 *       <ngx-form-field-hint>
 *         Enter your email address
 *       </ngx-form-field-hint>
 *     </ngx-form-field-wrapper>
 *   `
 * })
 * ```
 */
export const NgxFormField = [
  NgxSignalFormAutoAria,
  NgxFormFieldWrapper,
  NgxFormFieldHint,
  NgxFormFieldCharacterCount,
  NgxFormFieldError,
  NgxFormFieldset,
] as const;
