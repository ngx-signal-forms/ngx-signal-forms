import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  submitWithWarnings,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { createPasswordForm } from './warning-support.validations';

@Component({
  selector: 'ngx-warning-support-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
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

    <form class="form-container" novalidate (submit)="handleSubmit($event)">
      <ngx-signal-form-field-wrapper
        [formField]="passwordForm.username"
        [strategy]="errorDisplayMode()"
      >
        <label for="username">Username</label>
        <input
          id="username"
          type="text"
          [formField]="passwordForm.username"
          autocomplete="username"
          placeholder="Choose a username"
        />
      </ngx-signal-form-field-wrapper>

      <ngx-signal-form-field-wrapper
        [formField]="passwordForm.email"
        [strategy]="errorDisplayMode()"
      >
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          [formField]="passwordForm.email"
          autocomplete="email"
          placeholder="your.email@example.com"
        />
      </ngx-signal-form-field-wrapper>

      <ngx-signal-form-field-wrapper
        [formField]="passwordForm.password"
        [strategy]="errorDisplayMode()"
      >
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          [formField]="passwordForm.password"
          autocomplete="new-password"
          placeholder="Enter a secure password"
        />
      </ngx-signal-form-field-wrapper>

      <div class="form-actions">
        <button type="button" (click)="reset()">Reset</button>
        <button type="submit" class="btn-primary" [disabled]="isSubmitting()">
          @if (isSubmitting()) {
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
   * Allows users to switch between immediate, on-touch, and on-submit modes.
   */
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  readonly #formModel = signal({
    username: '',
    email: '',
    password: '',
  });

  readonly passwordForm = createPasswordForm(this.#formModel);
  protected readonly isSubmitting = signal(false);
  protected readonly successMessage = signal('');
  /**
   * Form submission using submitWithWarnings() from the toolkit.
   *
   * **WCAG Compliant Behavior:**
   * - Warnings do NOT block submission (only blocking errors do)
   * - All fields are marked as touched to show feedback
   * - Blocking errors prevent submission
   */
  protected handleSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    void submitWithWarnings(this.passwordForm, async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 1000);
      });

      this.successMessage.set(
        '✓ Account created successfully! Notice how warnings did not block submission.',
      );

      setTimeout(() => this.successMessage.set(''), 5000);
    }).finally(() => {
      this.isSubmitting.set(false);
    });
  }

  protected reset(): void {
    this.passwordForm().reset();
    this.isSubmitting.set(false);
    this.#formModel.set({
      username: '',
      email: '',
      password: '',
    });
    this.successMessage.set('');
  }
}
