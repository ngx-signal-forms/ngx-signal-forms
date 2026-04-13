import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormField, FormRoot, form } from '@angular/forms/signals';
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
  imports: [FormField, FormRoot],
  template: `
    <form [formRoot]="signupForm" class="form-container">
      <!-- Email Field - Manual ARIA Implementation -->
      <div class="form-field">
        <label for="pure-email" class="form-label">Email Address *</label>
        <input
          id="pure-email"
          type="email"
          [formField]="signupForm.email"
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
        <label for="pure-password" class="form-label">Password *</label>
        <input
          id="pure-password"
          type="password"
          [formField]="signupForm.password"
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
        <label for="pure-confirm-password" class="form-label"
          >Confirm Password *</label
        >
        <input
          id="pure-confirm-password"
          type="password"
          [formField]="signupForm.confirmPassword"
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

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="submit" class="btn-primary" aria-live="polite" [disabled]="signupForm().submitting()">
          @if (signupForm().submitting()) {
            Saving...
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
  readonly #model = signal({
    email: '',
    password: '',
    confirmPassword: '',
  });

  /** Create form with Angular Signal Forms */
  readonly signupForm = form(this.#model, pureSignalFormSchema, {
    submission: {
      action: async (f) => {
        // Simulate async operation
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 500);
        });

        // Reset form after successful submission
        f().reset({ email: '', password: '', confirmPassword: '' });
      },
    },
  });

  /** Manual touch state tracking (required for error display logic) */
  readonly #touchedFields = signal(new Set());

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
   * Computed signals for error display logic
   * Show errors only after field has been touched
   */
  protected readonly shouldShowEmailErrors = computed(() => {
    const field = this.signupForm.email();
    return field.touched() && field.invalid();
  });

  protected readonly shouldShowPasswordErrors = computed(() => {
    const field = this.signupForm.password();
    return field.touched() && field.invalid();
  });

  protected readonly shouldShowConfirmPasswordErrors = computed(() => {
    const field = this.signupForm.confirmPassword();
    return field.touched() && field.invalid();
  });
}
