import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { Control, form, submit } from '@angular/forms/signals';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit/core';
import {
  NGX_SIGNAL_FORM_CONTEXT,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import type { SubmissionModel } from './submission-patterns.model';
import { submissionSchema } from './submission-patterns.validations';

/**
 * Submission Patterns Component
 *
 * Demonstrates advanced submission patterns:
 * - Automatic submission tracking via submit() helper
 * - Server error handling and display
 * - WCAG 2.2 compliance for error announcements
 * - Visual feedback for submission states
 */
@Component({
  selector: 'ngx-submission-patterns',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Control, NgxSignalFormToolkit, NgxSignalFormFieldComponent],
  template: `
    <form
      [ngxSignalFormProvider]="registrationForm"
      [errorStrategy]="errorDisplayMode()"
      (ngSubmit)="(handleSubmit)"
      novalidate
      class="form-container"
    >
      <!-- Submission state indicator -->
      <div
        class="mb-6 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
      >
        <span class="text-2xl">📊</span>
        <div class="flex-1">
          <div
            class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Submission State
          </div>
          <div class="flex items-center gap-2">
            @switch (formContext?.submittedStatus()) {
              @case ('unsubmitted') {
                <span
                  class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                >
                  <span class="h-2 w-2 rounded-full bg-gray-400"></span>
                  Ready to Submit
                </span>
              }
              @case ('submitting') {
                <span
                  class="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                >
                  <span
                    class="h-2 w-2 animate-pulse rounded-full bg-purple-600"
                  ></span>
                  Submitting...
                </span>
              }
              @case ('submitted') {
                <span
                  class="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  <span class="h-2 w-2 rounded-full bg-green-600"></span>
                  Submitted
                </span>
              }
            }
            <span class="text-xs text-gray-500 dark:text-gray-400">
              (Automatically tracked by toolkit)
            </span>
          </div>
        </div>
      </div>

      <!-- Server error display (if any) -->
      @if (serverError()) {
        <div
          role="alert"
          class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
        >
          <div class="flex items-start gap-3">
            <span class="text-2xl">❌</span>
            <div>
              <h3 class="mb-1 font-semibold text-red-900 dark:text-red-100">
                Submission Failed
              </h3>
              <p class="text-sm text-red-800 dark:text-red-200">
                {{ serverError() }}
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Success message (if submission succeeded) -->
      @if (submissionSuccess()) {
        <div
          role="status"
          class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950"
        >
          <div class="flex items-start gap-3">
            <span class="text-2xl">✅</span>
            <div>
              <h3 class="mb-1 font-semibold text-green-900 dark:text-green-100">
                Registration Successful!
              </h3>
              <p class="text-sm text-green-800 dark:text-green-200">
                Account created for <strong>{{ model().username }}</strong>
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Form fields -->
      <div class="space-y-6">
        <!-- Username field -->
        <ngx-signal-form-field
          [field]="registrationForm.username"
          fieldName="username"
        >
          <label for="username">Username *</label>
          <input
            id="username"
            type="text"
            [control]="registrationForm.username"
            placeholder="Enter username"
            class="form-input"
          />
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Letters, numbers, and underscores only
          </p>
        </ngx-signal-form-field>

        <!-- Password field -->
        <ngx-signal-form-field
          [field]="registrationForm.password"
          fieldName="password"
        >
          <label for="password">Password *</label>
          <input
            id="password"
            type="password"
            [control]="registrationForm.password"
            placeholder="Enter password"
            class="form-input"
          />
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            At least 8 characters
          </p>
        </ngx-signal-form-field>

        <!-- Confirm Password field -->
        <ngx-signal-form-field
          [field]="registrationForm.confirmPassword"
          fieldName="confirmPassword"
        >
          <label for="confirmPassword">Confirm Password *</label>
          <input
            id="confirmPassword"
            type="password"
            [control]="registrationForm.confirmPassword"
            placeholder="Re-enter password"
            class="form-input"
          />
        </ngx-signal-form-field>
      </div>

      <!-- Submission state info -->
      <div
        class="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
      >
        <h4 class="mb-2 font-semibold text-gray-900 dark:text-gray-100">
          Submission State
        </h4>
        <dl class="space-y-2 text-sm">
          <div class="flex gap-2">
            <dt class="font-medium text-gray-700 dark:text-gray-300">
              Form Valid:
            </dt>
            <dd class="text-gray-600 dark:text-gray-400">
              {{ registrationForm().valid() ? 'Yes' : 'No' }}
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium text-gray-700 dark:text-gray-300">
              Error Strategy:
            </dt>
            <dd class="text-gray-600 dark:text-gray-400">
              {{ errorDisplayMode() }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- Form actions -->
      <div class="mt-8 flex gap-4">
        <button
          type="submit"
          [disabled]="formContext?.submittedStatus() === 'submitting'"
          class="btn-primary"
        >
          @if (formContext?.submittedStatus() === 'submitting') {
            <span>Submitting...</span>
          } @else {
            <span>Create Account</span>
          }
        </button>
        <button
          type="button"
          (click)="resetForm()"
          [disabled]="formContext?.submittedStatus() === 'submitting'"
          class="btn-secondary"
        >
          Reset
        </button>
      </div>

      <!-- Simulate server error toggle -->
      <div class="mt-6">
        <label
          class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
        >
          <input
            type="checkbox"
            [control]="registrationForm.simulateServerError"
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span>Simulate server error (for testing)</span>
        </label>
      </div>
    </form>
  `,
})
export class SubmissionPatternsComponent {
  errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  /// Form context - provides automatic submission tracking
  protected readonly formContext = inject(NGX_SIGNAL_FORM_CONTEXT, {
    optional: true,
  });

