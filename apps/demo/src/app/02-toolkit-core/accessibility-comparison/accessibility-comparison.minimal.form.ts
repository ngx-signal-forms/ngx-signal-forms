import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField, submit } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import type { AccessibilityFormModel } from './accessibility-comparison.model';
import { accessibilityValidationSchema } from './accessibility-comparison.validations';

/**
 * Minimal Toolkit Implementation - NO [formRoot] BINDING
 *
 * This example demonstrates that `<ngx-signal-form-field-wrapper>` works WITHOUT
 * the `[formRoot]` binding for the default `'on-touch'` strategy!
 *
 * 🎯 What you GET (automatically):
 * - `novalidate` attribute on form
 * - `aria-invalid="true"` when field is invalid AND touched
 * - `aria-describedby` linking to error containers
 * - `<ngx-signal-form-field-wrapper>` automatic error display (for 'on-touch')
 * - `<ngx-form-field-error>` automatic error display (for 'on-touch')
 *
 * ⚠️ What DOES require `[formRoot]`:
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
    <!-- ✅ NO [formRoot] needed! Error components work for 'on-touch' strategy -->
    <form (submit)="handleSubmit($event)" class="space-y-4">
      <!-- Email Field - uses ngx-signal-form-field-wrapper WITHOUT [formRoot] -->
      <ngx-signal-form-field-wrapper [formField]="signupForm.email">
        <label for="minimal-email">Email *</label>
        <input id="minimal-email" type="email" [formField]="signupForm.email" />
      </ngx-signal-form-field-wrapper>

      <!-- Password Field -->
      <ngx-signal-form-field-wrapper [formField]="signupForm.password">
        <label for="minimal-password">Password *</label>
        <input
          id="minimal-password"
          type="password"
          [formField]="signupForm.password"
        />
      </ngx-signal-form-field-wrapper>

      <!-- Confirm Password Field -->
      <ngx-signal-form-field-wrapper [formField]="signupForm.confirmPassword">
        <label for="minimal-confirm">Confirm Password *</label>
        <input
          id="minimal-confirm"
          type="password"
          [formField]="signupForm.confirmPassword"
        />
      </ngx-signal-form-field-wrapper>

      <button type="submit" class="btn-primary">
        @if (signupForm().submitting()) {
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
      <code>[formRoot]</code> for the default <code>'on-touch'</code> strategy!
    </div>
  `,
  styles: `
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
  readonly #model = signal({
    email: '',
    password: '',
    confirmPassword: '',
  });

  readonly signupForm = form(this.#model, accessibilityValidationSchema);

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.signupForm, async () => {
      console.log('[Minimal Toolkit] Form submitted:', this.#model());
      return null;
    });
  }
}
