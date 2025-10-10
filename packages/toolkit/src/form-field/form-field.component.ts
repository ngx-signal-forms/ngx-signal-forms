import { Component } from '@angular/core';

/**
 * Form field wrapper component.
 * Provides consistent layout and automatic error display.
 *
 * @example
 * ```html
 * <sft-form-field [field]="form.email">
 *   <label for="email">Email</label>
 *   <input id="email" [control]="form.email" />
 * </sft-form-field>
 * ```
 */
@Component({
  selector: 'sft-form-field',
  standalone: true,
  template: `
    <div class="sft-form-field">
      <div class="sft-form-field__content">
        <ng-content />
      </div>
      <!-- Error display will be added here in future iterations -->
    </div>
  `,
  styles: `
    .sft-form-field {
      display: flex;
      flex-direction: column;
      gap: var(--sft-form-field-gap, 0.5rem);
      margin-bottom: var(--sft-form-field-margin, 1rem);
    }
  `,
})
export class SftFormFieldComponent {
  // Field input will be added in future iterations
  // field = input<FieldState<any>>();
}