  protected readonly model = signal<SubmissionModel>({
    username: '',
    password: '',
    confirmPassword: '',
    simulateServerError: false,
  });

  readonly registrationForm = form(this.model, submissionSchema);

  /// Server error state for demonstration
  protected readonly serverError = signal<string | null>(null);
  protected readonly submissionSuccess = signal(false);

  /**
   * Form submission handler using Angular Signal Forms submit() helper.
   *
   * CORRECT PATTERN (per Tim Deschryver & Angular docs):
   * 1. Call submit() ONCE to create a submit handler function
   * 2. Store the handler as a component property
   * 3. Bind directly to (ngSubmit) or call the handler
   * 4. submit() returns a FUNCTION (not a Promise)
   *
   * The submit() helper provides:
   * - Automatic markAllAsTouched() to show validation errors
   * - Automatic submission state tracking (submitting → submitted)
   * - Server error handling via return value
   * - Type-safe access to form data
   *
   * Note: The callback is only invoked when the form is VALID.
   * If invalid, the callback is skipped and submitting remains false.
   */
  protected readonly handleSubmit = submit(
    this.registrationForm,
    async (formData) => {
      /// Clear previous states
      this.serverError.set(null);
      this.submissionSuccess.set(false);

      /// Simulate API delay (toolkit automatically shows 'submitting' state)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      /// Simulate server error if checkbox is checked
      if (formData().value().simulateServerError) {
        const username = formData().value().username;
        this.serverError.set(
          `Username "${username}" is already taken. Please choose another.`,
        );
        /// Return null since we're handling error display manually
        /// (Alternatively, could return error array for automatic display)
        return null;
      }

      /// Success case
      console.log('✅ Registration successful:', formData().value());
      this.submissionSuccess.set(true);

      /// Return null to indicate no server errors
      return null;
    },
  );

  protected resetForm(): void {
    /// Reset form state and data
    this.registrationForm().reset();
    this.model.set({
      username: '',
      password: '',
      confirmPassword: '',
      simulateServerError: false,
    });

    /// Clear local state
    this.serverError.set(null);
    this.submissionSuccess.set(false);

    /// Note: submittedStatus automatically resets to 'unsubmitted'
    /// when form().reset() is called
  }
}
