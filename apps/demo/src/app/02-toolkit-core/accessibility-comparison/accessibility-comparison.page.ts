import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SignalFormDebuggerComponent,
} from '../../ui';
import { ACCESSIBILITY_COMPARISON_CONTENT } from './accessibility-comparison.content';
import { AccessibilityManualFormComponent } from './accessibility-comparison.manual.form';
import { AccessibilityMinimalFormComponent } from './accessibility-comparison.minimal.form';
import { AccessibilityToolkitFormComponent } from './accessibility-comparison.toolkit.form';

/**
 * Accessibility Comparison Page
 *
 * Three-way comparison showing progression from manual to full toolkit:
 * 1. Manual - No toolkit, all ARIA attributes manually added
 * 2. Minimal Toolkit - Auto-ARIA but no [ngxSignalForm] binding
 * 3. Full Toolkit - Complete toolkit with [ngxSignalForm] and error components
 */
@Component({
  selector: 'ngx-accessibility-comparison-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleCardsComponent,
    AccessibilityManualFormComponent,
    AccessibilityMinimalFormComponent,
    AccessibilityToolkitFormComponent,
    PageHeaderComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <ngx-page-header
      title="Accessibility Comparison"
      subtitle="Compare manual, minimal toolkit, and full toolkit implementations"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <!-- Three-Way Comparison -->
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <!-- Manual Implementation -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              ❌ Manual
            </h2>
            <span
              class="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
            >
              95 Lines
            </span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            No toolkit. All ARIA attributes manually added.
          </p>

          <div
            class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <ngx-accessibility-manual-form />
          </div>
        </div>

        <!-- Minimal Toolkit Implementation -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              🔧 Minimal Toolkit
            </h2>
            <span
              class="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            >
              55 Lines
            </span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Auto-ARIA +
            <code>&lt;ngx-signal-form-field-wrapper&gt;</code> without
            <code>[ngxSignalForm]</code>.
          </p>

          <div
            class="rounded-lg border border-blue-200 bg-white p-4 shadow-sm dark:border-blue-700 dark:bg-gray-800"
          >
            <ngx-accessibility-minimal-form />
          </div>
        </div>

        <!-- Full Toolkit Implementation -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              ✅ Full Toolkit
            </h2>
            <span
              class="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300"
            >
              31 Lines
            </span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Complete toolkit with <code>[ngxSignalForm]</code> and error
            components.
          </p>

          <div
            class="rounded-lg border border-green-200 bg-white p-4 shadow-sm dark:border-green-700 dark:bg-gray-800"
          >
            <ngx-accessibility-toolkit-form #toolkitForm />
          </div>
        </div>
      </div>

      <!-- Comparison Table -->
      <div class="mt-8 overflow-x-auto">
        <table
          class="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700"
        >
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800">
              <th
                class="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white"
              >
                Feature
              </th>
              <th class="px-4 py-3 text-center font-semibold text-yellow-700">
                Manual
              </th>
              <th class="px-4 py-3 text-center font-semibold text-blue-700">
                Minimal
              </th>
              <th class="px-4 py-3 text-center font-semibold text-green-700">
                Full
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td class="px-4 py-2 text-gray-700 dark:text-gray-300">
                Auto <code>novalidate</code> on form
              </td>
              <td class="px-4 py-2 text-center">❌</td>
              <td class="px-4 py-2 text-center">✅</td>
              <td class="px-4 py-2 text-center">✅</td>
            </tr>
            <tr>
              <td class="px-4 py-2 text-gray-700 dark:text-gray-300">
                Auto <code>aria-invalid</code>
              </td>
              <td class="px-4 py-2 text-center">❌</td>
              <td class="px-4 py-2 text-center">✅</td>
              <td class="px-4 py-2 text-center">✅</td>
            </tr>
            <tr>
              <td class="px-4 py-2 text-gray-700 dark:text-gray-300">
                Auto <code>aria-describedby</code>
              </td>
              <td class="px-4 py-2 text-center">❌</td>
              <td class="px-4 py-2 text-center">✅</td>
              <td class="px-4 py-2 text-center">✅</td>
            </tr>
            <tr>
              <td class="px-4 py-2 text-gray-700 dark:text-gray-300">
                <code>&lt;ngx-signal-form-field-wrapper&gt;</code> auto errors
              </td>
              <td class="px-4 py-2 text-center">❌</td>
              <td class="px-4 py-2 text-center">✅</td>
              <td class="px-4 py-2 text-center">✅</td>
            </tr>
            <tr>
              <td class="px-4 py-2 text-gray-700 dark:text-gray-300">
                Form-level <code>[errorStrategy]</code>
              </td>
              <td class="px-4 py-2 text-center">❌</td>
              <td class="px-4 py-2 text-center">❌</td>
              <td class="px-4 py-2 text-center">✅</td>
            </tr>
            <tr>
              <td class="px-4 py-2 text-gray-700 dark:text-gray-300">
                <code>submittedStatus</code> in child components
              </td>
              <td class="px-4 py-2 text-center">❌</td>
              <td class="px-4 py-2 text-center">❌</td>
              <td class="px-4 py-2 text-center">✅</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Form State Debugger (Toolkit Form) -->
      @if (toolkitForm) {
        <div class="mt-8">
          <ngx-signal-form-debugger
            [formTree]="toolkitForm.signupForm()"
            title="Full Toolkit Form State"
          />
        </div>
      }
    </ngx-example-cards>
  `,
})
export class AccessibilityComparisonPageComponent {
  protected readonly content = ACCESSIBILITY_COMPARISON_CONTENT;
  protected readonly toolkitForm =
    viewChild<AccessibilityToolkitFormComponent>('toolkitForm');
}
