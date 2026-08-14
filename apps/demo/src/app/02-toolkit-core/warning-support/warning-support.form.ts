import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  hasOnlyWarnings,
  NgxSignalFormToolkit,
  type ResolvedErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { passwordFormSchema } from './warning-support.validations';

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

    <form
      [formRoot]="passwordForm"
      ngxSignalForm
      [errorStrategy]="errorDisplayMode()"
      class="form-container"
    >
      <ngx-form-field-wrapper
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
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper
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
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper
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
      </ngx-form-field-wrapper>

      <div class="form-actions">
        <button type="button" (click)="reset()">Reset</button>
        <button
          type="submit"
          class="btn-primary"
          [disabled]="passwordForm().submitting()"
        >
          @if (passwordForm().submitting()) {
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
  readonly errorDisplayMode = input<ResolvedErrorDisplayStrategy>('on-touch');

  readonly #formModel = signal({
    username: '',
    email: '',
    password: '',
  });

  readonly #onInvalid = createOnInvalidHandler();

  /**
   * Native `[formRoot]` submit treats every ValidationError as blocking, so
   * `ignoreValidators: 'all'` plus `hasOnlyWarnings()` preserve the warning
   * bypass. Calling `submitWithWarnings()` from `submission.action` would
   * no-op while `submitting()` is true.
   */
  readonly passwordForm = form(this.#formModel, passwordFormSchema, {
    submission: {
      ignoreValidators: 'all',
      action: async () => {
        if (!hasOnlyWarnings(this.passwordForm().errorSummary())) {
          this.#onInvalid(this.passwordForm);
          return;
        }

        await new Promise<void>((resolve) => {
          setTimeout(resolve, 1000);
        });

        this.successMessage.set(
          '✓ Account created successfully! Notice how warnings did not block submission.',
        );

        setTimeout(() => {
          this.successMessage.set('');
        }, 5000);
      },
    },
  });

  protected readonly successMessage = signal('');

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
