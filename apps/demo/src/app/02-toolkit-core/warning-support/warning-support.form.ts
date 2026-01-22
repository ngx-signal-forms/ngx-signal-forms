import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';
import {
  canSubmitWithWarnings,
  NgxSignalFormToolkit,
  submitWithWarnings,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import type { PasswordFormModel } from './warning-support.model';
import { createPasswordForm } from './warning-support.validations';

@Component({
  selector: 'ngx-warning-support-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormFieldComponent],
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
      [errorStrategy]="errorDisplayMode"
      (submit)="handleSubmit($event)"
    >
      <ngx-signal-form-field
        [formField]="passwordForm.username"
        fieldName="username"
      >
        <label for="username">Username</label>
        <input
          id="username"
          type="text"
          [formField]="passwordForm.username"
          autocomplete="username"
          placeholder="Choose a username"
        />
      </ngx-signal-form-field>

      <ngx-signal-form-field [formField]="passwordForm.email" fieldName="email">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          [formField]="passwordForm.email"
          autocomplete="email"
          placeholder="your.email@example.com"
        />
      </ngx-signal-form-field>

      <ngx-signal-form-field
        [formField]="passwordForm.password"
        fieldName="password"
      >
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          [formField]="passwordForm.password"
          autocomplete="new-password"
          placeholder="Enter a secure password"
        />
      </ngx-signal-form-field>

      <div class="form-actions">
        <button type="button" (click)="reset()">Reset</button>
        <button
          type="submit"
          aria-live="polite"
          [disabled]="!canSubmitWithWarnings() || passwordForm().pending()"
        >
          @if (passwordForm().pending()) {
            Creating Account...
          } @else {
            Create Account
          }
        </button>
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
   * Computed signal for button disabled state.
   * Uses canSubmitWithWarnings() to allow submission when only warnings exist.
   */
  protected readonly canSubmitWithWarnings = canSubmitWithWarnings(
    this.passwordForm,
  );

  /**
   * Form submission using submitWithWarnings() from the toolkit.
   *
   * **WCAG Compliant Behavior:**
   * - Warnings do NOT block submission (only blocking errors do)
   * - All fields are marked as touched to show feedback
   * - Blocking errors prevent submission
   */
  protected async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submitWithWarnings(this.passwordForm, async () => {
      /// Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.successMessage.set(
        '✓ Account created successfully! Notice how warnings did not block submission.',
      );

      /// Clear success message after 5 seconds
      setTimeout(() => this.successMessage.set(''), 5000);
    });
  }

  protected reset(): void {
    this.passwordForm().reset();
    this.#formModel.set({
      username: '',
      email: '',
      password: '',
    });
    this.successMessage.set('');
  }
}
