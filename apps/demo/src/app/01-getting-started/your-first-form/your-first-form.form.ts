import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { Control, form } from '@angular/forms/signals';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';
import type { ContactFormModel } from './your-first-form.model';
import { contactFormSchema } from './your-first-form.validations';

/**
 * Your First Form - Contact Form Component
 *
 * A clean contact form demonstrating toolkit integration.
 * Form context and features are documented in the page container.
 */
@Component({
  selector: 'ngx-your-first-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Control, NgxSignalFormToolkit],
  template: `
    <form
      [ngxSignalFormProvider]="contactForm"
      [errorStrategy]="errorDisplayMode()"
      (ngSubmit)="saveForm()"
      novalidate
      class="form-container"
    >
      <!-- Name Field - Manual Layout with Toolkit Error Component -->
      <div class="form-field">
        <label for="contact-name" class="form-label">Name *</label>
        <input
          id="contact-name"
          type="text"
          [control]="contactForm.name"
          class="form-input"
          placeholder="Your name"
        />
        <!-- Toolkit handles ARIA automatically! No manual bindings needed -->
        <ngx-signal-form-error
          [field]="contactForm.name"
          fieldName="contact-name"
        />
      </div>

      <!-- Email Field -->
      <div class="form-field">
        <label for="contact-email" class="form-label">Email *</label>
        <input
          id="contact-email"
          type="email"
          [control]="contactForm.email"
          class="form-input"
          placeholder="you@example.com"
        />
        <ngx-signal-form-error
          [field]="contactForm.email"
          fieldName="contact-email"
        />
      </div>

      <!-- Message Field -->
      <div class="form-field">
        <label for="contact-message" class="form-label">Message *</label>
        <textarea
          id="contact-message"
          rows="4"
          [control]="contactForm.message"
          class="form-input"
          placeholder="Your message (min 10 characters)"
        ></textarea>
        <ngx-signal-form-error
          [field]="contactForm.message"
          fieldName="contact-message"
        />
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="submit"
          [disabled]="contactForm().invalid() || contactForm().pending()"
          class="btn-primary"
        >
          @if (contactForm().pending()) {
            Sending...
          } @else {
            Send Message
          }
        </button>

        <button class="btn-secondary" type="button" (click)="resetForm()">
          Reset
        </button>
      </div>
    </form>
  `,
})
export class YourFirstFormComponent {
  /** Error display mode input */
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  /** Form data model */
  readonly #formData = signal<ContactFormModel>({
    name: '',
    email: '',
    message: '',
  });

  /** Create form with validation schema */
  readonly contactForm = form(this.#formData, contactFormSchema);

  /**
   * Form submission handler
   * Validates form and processes submission
   */
  protected saveForm(): void {
    if (this.contactForm().valid()) {
      console.log('✅ Form submitted:', this.#formData());
      // Reset form after successful submission
      this.#formData.set({ name: '', email: '', message: '' });
    } else {
      console.log('❌ Form is invalid');
    }
  }

  protected resetForm(): void {
    this.#formData.set({ name: '', email: '', message: '' });
  }
}
