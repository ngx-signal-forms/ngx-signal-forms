import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, form, submit } from '@angular/forms/signals';
import {
  focusFirstInvalid,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
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
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormFieldComponent],
  template: `
    <form
      #formElement
      [ngxSignalForm]="signupForm"
      (submit)="handleSubmit($event)"
      class="form-container"
    >
      <!-- Email Field - Toolkit Handles Everything -->
      <ngx-signal-form-field
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
      </ngx-signal-form-field>

      <!-- Password Field - Toolkit Handles Everything -->
      <ngx-signal-form-field
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
      </ngx-signal-form-field>

      <!-- Confirm Password Field - Toolkit Handles Everything -->
      <ngx-signal-form-field
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
      </ngx-signal-form-field>

      <!-- Submit Button -->
      <button
        type="submit"
        aria-live="polite"
        class="btn-primary w-full justify-center bg-green-600 hover:bg-green-700 focus:ring-green-500"
      >
        Sign Up
      </button>
    </form>
  `,
})
export class AccessibilityToolkitFormComponent {
  /** Success message announced via role="status" elsewhere on the page */
  protected readonly successMessage = signal<string>('');

  /// Form data signal (single source of truth)
  readonly #formData = signal<AccessibilityFormModel>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  /// Form instance with validation
  readonly signupForm = form(this.#formData, accessibilityValidationSchema);

  /// Submission handler using Angular Signal Forms submit() helper
  /// Uses focusBoundControl() via focusFirstInvalid() for accessibility
  protected handleSubmit(event: Event): void {
    event.preventDefault();

    /// Focus first invalid field if form is invalid (WCAG 2.2 best practice)
    if (this.signupForm().invalid()) {
      focusFirstInvalid(this.signupForm);
      return;
    }

    submit(this.signupForm, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.#formData.set({ email: '', password: '', confirmPassword: '' });
      this.signupForm().reset();
      return null;
    });
  }
}
