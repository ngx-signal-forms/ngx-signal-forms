import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Field, submit } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import type { PasswordFormModel } from './warning-support.model';
import { createPasswordForm } from './warning-support.validations';

@Component({
  selector: 'ngx-warning-support-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field, NgxSignalFormToolkit, NgxSignalFormFieldComponent],
  styles: `
    :host {
      display: block;
      max-width: 600px;
      margin: 0 auto;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.375rem;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    button[type='submit'] {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    button[type='submit']:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    button[type='submit']:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    button[type='button'] {
      background: #e5e7eb;
      color: #374151;
    }

    button[type='button']:hover {
      background: #d1d5db;
    }

    .success-message {
      padding: 1rem;
      background: #d1fae5;
      border: 1px solid #10b981;
      border-radius: 0.375rem;
      color: #065f46;
      margin-bottom: 1rem;
    }

    /* Custom styling for warnings vs errors in form fields */
    :host ::ng-deep {
      .ngx-signal-form-error__item[data-error-type='warning'] {
        color: #d97706;
        background: #fef3c7;
        border-left: 3px solid #f59e0b;
        padding: 0.5rem 0.75rem;
        border-radius: 0.25rem;
        margin-top: 0.25rem;
      }

      .ngx-signal-form-error__item[data-error-type='error'] {
        color: #dc2626;
        background: #fee2e2;
        border-left: 3px solid #ef4444;
        padding: 0.5rem 0.75rem;
        border-radius: 0.25rem;
        margin-top: 0.25rem;
      }
    }
  `,
  template: `
    @if (successMessage()) {
      <div class="success-message" role="status" aria-live="polite">
        {{ successMessage() }}
      </div>
    }

    <form [ngxSignalFormProvider]="passwordForm" (ngSubmit)="handleSubmit()">
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
  readonly #formModel = signal<PasswordFormModel>({
    username: '',
    email: '',
    password: '',
  });

  readonly passwordForm = createPasswordForm(this.#formModel);
  protected readonly successMessage = signal<string>('');

  protected async handleSubmit(): Promise<void> {
    const submitHandler = submit(this.passwordForm, async (formData) => {
      try {
        /// Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log('Form submitted:', formData().value());
        this.successMessage.set(
          '✓ Account created successfully! Notice how warnings did not block submission.',
        );

        /// Clear success message after 5 seconds
        setTimeout(() => this.successMessage.set(''), 5000);

        return null;
      } catch (error) {
        console.error('Submission error:', error);
        return [
          {
            kind: 'submission_error',
            message: 'Failed to create account. Please try again.',
            field: formData,
          },
        ];
      }
    });

    await submitHandler;
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
