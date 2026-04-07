import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
  type ErrorDisplayStrategy,
  type FormFieldAppearance,
} from '@ngx-signal-forms/toolkit';
import {
  createOnInvalidHandler,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import type { GlobalConfigModel } from './global-configuration.model';
import { globalConfigSchema } from './global-configuration.validations';

/**
 * Global Configuration Component
 *
 * Demonstrates global toolkit configuration with provideNgxSignalFormsConfig.
 * Shows how to:
 * - Set default error display strategies globally
 * - Configure automatic ARIA attributes
 * - Rely on deterministic control ids for ARIA linkage
 * - Override global settings per form/field
 *
 * Note: Global configuration is set in app.config.ts via provideNgxSignalFormsConfig()
 */
@Component({
  selector: 'ngx-global-configuration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form
      [formRoot]="configForm"
      ngxSignalForm
      [errorStrategy]="errorDisplayMode()"
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
        <ngx-signal-form-field-wrapper
          [formField]="configForm.userEmail"
          [appearance]="appearance()"
        >
          <label for="userEmail">Email Address *</label>
          <input
            id="userEmail"
            type="email"
            [formField]="configForm.userEmail"
            placeholder="user@example.com"
          />
        </ngx-signal-form-field-wrapper>

        <!-- Phone field with custom data attribute -->
        <ngx-signal-form-field-wrapper
          [formField]="configForm.userPhone"
          [appearance]="appearance()"
        >
          <label for="userPhone">Phone Number *</label>
          <input
            id="userPhone"
            type="tel"
            [formField]="configForm.userPhone"
            placeholder="123-456-7890"
          />
          <ngx-signal-form-field-hint>
            Format: 123-456-7890
          </ngx-signal-form-field-hint>
        </ngx-signal-form-field-wrapper>

        <!-- Website field (optional) -->
        <ngx-signal-form-field-wrapper
          [formField]="configForm.userWebsite"
          [appearance]="appearance()"
        >
          <label for="userWebsite">Website</label>
          <input
            id="userWebsite"
            type="url"
            [formField]="configForm.userWebsite"
            placeholder="https://example.com"
          />
          <ngx-signal-form-field-hint>
            Optional - Must be a valid URL if provided
          </ngx-signal-form-field-hint>
        </ngx-signal-form-field-wrapper>

        <!-- Accept terms switch (demonstrates app-level preset via provideNgxSignalFormControlPresets) -->
        <ngx-signal-form-field-wrapper
          [formField]="configForm.acceptTerms"
          [appearance]="appearance()"
        >
          <label for="acceptTerms">Accept terms of service</label>
          <input
            id="acceptTerms"
            type="checkbox"
            role="switch"
            ngxSignalFormControl="switch"
            [formField]="configForm.acceptTerms"
          />
        </ngx-signal-form-field-wrapper>
      </div>

      <!-- Form actions -->
      <div class="mt-8 flex gap-4">
        <button
          type="submit"
          class="btn-primary"
          [disabled]="configForm().submitting()"
        >
          @if (configForm().submitting()) {
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
              Bound control id → deterministic field name
            </dd>
          </div>
        </dl>
      </div>
    </form>
  `,
})
export class GlobalConfigurationComponent {
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');
  readonly appearance = input<FormFieldAppearance>('outline');

  readonly #model = signal({
    userEmail: '',
    userPhone: '',
    userWebsite: '',
    acceptTerms: false,
  });

  readonly configForm = form(this.#model, globalConfigSchema, {
    submission: {
      action: async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 1000);
        });
        this.#model.set({
          userEmail: '',
          userPhone: '',
          userWebsite: '',
          acceptTerms: false,
        });
        this.configForm().reset();
      },
      onInvalid: createOnInvalidHandler(),
    },
  });

  protected resetForm(): void {
    this.configForm().reset();
    this.#model.set({
      userEmail: '',
      userPhone: '',
      userWebsite: '',
      acceptTerms: false,
    });
  }
}
