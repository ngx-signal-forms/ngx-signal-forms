import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { Control, form } from '@angular/forms/signals';
import type { AccessibilityFormModel } from './accessibility-comparison.model';
import { accessibilityValidationSchema } from './accessibility-comparison.validations';

/**
 * Manual Implementation - WITHOUT @ngx-signal-forms/toolkit
 *
 * This demonstrates what you need to write manually for WCAG 2.2 compliance:
 * - Manual ARIA attributes (aria-invalid, aria-describedby)
 * - Manual error visibility logic
 * - Manual touch state tracking
 * - Manual error container IDs
 * - Manual error message rendering
 *
 * 🚨 This is the VERBOSE approach - see toolkit implementation for comparison
 */
@Component({
  selector: 'ngx-accessibility-manual-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Control],
  template: `
    <form (ngSubmit)="handleSubmit()" novalidate class="space-y-6">
      <!-- Email Field - Manual ARIA Implementation -->
      <div class="form-field">
        <label
          for="manual-email"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email Address *
        </label>
        <input
          id="manual-email"
          type="email"
          [control]="signupForm.email"
          (blur)="markFieldAsTouched('email')"
          [attr.aria-invalid]="shouldShowEmailErrors() ? 'true' : null"
          [attr.aria-describedby]="
            shouldShowEmailErrors() ? 'manual-email-error' : null
          "
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="you@example.com"
        />

        @if (shouldShowEmailErrors()) {
          <div
            id="manual-email-error"
            role="alert"
            aria-live="assertive"
            class="mt-2 text-sm text-red-600 dark:text-red-400"
          >
            @for (error of signupForm.email().errors(); track error.kind) {
              <p>{{ error.message }}</p>
            }
          </div>
        }
      </div>

      <!-- Password Field - Manual ARIA Implementation -->
      <div class="form-field">
        <label
          for="manual-password"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Password *
        </label>
        <input
          id="manual-password"
          type="password"
          [control]="signupForm.password"
          (blur)="markFieldAsTouched('password')"
          [attr.aria-invalid]="shouldShowPasswordErrors() ? 'true' : null"
          [attr.aria-describedby]="
            shouldShowPasswordErrors() ? 'manual-password-error' : null
          "
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="At least 8 characters"
        />

        @if (shouldShowPasswordErrors()) {
          <div
            id="manual-password-error"
            role="alert"
            aria-live="assertive"
            class="mt-2 text-sm text-red-600 dark:text-red-400"
          >
            @for (error of signupForm.password().errors(); track error.kind) {
              <p>{{ error.message }}</p>
            }
          </div>
        }
      </div>

      <!-- Confirm Password Field - Manual ARIA Implementation -->
      <div class="form-field">
        <label
          for="manual-confirm-password"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Confirm Password *
        </label>
        <input
          id="manual-confirm-password"
          type="password"
          [control]="signupForm.confirmPassword"
          (blur)="markFieldAsTouched('confirmPassword')"
          [attr.aria-invalid]="
            shouldShowConfirmPasswordErrors() ? 'true' : null
          "
          [attr.aria-describedby]="
            shouldShowConfirmPasswordErrors()
              ? 'manual-confirm-password-error'
              : null
          "
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="Re-enter password"
        />

        @if (shouldShowConfirmPasswordErrors()) {
          <div
            id="manual-confirm-password-error"
            role="alert"
            aria-live="assertive"
            class="mt-2 text-sm text-red-600 dark:text-red-400"
          >
            @for (
              error of signupForm.confirmPassword().errors();
              track error.kind
            ) {
              <p>{{ error.message }}</p>
            }
          </div>
        }
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        [disabled]="signupForm().invalid() || signupForm().pending()"
        class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        Sign Up (Manual Implementation)
      </button>
    </form>

    <!-- Code Stats -->
    <div
      class="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20"
    >
      <h3
        class="mb-2 text-sm font-semibold text-yellow-800 dark:text-yellow-300"
      >
        📊 Manual Implementation Stats
      </h3>
      <ul class="space-y-1 text-xs text-yellow-700 dark:text-yellow-400">
        <li>✍️ <strong>95 lines of template code</strong></li>
        <li>🔧 <strong>Manual ARIA attributes:</strong> 9 bindings</li>
        <li>🐛 <strong>Manual blur handlers:</strong> 3 event listeners</li>
        <li>🧮 <strong>Manual error visibility:</strong> 3 computed signals</li>
        <li>
          🎯 <strong>Manual touch tracking:</strong> Custom state management
        </li>
        <li>
          ⚠️ <strong>Error-prone:</strong> Easy to miss accessibility
          requirements
        </li>
      </ul>
    </div>
  `,
})
export class AccessibilityManualFormComponent {
  readonly #injector = inject(Injector);

  /// Form data signal (single source of truth)
  readonly #formData = signal<AccessibilityFormModel>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  /// Manual touch tracking (required for on-touch error display)
  readonly #touchedFields = signal<Set<keyof AccessibilityFormModel>>(
    new Set(),
  );

  /// Manual submission tracking
  readonly #isSubmitted = signal(false);

  /// Form instance with validation
  protected readonly signupForm = form(
    this.#formData,
    accessibilityValidationSchema,
  );

  /// Manual error visibility logic for email field
  protected readonly shouldShowEmailErrors = computed(() => {
    const field = this.signupForm.email();
    return (
      (this.#touchedFields().has('email') || this.#isSubmitted()) &&
      field.invalid()
    );
  });

  /// Manual error visibility logic for password field
  protected readonly shouldShowPasswordErrors = computed(() => {
    const field = this.signupForm.password();
    return (
      (this.#touchedFields().has('password') || this.#isSubmitted()) &&
      field.invalid()
    );
  });

  /// Manual error visibility logic for confirm password field
  protected readonly shouldShowConfirmPasswordErrors = computed(() => {
    const field = this.signupForm.confirmPassword();
    return (
      (this.#touchedFields().has('confirmPassword') || this.#isSubmitted()) &&
      field.invalid()
    );
  });

  /// Debug effect to show touch state changes
  // eslint-disable-next-line no-unused-private-class-members -- kept as reactive effect
  readonly #debugEffect = effect(
    () => {
      console.log(
        '[Manual] Touched fields:',
        Array.from(this.#touchedFields()),
      );
    },
    { injector: this.#injector },
  );

  /// Manual touch tracking method (must be called on blur)
  protected markFieldAsTouched(field: keyof AccessibilityFormModel): void {
    this.#touchedFields.update((touched) => new Set(touched).add(field));
  }

  /// Form submission handler
  protected handleSubmit(): void {
    this.#isSubmitted.set(true);

    if (this.signupForm().valid()) {
      console.log('[Manual] Form submitted:', this.#formData());
      alert(`✅ Manual form submitted!\nEmail: ${this.#formData().email}`);

      // Reset form
      this.#formData.set({ email: '', password: '', confirmPassword: '' });
      this.#touchedFields.set(new Set());
      this.#isSubmitted.set(false);
    } else {
      console.warn('[Manual] Form invalid - showing all errors');
    }
  }
}
