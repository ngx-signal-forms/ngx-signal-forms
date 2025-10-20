import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { Field, form, submit } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';
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
  imports: [Field, NgxSignalFormToolkit, NgxSignalFormFieldComponent],
  template: `
    <form
      [ngxSignalFormProvider]="signupForm"
      (ngSubmit)="(submitHandler)"
      novalidate
      class="form-container"
    >
      <!-- Email Field - Toolkit Handles Everything -->
      <ngx-signal-form-field
        [field]="signupForm.email"
        fieldName="toolkit-email"
      >
        <label for="toolkit-email" class="form-label"> Email Address * </label>
        <input
          id="toolkit-email"
          type="email"
          [field]="signupForm.email"
          class="form-input"
          placeholder="you@example.com"
        />
      </ngx-signal-form-field>

      <!-- Password Field - Toolkit Handles Everything -->
      <ngx-signal-form-field
        [field]="signupForm.password"
        fieldName="toolkit-password"
      >
        <label for="toolkit-password" class="form-label"> Password * </label>
        <input
          id="toolkit-password"
          type="password"
          [field]="signupForm.password"
          class="form-input"
          placeholder="At least 8 characters"
        />
      </ngx-signal-form-field>

      <!-- Confirm Password Field - Toolkit Handles Everything -->
      <ngx-signal-form-field
        [field]="signupForm.confirmPassword"
        fieldName="toolkit-confirm-password"
      >
        <label for="toolkit-confirm-password" class="form-label">
          Confirm Password *
        </label>
        <input
          id="toolkit-confirm-password"
          type="password"
          [field]="signupForm.confirmPassword"
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
  readonly #injector = inject(Injector);

  /// Form data signal (single source of truth)
  readonly #formData = signal<AccessibilityFormModel>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  /// Form instance with validation
  readonly signupForm = form(this.#formData, accessibilityValidationSchema);

  /// Submission handler using Angular Signal Forms submit() helper
  protected readonly submitHandler = submit(
    this.signupForm,
    async (formData) => {
      alert(`✅ Toolkit form submitted!\nEmail: ${formData().value().email}`);

      // Reset form
      this.#formData.set({ email: '', password: '', confirmPassword: '' });

      return null; // No server errors
    },
  );

  /// Debug effect to show form state changes
  // eslint-disable-next-line no-unused-private-class-members -- kept as reactive effect
  readonly #debugEffect = effect(
    () => {
      const valid = this.signupForm().valid();
      console.log('[Toolkit] Form valid:', valid);
    },
    { injector: this.#injector },
  );
}
