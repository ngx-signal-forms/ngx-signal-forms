import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormField, form, submit } from '@angular/forms/signals';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
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
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormErrorComponent],
  template: `
    <form
      [ngxSignalForm]="contactForm"
      [errorStrategy]="errorDisplayMode"
      (submit)="sendMessage($event)"
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
        <ngx-signal-form-error
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
        <ngx-signal-form-error
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
        <ngx-signal-form-error
          [formField]="contactForm.message"
          fieldName="contact-message"
        />
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="submit" class="btn-primary">
          @if (contactForm().pending()) {
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
  readonly #model = signal<ContactFormModel>({
    name: '',
    email: '',
    message: '',
  });

  /** Create form with validation schema */
  readonly contactForm = form(this.#model, contactFormSchema);

  /**
   * Form submission handler using Angular Signal Forms submit() helper.
   *
   * The submit() helper automatically:
   * - Marks all fields as touched (shows validation errors)
   * - Tracks submission state (submitting → submitted)
   * - Only executes callback when form is VALID
   * - Provides server error handling
   *
   * Button is NEVER disabled (accessibility best practice).
   */
  protected async sendMessage(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.contactForm, async () => {
      // Simulate async operation (e.g., API call)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Reset form after successful submission
      this.#model.set({ name: '', email: '', message: '' });
      this.contactForm().reset();

      return null;
    });
  }

  protected resetForm(): void {
    this.#model.set({ name: '', email: '', message: '' });
    this.contactForm().reset();
  }
}
