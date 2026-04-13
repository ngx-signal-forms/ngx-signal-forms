import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import {
  createOnInvalidHandler,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
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
  imports: [FormField, NgxSignalFormToolkit, NgxFormFieldErrorComponent],
  template: `
    <form
      [formRoot]="contactForm"
      ngxSignalForm
      [errorStrategy]="errorDisplayMode()"
      class="form-container"
    >
      <!-- Name Field - Manual Layout with Toolkit Error Component -->
      <div class="form-field">
        <label for="contact-name" class="form-label">Name *</label>
        <input
          id="contact-name"
          type="text"
          [formField]="contactForm.name"
          class="form-input"
          placeholder="Your name"

        />
        <!-- Toolkit handles ARIA automatically! No manual bindings needed -->
        <ngx-form-field-error
          [formField]="contactForm.name"
          fieldName="contact-name"
        />
      </div>

      <!-- Email Field -->
      <div class="form-field">
        <label for="contact-email" class="form-label">Email *</label>
        <input
          id="contact-email"
          type="email"
          [formField]="contactForm.email"
          class="form-input"
          placeholder="you@example.com"

        />
        <ngx-form-field-error
          [formField]="contactForm.email"
          fieldName="contact-email"
        />
      </div>

      <!-- Message Field -->
      <div class="form-field">
        <label for="contact-message" class="form-label">Message *</label>
        <textarea
          id="contact-message"
          rows="4"
          [formField]="contactForm.message"
          class="form-input"
          placeholder="Your message (min 10 characters)"

        ></textarea>
        <ngx-form-field-error
          [formField]="contactForm.message"
          fieldName="contact-message"
        />
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="submit" class="btn-primary">
          @if (contactForm().submitting()) {
            Sending...
          } @else {
            Send Message
          }
        </button>

        <button
          class="btn-secondary"
          type="button"
          (click)="resetForm()"
        >
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
  readonly #model = signal({
    name: '',
    email: '',
    message: '',
  });

  /** Create form with validation schema and declarative submission */
  readonly contactForm = form(this.#model, contactFormSchema, {
    submission: {
      action: async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 1500);
        });
        this.#model.set({ name: '', email: '', message: '' });
        this.contactForm().reset();
      },
      onInvalid: createOnInvalidHandler(),
    },
  });

  protected resetForm(): void {
    this.#model.set({ name: '', email: '', message: '' });
    this.contactForm().reset();
  }
}
