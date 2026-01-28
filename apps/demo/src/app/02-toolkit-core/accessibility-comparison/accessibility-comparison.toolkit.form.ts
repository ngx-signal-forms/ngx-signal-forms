import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField, submit } from '@angular/forms/signals';
import {
  focusFirstInvalid,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxSignalFormFieldWrapperComponent } from '@ngx-signal-forms/toolkit/form-field';
import type { AccessibilityFormModel } from './accessibility-comparison.model';
import { accessibilityValidationSchema } from './accessibility-comparison.validations';

/**
 * Toolkit Implementation - Signup Form Component
 *
 * Clean implementation with automatic accessibility features.
 * Comparison details are documented in the page container.
 */
@Component({
  selector: 'ngx-accessibility-toolkit-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxSignalFormFieldWrapperComponent,
  ],
  template: `
    <form
      #formElement
      [ngxSignalForm]="signupForm"
      (submit)="handleSubmit($event)"
      class="form-container"
    >
      <!-- Email Field - Toolkit Handles Everything -->
      <ngx-signal-form-field-wrapper
        [formField]="signupForm.email"
        fieldName="toolkit-email"
      >
        <label for="toolkit-email" class="form-label"> Email Address * </label>
        <input
          id="toolkit-email"
          type="email"
          [formField]="signupForm.email"
          class="form-input"
          placeholder="you@example.com"
        />
      </ngx-signal-form-field-wrapper>

      <!-- Password Field - Toolkit Handles Everything -->
      <ngx-signal-form-field-wrapper
        [formField]="signupForm.password"
        fieldName="toolkit-password"
      >
        <label for="toolkit-password" class="form-label"> Password * </label>
        <input
          id="toolkit-password"
          type="password"
          [formField]="signupForm.password"
          class="form-input"
          placeholder="At least 8 characters"
        />
      </ngx-signal-form-field-wrapper>

      <!-- Confirm Password Field - Toolkit Handles Everything -->
      <ngx-signal-form-field-wrapper
        [formField]="signupForm.confirmPassword"
        fieldName="toolkit-confirm-password"
      >
        <label for="toolkit-confirm-password" class="form-label">
          Confirm Password *
        </label>
        <input
          id="toolkit-confirm-password"
          type="password"
          [formField]="signupForm.confirmPassword"
          class="form-input"
          placeholder="Re-enter password"
        />
      </ngx-signal-form-field-wrapper>

      <!-- Submit Button -->
      <button
        type="submit"
        aria-live="polite"
        class="btn-primary w-full justify-center bg-green-600 hover:bg-green-700 focus:ring-green-500"
      >
        @if (signupForm().pending()) {
          Subscribing...
        } @else {
          Sign Up
        }
      </button>
    </form>
  `,
})
export class AccessibilityToolkitFormComponent {
  /** Success message announced via role="status" elsewhere on the page */
  protected readonly successMessage = signal<string>('');

  /// Form data signal (single source of truth)
  readonly #model = signal<AccessibilityFormModel>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  /// Form instance with validation
  readonly signupForm = form(this.#model, accessibilityValidationSchema);

  /// Submission handler using Angular Signal Forms submit() helper
  /// Uses focusBoundControl() via focusFirstInvalid() for accessibility
  protected async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();

    /// Focus first invalid field if form is invalid (WCAG 2.2 best practice)
    if (this.signupForm().invalid()) {
      focusFirstInvalid(this.signupForm);
      return;
    }

    await submit(this.signupForm, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.#model.set({ email: '', password: '', confirmPassword: '' });
      this.signupForm().reset();
      return null;
    });
  }
}
