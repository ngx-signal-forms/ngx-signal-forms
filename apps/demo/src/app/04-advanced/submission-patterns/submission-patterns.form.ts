import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { Control, form } from '@angular/forms/signals';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import type { SubmissionModel } from './submission-patterns.model';
import { submissionSchema } from './submission-patterns.validations';

/**
 * Submission Patterns Component
 *
 * Demonstrates advanced submission patterns:
 * - Manual async operations with loading states
 * - Server error handling and display
 * - WCAG 2.2 compliance for error announcements
 */
@Component({
  selector: 'ngx-submission-patterns',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Control, NgxSignalFormToolkit, NgxSignalFormFieldComponent],
  template: `
    <form
      [ngxSignalFormProvider]="registrationForm"
      [errorStrategy]="errorDisplayMode()"
      (ngSubmit)="handleSubmit()"
      class="form-container"
    >
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
              Status:
            </dt>
            <dd class="text-gray-600 dark:text-gray-400">
              {{ submissionStatus() }}
            </dd>
          </div>
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
        <button type="submit" [disabled]="isSubmitting()" class="btn-primary">
          @if (isSubmitting()) {
            <span>Submitting...</span>
          } @else {
            <span>Create Account</span>
          }
        </button>
        <button
          type="button"
          (click)="resetForm()"
          [disabled]="isSubmitting()"
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
  protected readonly isSubmitting = signal(false);

  /// Computed submission status
  protected readonly submissionStatus = computed(() => {
    return this.isSubmitting()
      ? 'Submitting...'
      : this.submissionSuccess()
        ? 'Submitted'
        : 'Not submitted';
  });

  protected async handleSubmit(): Promise<void> {
    /// Clear previous states
    this.serverError.set(null);
    this.submissionSuccess.set(false);

    /// Check if form is valid
    if (this.registrationForm().invalid()) {
      return;
    }

    /// Set submitting state
    this.isSubmitting.set(true);

    try {
      /// Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      /// Simulate server error if checkbox is checked
      if (this.model().simulateServerError) {
        this.serverError.set(
          'Username "' +
            this.model().username +
            '" is already taken. Please choose another.',
        );
        return;
      }

      /// Success case
      console.log('✅ Registration successful:', this.model());
      this.submissionSuccess.set(true);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected resetForm(): void {
    this.model.set({
      username: '',
      password: '',
      confirmPassword: '',
      simulateServerError: false,
    });
    this.serverError.set(null);
    this.submissionSuccess.set(false);
    this.isSubmitting.set(false);
  }
}
