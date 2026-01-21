import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormField, form, submit } from '@angular/forms/signals';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import type { GlobalConfigModel } from './global-configuration.model';
import { globalConfigSchema } from './global-configuration.validations';

/**
 * Global Configuration Component
 *
 * Demonstrates global toolkit configuration with provideNgxSignalFormsConfig.
 * Shows how to:
 * - Set default error display strategies globally
 * - Configure automatic ARIA attributes
 * - Use custom field name resolvers
 * - Override global settings per form/field
 *
 * Note: Global configuration is set in app.config.ts via provideNgxSignalFormsConfig()
 */
@Component({
  selector: 'ngx-global-configuration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormFieldComponent],
  template: `
    <form
      [ngxSignalForm]="configForm"
      [errorStrategy]="errorDisplayMode()"
      (submit)="handleSubmit($event)"
      class="form-container"
    >
      <!-- Info callout about global config -->
      <div
        class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950"
      >
        <div class="flex items-start gap-3">
          <span class="text-2xl">ℹ️</span>
          <div>
            <h3 class="mb-2 font-semibold text-blue-900 dark:text-blue-100">
              Global Configuration Active
            </h3>
            <p class="text-sm text-blue-800 dark:text-blue-200">
              This form uses global configuration set in
              <code class="rounded bg-blue-100 px-1 py-0.5 dark:bg-blue-900"
                >app.config.ts</code
              >. The global
              <code class="rounded bg-blue-100 px-1 py-0.5 dark:bg-blue-900"
                >defaultErrorStrategy</code
              >
              is "on-touch", but you can override it using the selector below.
            </p>
          </div>
        </div>
      </div>

      <!-- Form fields -->
      <div class="space-y-6">
        <!-- Email field with standard id -->
        <ngx-signal-form-field
          [formField]="configForm.userEmail"
          fieldName="userEmail"
        >
          <label for="userEmail">Email Address *</label>
          <input
            id="userEmail"
            type="email"
            [formField]="configForm.userEmail"
            placeholder="user@example.com"
            class="form-input"
          />
        </ngx-signal-form-field>

        <!-- Phone field with custom data attribute -->
        <ngx-signal-form-field
          [formField]="configForm.userPhone"
          fieldName="userPhone"
        >
          <label for="userPhone">Phone Number *</label>
          <input
            id="userPhone"
            type="tel"
            [formField]="configForm.userPhone"
            data-signal-field="userPhone"
            placeholder="123-456-7890"
            class="form-input"
          />
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Format: 123-456-7890
          </p>
        </ngx-signal-form-field>

        <!-- Website field (optional) -->
        <ngx-signal-form-field
          [formField]="configForm.userWebsite"
          fieldName="userWebsite"
        >
          <label for="userWebsite">Website</label>
          <input
            id="userWebsite"
            type="url"
            [formField]="configForm.userWebsite"
            placeholder="https://example.com"
            class="form-input"
          />
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Optional - Must be a valid URL if provided
          </p>
        </ngx-signal-form-field>
      </div>

      <!-- Form actions -->
      <div class="mt-8 flex gap-4">
        <button
          type="submit"
          class="btn-primary"
          aria-live="polite"
          [disabled]="configForm().pending()"
        >
          @if (configForm().pending()) {
            Saving...
          } @else {
            Submit Form
          }
        </button>
        <button type="button" (click)="resetForm()" class="btn-secondary">
          Reset
        </button>
      </div>

      <!-- Configuration info -->
      <div
        class="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
      >
        <h4 class="mb-2 font-semibold text-gray-900 dark:text-gray-100">
          Current Configuration
        </h4>
        <dl class="space-y-2 text-sm">
          <div class="flex gap-2">
            <dt class="font-medium text-gray-700 dark:text-gray-300">
              Error Strategy:
            </dt>
            <dd class="text-gray-600 dark:text-gray-400">
              {{ errorDisplayMode() }}
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium text-gray-700 dark:text-gray-300">
              Auto ARIA:
            </dt>
            <dd class="text-gray-600 dark:text-gray-400">Enabled (global)</dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium text-gray-700 dark:text-gray-300">
              Field Resolution:
            </dt>
            <dd class="text-gray-600 dark:text-gray-400">
              id → name → data-signal-field
            </dd>
          </div>
        </dl>
      </div>
    </form>
  `,
})
export class GlobalConfigurationComponent {
  errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  readonly #model = signal<GlobalConfigModel>({
    userEmail: '',
    userPhone: '',
    userWebsite: '',
  });

  readonly configForm = form(this.#model, globalConfigSchema);

  /**
   * Form submission handler using Angular Signal Forms submit() helper.
   * ACCESSIBILITY: Button never disabled (best practice).
   */
  protected async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.configForm, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.#model.set({ userEmail: '', userPhone: '', userWebsite: '' });
      this.configForm().reset();
      return null;
    });
  }

  protected resetForm(): void {
    this.configForm().reset();
    this.#model.set({
      userEmail: '',
      userPhone: '',
      userWebsite: '',
    });
  }
}
