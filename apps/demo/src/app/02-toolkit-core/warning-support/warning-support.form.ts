import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { Field, submit } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import type { PasswordFormModel } from './warning-support.model';
import { createPasswordForm } from './warning-support.validations';

@Component({
  selector: 'ngx-warning-support-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field, NgxSignalFormToolkit, NgxSignalFormFieldComponent],
  host: {
    class: 'block max-w-xl mx-auto',
  },
  template: `
    @if (successMessage()) {
      <div
        class="mb-4 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-200"
        role="status"
        aria-live="polite"
      >
        {{ successMessage() }}
      </div>
    }

    <form
      class="form-container"
      [ngxSignalForm]="passwordForm"
      [errorStrategy]="errorDisplayMode()"
      (ngSubmit)="handleSubmit()"
    >
      <ngx-signal-form-field
        [field]="passwordForm.username"
        fieldName="username"
      >
        <label for="username">Username</label>
        <input
          id="username"
          type="text"
          [field]="passwordForm.username"
          autocomplete="username"
          placeholder="Choose a username"
        />
      </ngx-signal-form-field>

      <ngx-signal-form-field [field]="passwordForm.email" fieldName="email">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          [field]="passwordForm.email"
          autocomplete="email"
          placeholder="your.email@example.com"
        />
      </ngx-signal-form-field>

      <ngx-signal-form-field
        [field]="passwordForm.password"
        fieldName="password"
      >
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          [field]="passwordForm.password"
          autocomplete="new-password"
          placeholder="Enter a secure password"
        />
      </ngx-signal-form-field>

      <div class="form-actions">
        <button type="button" (click)="reset()">Reset</button>
        <button type="submit" aria-live="polite">Create Account</button>
      </div>
    </form>
  `,
})
export class WarningsSupportFormComponent {
  /**
   * Error display strategy input from parent page.
   * Allows users to switch between immediate, on-touch, on-submit, and manual modes.
   */
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  readonly #formModel = signal<PasswordFormModel>({
    username: '',
    email: '',
    password: '',
  });

  readonly passwordForm = createPasswordForm(this.#formModel);
  protected readonly successMessage = signal<string>('');

  /**
   * Form submission using Angular Signal Forms' submit() helper.
   *
   * **Key behaviors:**
   * - Callback only executes if form is VALID
   * - If invalid, errors are shown but submission is blocked
   * - Warnings do NOT block submission (only blocking errors do)
   * - Submission status is tracked via submittedStatus signal
   */
  protected async handleSubmit(): Promise<void> {
    await submit(this.passwordForm, async (formData) => {
      try {
        /// Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        this.successMessage.set(
          '✓ Account created successfully! Notice how warnings did not block submission.',
        );

        /// Clear success message after 5 seconds
        setTimeout(() => this.successMessage.set(''), 5000);

        return null;
      } catch (error) {
        return [
          {
            kind: 'submission_error',
            message: 'Failed to create account. Please try again.',
            field: formData,
          },
        ];
      }
    });
  }

  protected reset(): void {
    this.#formModel.set({
      username: '',
      email: '',
      password: '',
    });
    this.successMessage.set('');
  }
}
