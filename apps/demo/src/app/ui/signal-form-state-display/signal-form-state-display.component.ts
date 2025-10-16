import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { FieldState } from '@angular/forms/signals';

/**
 * Simple Form State Display for Angular Signal Forms
 *
 * Displays the current state of a Signal Form including:
 * - Form validity (valid/invalid)
 * - Current model values
 * - Error messages
 * - Field states (dirty, touched, pending)
 *
 * @example
 * ```typescript
 * <ngx-signal-form-state-display
 *   [form]="myForm"
 *   title="Contact Form"
 * />
 * ```
 */
@Component({
  selector: 'ngx-signal-form-state-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe],
  template: `
    <div
      class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <!-- Header -->
      <div
        class="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700"
      >
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">
            {{ title() }}
          </h3>
          <!-- Status Badge -->
          @if (formState().valid()) {
            <span
              class="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
            >
              ✓ Valid
            </span>
          } @else if (formState().pending()) {
            <span
              class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
            >
              ⏳ Validating
            </span>
          } @else {
            <span
              class="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800"
            >
              ✗ Invalid ({{ errorCount() }} errors)
            </span>
          }
        </div>
      </div>

      <!-- Content -->
      <div class="space-y-4 p-6">
        <!-- Model Values -->
        <div>
          <h4
            class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            📦 Model Values
          </h4>
          <pre
            class="overflow-x-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900"
          ><code>{{ formState().value() | json }}</code></pre>
        </div>

        <!-- Errors -->
        @if (hasErrors()) {
          <div>
            <h4
              class="mb-2 text-sm font-semibold text-red-700 dark:text-red-300"
            >
              ❌ Validation Errors
            </h4>
            <div class="space-y-2">
              @for (error of formState().errors(); track error.kind) {
                <div
                  class="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300"
                >
                  <strong>{{ error.kind }}:</strong>
                  {{ error.message }}
                </div>
              }
            </div>
          </div>
        }

        <!-- States -->
        <div>
          <h4
            class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            🔄 Form States
          </h4>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="rounded bg-gray-50 p-2 dark:bg-gray-900">
              <span class="font-medium">dirty:</span>
              <span
                [class.text-amber-600]="formState().dirty()"
                [class.text-gray-500]="!formState().dirty()"
              >
                {{ formState().dirty() }}
              </span>
            </div>
            <div class="rounded bg-gray-50 p-2 dark:bg-gray-900">
              <span class="font-medium">touched:</span>
              <span
                [class.text-blue-600]="formState().touched()"
                [class.text-gray-500]="!formState().touched()"
              >
                {{ formState().touched() }}
              </span>
            </div>
            <div class="rounded bg-gray-50 p-2 dark:bg-gray-900">
              <span class="font-medium">valid:</span>
              <span
                [class.text-green-600]="formState().valid()"
                [class.text-gray-500]="!formState().valid()"
              >
                {{ formState().valid() }}
              </span>
            </div>
            <div class="rounded bg-gray-50 p-2 dark:bg-gray-900">
              <span class="font-medium">pending:</span>
              <span
                [class.text-blue-600]="formState().pending()"
                [class.text-gray-500]="!formState().pending()"
              >
                {{ formState().pending() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SignalFormStateDisplayComponent {
  /** The Signal Form state to display */
  readonly form = input.required<FieldState<Record<string, unknown>>>();

  /** Title for the display component */
  readonly title = input<string>('Form State');

  /** Access the form state directly */
  protected readonly formState = this.form;

  /** Check if there are errors */
  protected readonly hasErrors = computed(
    () => this.formState().errors().length > 0,
  );

  /** Count total errors */
  protected readonly errorCount = computed(
    () => this.formState().errors().length,
  );
}
