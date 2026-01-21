import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  signal,
} from '@angular/core';
import { FormField, form, submit } from '@angular/forms/signals';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit/core';
import {
  NgxSignalFormToolkit,
  provideErrorMessages,
} from '@ngx-signal-forms/toolkit/core';
import { NgxOutlinedFormField } from '@ngx-signal-forms/toolkit/form-field';
import type { ErrorMessagesModel } from './error-messages.model';
import { errorMessagesSchema } from './error-messages.validations';

/**
 * Error Messages Component
 *
 * Demonstrates 3-tier error message priority system:
 * 1. Validator message (error.message property) - Highest priority
 * 2. Registry override (from provideErrorMessages()) - Fallback
 * 3. Default toolkit message - Final fallback
 *
 * Shows when to use registry vs. validator messages.
 */
@Component({
  selector: 'ngx-error-messages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxOutlinedFormField],
  providers: [
    // Demo: Centralized error messages (pattern shown in README)
    provideErrorMessages({
      required: 'This field is required',
      email: 'Please enter a valid email address',
      minLength: (params: Record<string, unknown>) =>
        `Minimum ${(params as { minLength: number }).minLength} characters required`,
    }),
  ],
  template: `
    <form
      [ngxSignalForm]="errorMessagesForm"
      [errorStrategy]="errorDisplayMode()"
      (submit)="handleSubmit($event)"
      class="form-container"
    >
      <!-- Form fields -->
      <div class="space-y-6">
        <!-- Email: Uses validator message (Tier 1 - highest priority) -->
        <ngx-signal-form-field [formField]="errorMessagesForm.email" outline>
          <label for="email">Email (Validator Message - Tier 1)</label>
          <input
            id="email"
            type="email"
            [formField]="errorMessagesForm.email"
            placeholder="you@example.com"
            class="form-input"
          />
          <ngx-signal-form-field-hint>
            Tier 1: Validator message takes priority
          </ngx-signal-form-field-hint>
        </ngx-signal-form-field>

        <!-- Password: Uses registry override (Tier 2) -->
        <ngx-signal-form-field [formField]="errorMessagesForm.password" outline>
          <label for="password">Password (Registry Override - Tier 2)</label>
          <input
            id="password"
            type="password"
            [formField]="errorMessagesForm.password"
            placeholder="Enter password"
            class="form-input"
          />
          <ngx-signal-form-field-hint>
            Tier 2: Registry provides fallback message
          </ngx-signal-form-field-hint>
        </ngx-signal-form-field>

        <!-- Bio: Uses default toolkit fallback (Tier 3) -->
        <ngx-signal-form-field [formField]="errorMessagesForm.bio" outline>
          <label for="bio">Bio (Default Fallback - Tier 3)</label>
          <textarea
            id="bio"
            [formField]="errorMessagesForm.bio"
            rows="3"
            placeholder="Tell us about yourself"
            class="form-input"
          ></textarea>
          <ngx-signal-form-field-hint>
            Tier 3: Toolkit default fallback
          </ngx-signal-form-field-hint>
        </ngx-signal-form-field>
      </div>

      <!-- Form actions -->
      <div class="mt-8 flex gap-4">
        <button
          type="submit"
          class="btn-primary"
          aria-live="polite"
          [disabled]="errorMessagesForm().pending()"
        >
          @if (errorMessagesForm().pending()) {
            Submitting...
          } @else {
            Submit Form
          }
        </button>
        <button type="button" (click)="resetForm()" class="btn-secondary">
          Reset
        </button>
      </div>

      <!-- Provider code example -->
      <div
        class="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
      >
        <h4
          class="mb-2 text-xs font-semibold tracking-wide text-gray-700 uppercase dark:text-gray-300"
        >
          Provider Configuration
        </h4>
        <pre
          class="overflow-x-auto text-sm text-gray-800 dark:text-gray-200"
        ><code>{{ providerCode }}</code></pre>
      </div>

      <!-- Schema code example -->
      <div
        class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
      >
        <h4
          class="mb-2 text-xs font-semibold tracking-wide text-gray-700 uppercase dark:text-gray-300"
        >
          Form Schema
        </h4>
        <pre
          class="overflow-x-auto text-sm text-gray-800 dark:text-gray-200"
        ><code>{{ schemaCode }}</code></pre>
      </div>
    </form>
  `,
})
export class ErrorMessagesComponent {
  errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  readonly #model = signal<ErrorMessagesModel>({
    email: '',
    password: '',
    bio: '',
  });

  readonly errorMessagesForm = form(this.#model, errorMessagesSchema);

  constructor() {
    // Reset form state on initialization to ensure fields start as untouched
    effect(
      () => {
        this.errorMessagesForm().reset();
      },
      { allowSignalWrites: true },
    );
  }

  protected readonly providerCode = `provideErrorMessages({
  required: 'This field is required',
  email: 'Please enter a valid email address',
  minLength: (params: Record<string, unknown>) =>
    \`Minimum \${(params as { minLength: number }).minLength} characters required\`,
})`;

  protected readonly schemaCode = `form(userData, (path) => {
  // Email: Uses validator message (Tier 1)
  required(path.email);
  email(path.email, { message: 'Valid email required' });

  // Password: Uses registry (Tier 2)
  required(path.password);
  minLength(path.password, 8);

  // Bio: Uses default fallback (Tier 3)
  required(path.bio);
})`;

  /**
   * Form submission handler using Angular Signal Forms submit() helper.
   * ACCESSIBILITY: Button never disabled (best practice).
   */
  protected async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.errorMessagesForm, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.#model.set({ email: '', password: '', bio: '' });
      this.errorMessagesForm().reset();
      return null;
    });
  }

  protected resetForm(): void {
    this.errorMessagesForm().reset();
    this.#model.set({
      email: '',
      password: '',
      bio: '',
    });
  }
}
