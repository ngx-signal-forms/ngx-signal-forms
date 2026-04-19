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
  type FormFieldOrientation,
} from '@ngx-signal-forms/toolkit';
import {
  createOnInvalidHandler,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { globalConfigSchema } from './global-configuration.validations';

/**
 * Global Configuration Component
 *
 * Demonstrates global toolkit configuration with provideNgxSignalFormsConfig()
 * and app-level control presets with provideNgxSignalFormControlPresets().
 * Shows how to:
 * - Set default error display strategies globally
 * - Configure automatic ARIA attributes
 * - Rely on deterministic control ids for ARIA linkage
 * - Apply control-family defaults for switch-style controls
 * - Override global settings per form/field
 *
 * Note: This demo configures both providers in apps/demo/src/main.ts.
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
              This demo app configures toolkit defaults in
              <code class="rounded bg-blue-100 px-1 py-0.5 dark:bg-blue-900"
                >apps/demo/src/main.ts</code
              >. The global
              <code class="rounded bg-blue-100 px-1 py-0.5 dark:bg-blue-900"
                >defaultErrorStrategy</code
              >
              is "on-touch", and the app-level switch preset keeps the terms
              control on the compact inline layout with automatic ARIA. Use the
              selector below to override the timing for this form only.
            </p>
          </div>
        </div>
      </div>

      <!-- Form fields -->
      <div class="space-y-6">
        <!-- Email field with standard id -->
        <ngx-form-field-wrapper
          [formField]="configForm.userEmail"
          [appearance]="appearance()"
          [orientation]="orientation()"
        >
          <label for="userEmail">Email Address *</label>
          <input
            id="userEmail"
            type="email"
            [formField]="configForm.userEmail"
            placeholder="user@example.com"
          />
        </ngx-form-field-wrapper>

        <!-- Phone field with custom data attribute -->
        <ngx-form-field-wrapper
          [formField]="configForm.userPhone"
          [appearance]="appearance()"
          [orientation]="orientation()"
        >
          <label for="userPhone">Phone Number *</label>
          <input
            id="userPhone"
            type="tel"
            [formField]="configForm.userPhone"
            placeholder="123-456-7890"
          />
          <ngx-form-field-hint> Format: 123-456-7890 </ngx-form-field-hint>
        </ngx-form-field-wrapper>

        <!-- Website field (optional) -->
        <ngx-form-field-wrapper
          [formField]="configForm.userWebsite"
          [appearance]="appearance()"
          [orientation]="orientation()"
        >
          <label for="userWebsite">Website</label>
          <input
            id="userWebsite"
            type="url"
            [formField]="configForm.userWebsite"
            placeholder="https://example.com"
          />
          <ngx-form-field-hint>
            Optional - Must be a valid URL if provided
          </ngx-form-field-hint>
        </ngx-form-field-wrapper>

        <!-- Accept terms switch (demonstrates app-level preset via provideNgxSignalFormControlPresets) -->
        <ngx-form-field-wrapper
          [formField]="configForm.acceptTerms"
          [appearance]="appearance()"
          [orientation]="orientation()"
        >
          <label for="acceptTerms">Accept terms of service *</label>
          <input
            id="acceptTerms"
            type="checkbox"
            role="switch"
            ngxSignalFormControl="switch"
            [formField]="configForm.acceptTerms"
          />
        </ngx-form-field-wrapper>
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
              App-level preset:
            </dt>
            <dd class="text-gray-600 dark:text-gray-400">
              switch → inline-control + auto ARIA
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium text-gray-700 dark:text-gray-300">
              Field Resolution:
            </dt>
            <dd class="text-gray-600 dark:text-gray-400">
              Projected control id → deterministic field name
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
  readonly orientation = input<FormFieldOrientation>('vertical');

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
