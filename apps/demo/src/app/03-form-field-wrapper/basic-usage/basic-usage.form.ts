import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import {
  basicUsageSchema,
  type BasicUsageModel,
} from './basic-usage.validations';

/**
 * Basic Usage - Demonstrates NgxSignalFormFieldComponent
 *
 * This example showcases the NgxSignalFormFieldComponent wrapper which combines:
 * - **Automatic Error Display**: No need to manually add `<ngx-signal-form-error>`
 * - **Consistent Layout**: Standardized spacing via CSS custom properties
 * - **Accessibility**: Proper structure with semantic HTML
 * - **Multiple Field Types**: Works with all form controls
 *
 * 🎯 Key Features Demonstrated:
 * - NgxSignalFormFieldComponent wrapper for cleaner markup
 * - Automatic error display (no manual error components needed)
 * - Various input types (text, email, url, number, textarea, select, checkbox)
 * - Consistent spacing and layout
 * - Error display mode integration
 *
 * 📚 Compare with getting-started to see the difference:
 * - Getting Started: Manual error display with `<ngx-signal-form-error>`
 * - Basic Usage: Automatic error display via wrapper
 *
 * @example
 * ```html
 * <ngx-basic-usage [errorDisplayMode]="on-touch" />
 * ```
 */
@Component({
  selector: 'ngx-basic-usage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormFieldComponent],
  templateUrl: './basic-usage.html',
})
export class BasicUsageComponent {
  /**
   * Error display mode input - controls when errors are shown
   */
  errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  /**
   * Form model signal with default values
   */
  protected readonly model = signal<BasicUsageModel>({
    name: '',
    email: '',
    website: '',
    age: 0,
    bio: '',
    country: '',
    agreeToTerms: false,
  });

  /**
   * Create form instance with validation schema and error strategy
   * Exposed as public for debugger access
   */
  readonly showcaseForm = form(this.model, basicUsageSchema);

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
    { value: 'FR', label: 'France' },
    { value: 'JP', label: 'Japan' },
    { value: 'NL', label: 'Netherlands' },
  ];

  /**
   * Form submission handler
   */
  protected displaySubmittedData(event: Event): void {
    event.preventDefault();
    // Form validation is handled by the submit button's disabled state
  }

  /**
   * Reset form to initial values
   */
  protected resetForm(): void {
    this.model.set({
      name: '',
      email: '',
      website: '',
      age: 0,
      bio: '',
      country: '',
      agreeToTerms: false,
    });
  }
}
