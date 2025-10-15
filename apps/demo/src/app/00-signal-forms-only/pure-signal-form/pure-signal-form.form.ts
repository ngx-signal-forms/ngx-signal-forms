import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { Control, form } from '@angular/forms/signals';
import type { PureSignalFormModel } from './pure-signal-form.model';
import { pureSignalFormSchema } from './pure-signal-form.validations';

/**
 * Pure Signal Forms - Signup Form Component
 *
 * Clean implementation showing what Angular Signal Forms requires manually.
 * Form context and comparison details are documented in the page container.
 */
@Component({
  selector: 'ngx-pure-signal-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Control],
  template: `
    <form (ngSubmit)="saveForm()" novalidate class="form-container">
      <!-- Email Field - Manual ARIA Implementation -->
      <div class="form-field">
        <label for="pure-email" class="form-label">Email Address *</label>
        <input
          id="pure-email"
          type="email"
          [control]="signupForm.email"
          (blur)="markFieldAsTouched('email')"
          [attr.aria-invalid]="shouldShowEmailErrors() ? 'true' : null"
          [attr.aria-describedby]="
            shouldShowEmailErrors() ? 'pure-email-error' : null
          "
          class="form-input"
          placeholder="you@example.com"
        />

        @if (shouldShowEmailErrors()) {
          <div
            id="pure-email-error"
            role="alert"
            aria-live="assertive"
            class="form-error-text"
          >
            @for (error of signupForm.email().errors(); track error.kind) {
              <p>{{ error.message }}</p>
            }
          </div>
        }
      </div>

      <!-- Password Field - Manual ARIA Implementation -->
      <div class="form-field">
        <label for="pure-password" class="form-label">Password *</label>
        <input
          id="pure-password"
          type="password"
          [control]="signupForm.password"
          (blur)="markFieldAsTouched('password')"
          [attr.aria-invalid]="shouldShowPasswordErrors() ? 'true' : null"
          [attr.aria-describedby]="
            shouldShowPasswordErrors() ? 'pure-password-error' : null
          "
          class="form-input"
          placeholder="At least 8 characters"
        />

        @if (shouldShowPasswordErrors()) {
          <div
            id="pure-password-error"
            role="alert"
            aria-live="assertive"
            class="form-error-text"
          >
            @for (error of signupForm.password().errors(); track error.kind) {
              <p>{{ error.message }}</p>
            }
          </div>
        }
      </div>

      <!-- Confirm Password Field - Manual ARIA Implementation -->
      <div class="form-field">
        <label for="pure-confirm-password" class="form-label"
          >Confirm Password *</label
        >
        <input
          id="pure-confirm-password"
          type="password"
          [control]="signupForm.confirmPassword"
          (blur)="markFieldAsTouched('confirmPassword')"
          [attr.aria-invalid]="
            shouldShowConfirmPasswordErrors() ? 'true' : null
          "
          [attr.aria-describedby]="
            shouldShowConfirmPasswordErrors()
              ? 'pure-confirm-password-error'
              : null
          "
          class="form-input"
          placeholder="Re-enter password"
        />

        @if (shouldShowConfirmPasswordErrors()) {
          <div
            id="pure-confirm-password-error"
            role="alert"
            aria-live="assertive"
            class="form-error-text"
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

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="submit"
          [disabled]="signupForm().invalid() || signupForm().pending()"
          class="btn-primary"
        >
          @if (signupForm().pending()) {
            Submitting...
          } @else {
            Sign Up
          }
        </button>
      </div>
    </form>
  `,
})
export class PureSignalFormComponent {
  /** Form data model */
  readonly #formData = signal<PureSignalFormModel>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  /** Create form with Angular Signal Forms */
  readonly signupForm = form(this.#formData, pureSignalFormSchema);

  /** Manual touch state tracking (required for error display logic) */
  readonly #touchedFields = signal<Set<string>>(new Set());

  /** Form submission handler */
  /**
   * Form submission handler
   * Validates form and processes submission
   */
  protected saveForm(): void {
    if (this.signupForm().valid()) {
      console.log('✅ Form submitted:', this.#formData());
      // Reset form after successful submission
      this.#formData.set({ email: '', password: '', confirmPassword: '' });
    } else {
      console.log('❌ Form is invalid');
    }
  }

  /**
   * Manual touch tracking - must be called on blur for each field
   * 🚨 With toolkit: This is automatic!
   */
  protected markFieldAsTouched(fieldName: string): void {
    this.#touchedFields.update((fields) => {
      fields.add(fieldName);
      return new Set(fields);
    });
  }

  /**
   * Manual error visibility logic for email field
   * 🚨 With toolkit: This is handled by error display strategy!
   */
  protected readonly shouldShowEmailErrors = computed(() => {
    return (
      this.signupForm.email().invalid() &&
      (this.signupForm.email().touched() || this.#touchedFields().has('email'))
    );
  });

  /**
   * Manual error visibility logic for password field
   * 🚨 With toolkit: This is handled by error display strategy!
   */
  protected readonly shouldShowPasswordErrors = computed(() => {
    return (
      this.signupForm.password().invalid() &&
      (this.signupForm.password().touched() ||
        this.#touchedFields().has('password'))
    );
  });

  /**
   * Manual error visibility logic for confirm password field
   * 🚨 With toolkit: This is handled by error display strategy!
   */
  protected readonly shouldShowConfirmPasswordErrors = computed(() => {
    return (
      this.signupForm.confirmPassword().invalid() &&
      (this.signupForm.confirmPassword().touched() ||
        this.#touchedFields().has('confirmPassword'))
    );
  });
}
