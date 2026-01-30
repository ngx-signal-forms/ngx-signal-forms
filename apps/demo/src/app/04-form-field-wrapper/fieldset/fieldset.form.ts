import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormField, form, submit } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

import type { FieldsetDemoModel } from './fieldset.model';
import { fieldsetDemoSchema } from './fieldset.validations';

/**
 * Fieldset Demo - Demonstrates NgxSignalFormFieldset
 *
 * This example showcases how to group related form fields and display
 * aggregated validation errors using the NgxSignalFormFieldset.
 *
 * 🎯 Key Features Demonstrated:
 * - Grouped address fields with shared validation display
 * - Error aggregation across multiple fields
 * - Deduplication of repeated error messages
 * - Cross-field validation (passwords must match)
 * - Conditional fieldset visibility (billing same as shipping)
 * - WCAG 2.2 compliant accessibility
 *
 * 📚 When to use NgxSignalFormFieldset:
 * - Grouping logically related fields (addresses, password groups)
 * - Showing aggregated errors at the group level
 * - Reducing visual clutter with many field-level errors
 *
 * @example
 * ```html
 * <ngx-fieldset-form [errorDisplayMode]="'on-touch'" />
 * ```
 */
@Component({
  selector: 'ngx-fieldset-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  templateUrl: './fieldset.form.html',
  styles: `
    /* Spacing between fieldsets */
    fieldset + fieldset {
      margin-top: 2rem;
    }
  `,
})
export class FieldsetFormComponent {
  /**
   * Error display mode input - controls when errors are shown
   */
  errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  /**
   * Initial empty address template
   */
  readonly #emptyAddress = {
    street: '',
    city: '',
    zipCode: '',
    country: '',
  };

  /**
   * Form model signal with default values
   */
  readonly #model = signal<FieldsetDemoModel>({
    shippingAddress: { ...this.#emptyAddress },
    billingAddress: { ...this.#emptyAddress },
    credentials: {
      password: '',
      confirmPassword: '',
    },
    delivery: {
      method: '',
    },
    billingSameAsShipping: true,
  });

  /**
   * Create form instance with validation schema
   * Exposed as public for debugger access
   */
  readonly fieldsetForm = form(this.#model, fieldsetDemoSchema);

  /**
   * Available countries for dropdown
   */
  protected readonly countries = [
    { value: '', label: 'Select a country' },
    { value: 'US', label: 'United States' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'NL', label: 'Netherlands' },
  ];

  /**
   * Form submission handler
   */
  protected saveData(event: Event): void {
    event.preventDefault();
    submit(this.fieldsetForm, async () => {
      console.log('Fieldset form submitted:', this.#model());
      return null;
    });
  }

  /**
   * Reset form to initial values
   */
  protected resetForm(): void {
    this.fieldsetForm().reset();
    this.#model.set({
      shippingAddress: { ...this.#emptyAddress },
      billingAddress: { ...this.#emptyAddress },
      credentials: {
        password: '',
        confirmPassword: '',
      },
      delivery: {
        method: '',
      },
      billingSameAsShipping: true,
    });
  }
}
