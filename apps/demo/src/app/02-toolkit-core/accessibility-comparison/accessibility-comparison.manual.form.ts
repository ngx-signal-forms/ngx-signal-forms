import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { Field, form, submit } from '@angular/forms/signals';
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
  imports: [Field],
  template: `
    <form (ngSubmit)="(handleSubmit)" novalidate class="form-container">
      <!-- Email Field - Manual ARIA Implementation -->
      <div class="form-field">
        <label for="manual-email" class="form-label"> Email Address * </label>
        <input
          id="manual-email"
          type="email"
          [field]="signupForm.email"
          (blur)="markFieldAsTouched('email')"
          [attr.aria-invalid]="shouldShowEmailErrors() ? 'true' : null"
          [attr.aria-describedby]="
            shouldShowEmailErrors() ? 'manual-email-error' : null
          "
          class="form-input"
          placeholder="you@example.com"
        />

        @if (shouldShowEmailErrors()) {
          <div
            id="manual-email-error"
            role="alert"
            aria-live="assertive"
            class="form-error"
          >
            @for (error of signupForm.email().errors(); track error.kind) {
              <p>{{ error.message }}</p>
            }
          </div>
        }
      </div>

      <!-- Password Field - Manual ARIA Implementation -->
      <div class="form-field">
        <label for="manual-password" class="form-label"> Password * </label>
        <input
          id="manual-password"
          type="password"
          [field]="signupForm.password"
          (blur)="markFieldAsTouched('password')"
          [attr.aria-invalid]="shouldShowPasswordErrors() ? 'true' : null"
          [attr.aria-describedby]="
            shouldShowPasswordErrors() ? 'manual-password-error' : null
          "
          class="form-input"
          placeholder="At least 8 characters"
        />

        @if (shouldShowPasswordErrors()) {
          <div
            id="manual-password-error"
            role="alert"
            aria-live="assertive"
            class="form-error"
          >
            @for (error of signupForm.password().errors(); track error.kind) {
              <p>{{ error.message }}</p>
            }
          </div>
        }
      </div>

      <!-- Confirm Password Field - Manual ARIA Implementation -->
      <div class="form-field">
        <label for="manual-confirm-password" class="form-label">
          Confirm Password *
        </label>
        <input
          id="manual-confirm-password"
          type="password"
          [field]="signupForm.confirmPassword"
          (blur)="markFieldAsTouched('confirmPassword')"
          [attr.aria-invalid]="
            shouldShowConfirmPasswordErrors() ? 'true' : null
          "
          [attr.aria-describedby]="
            shouldShowConfirmPasswordErrors()
              ? 'manual-confirm-password-error'
              : null
          "
          class="form-input"
          placeholder="Re-enter password"
        />

        @if (shouldShowConfirmPasswordErrors()) {
          <div
            id="manual-confirm-password-error"
            role="alert"
            aria-live="assertive"
            class="form-error"
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
      <button type="submit" aria-live="polite" class="btn-primary w-full">
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

  /// Manual touch tracking method (must be called on blur)
  protected markFieldAsTouched(field: keyof AccessibilityFormModel): void {
    this.#touchedFields.update((touched) => new Set(touched).add(field));
  }

  /**
   * Form submission handler using Angular Signal Forms submit() helper.
   * ACCESSIBILITY: Button never disabled (best practice).
   */
  protected readonly handleSubmit = submit(
    this.signupForm,
    async (formData) => {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reset form
      this.#formData.set({ email: '', password: '', confirmPassword: '' });
      this.#touchedFields.set(new Set());
      this.#isSubmitted.set(false);

      return null;
    },
  );
}
