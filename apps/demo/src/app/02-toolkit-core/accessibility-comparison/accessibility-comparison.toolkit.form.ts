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
      [errorStrategy]="'on-touch'"
      (ngSubmit)="(submitHandler)"
      novalidate
      class="space-y-6"
    >
      <!-- Email Field - Toolkit Handles Everything -->
      <ngx-signal-form-field
        [field]="signupForm.email"
        fieldName="toolkit-email"
      >
        <label
          for="toolkit-email"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email Address *
        </label>
        <input
          id="toolkit-email"
          type="email"
          [field]="signupForm.email"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="you@example.com"
        />
      </ngx-signal-form-field>

      <!-- Password Field - Toolkit Handles Everything -->
      <ngx-signal-form-field
        [field]="signupForm.password"
        fieldName="toolkit-password"
      >
        <label
          for="toolkit-password"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Password *
        </label>
        <input
          id="toolkit-password"
          type="password"
          [field]="signupForm.password"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="At least 8 characters"
        />
      </ngx-signal-form-field>

      <!-- Confirm Password Field - Toolkit Handles Everything -->
      <ngx-signal-form-field
        [field]="signupForm.confirmPassword"
        fieldName="toolkit-confirm-password"
      >
        <label
          for="toolkit-confirm-password"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Confirm Password *
        </label>
        <input
          id="toolkit-confirm-password"
          type="password"
          [field]="signupForm.confirmPassword"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="Re-enter password"
        />
      </ngx-signal-form-field>

      <!-- Submit Button -->
      <button
        type="submit"
        aria-live="polite"
        class="flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
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
