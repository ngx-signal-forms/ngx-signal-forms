import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField, submit } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import type { AccessibilityFormModel } from './accessibility-comparison.model';
import { accessibilityValidationSchema } from './accessibility-comparison.validations';

/**
 * Minimal Toolkit Implementation - NO [ngxSignalForm] BINDING
 *
 * This example demonstrates that `<ngx-signal-form-field-wrapper>` works WITHOUT
 * the `[ngxSignalForm]` binding for the default `'on-touch'` strategy!
 *
 * 🎯 What you GET (automatically):
 * - `novalidate` attribute on form
 * - `aria-invalid="true"` when field is invalid AND touched
 * - `aria-describedby` linking to error containers
 * - `<ngx-signal-form-field-wrapper>` automatic error display (for 'on-touch')
 * - `<ngx-signal-form-error>` automatic error display (for 'on-touch')
 *
 * ⚠️ What DOES require `[ngxSignalForm]`:
 * - `'on-submit'` error strategy (needs `submittedStatus`)
 * - Form-level `[errorStrategy]` override
 * - Access to `submittedStatus` signal in child components
 *
 * 📚 Key insight:
 * The `'on-touch'` strategy only checks `field.invalid() && field.touched()`.
 * Since Angular's `submit()` calls `markAllAsTouched()`, errors appear after
 * both blur AND submit - without needing `submittedStatus`!
 */
@Component({
  selector: 'ngx-accessibility-minimal-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <!-- ✅ NO [ngxSignalForm] needed! Error components work for 'on-touch' strategy -->
    <form (submit)="handleSubmit($event)" class="space-y-4">
      <!-- Email Field - uses ngx-signal-form-field-wrapper WITHOUT [ngxSignalForm] -->
      <ngx-signal-form-field-wrapper
        [formField]="signupForm.email"
        fieldName="email"
      >
        <label for="minimal-email" class="form-label">Email *</label>
        <input
          id="minimal-email"
          type="email"
          class="form-input"
          [formField]="signupForm.email"
        />
      </ngx-signal-form-field-wrapper>

      <!-- Password Field -->
      <ngx-signal-form-field-wrapper
        [formField]="signupForm.password"
        fieldName="password"
      >
        <label for="minimal-password" class="form-label">Password *</label>
        <input
          id="minimal-password"
          type="password"
          class="form-input"
          [formField]="signupForm.password"
        />
      </ngx-signal-form-field-wrapper>

      <!-- Confirm Password Field -->
      <ngx-signal-form-field-wrapper
        [formField]="signupForm.confirmPassword"
        fieldName="confirmPassword"
      >
        <label for="minimal-confirm" class="form-label"
          >Confirm Password *</label
        >
        <input
          id="minimal-confirm"
          type="password"
          class="form-input"
          [formField]="signupForm.confirmPassword"
        />
      </ngx-signal-form-field-wrapper>

      <button type="submit" class="btn-primary">
        @if (signupForm().pending()) {
          Subscribing...
        } @else {
          Submit
        }
      </button>
    </form>

    <!-- Explanation Card -->
    <div
      class="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
    >
      <strong>💡 Minimal Toolkit:</strong>
      <code>&lt;ngx-signal-form-field-wrapper&gt;</code> works WITHOUT
      <code>[ngxSignalForm]</code> for the default
      <code>'on-touch'</code> strategy!
    </div>
  `,
  styles: `
    .form-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-gray-700);
    }

    :host-context(.dark) .form-label {
      color: var(--color-gray-300);
    }

    .form-input {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-gray-300);
      border-radius: 0.375rem;
      font-size: 0.875rem;
      transition: border-color 0.15s;
      width: 100%;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-blue-500);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    :host-context(.dark) .form-input {
      background-color: var(--color-gray-800);
      border-color: var(--color-gray-600);
      color: var(--color-gray-100);
    }

    .btn-primary {
      padding: 0.5rem 1rem;
      background-color: var(--color-blue-600);
      color: white;
      border-radius: 0.375rem;
      font-weight: 500;
      transition: background-color 0.15s;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: var(--color-blue-700);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
})
export class AccessibilityMinimalFormComponent {
  readonly #model = signal<AccessibilityFormModel>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  readonly signupForm = form(this.#model, accessibilityValidationSchema);

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    submit(this.signupForm, async () => {
      console.log('[Minimal Toolkit] Form submitted:', this.#model());
      return null;
    });
  }
}
