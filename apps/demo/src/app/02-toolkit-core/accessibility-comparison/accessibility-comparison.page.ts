import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ExampleCardsComponent, SignalFormDebuggerComponent } from '../../ui';
import { ACCESSIBILITY_COMPARISON_CONTENT } from './accessibility-comparison.content';
import { AccessibilityManualFormComponent } from './accessibility-comparison.manual.form';
import { AccessibilityToolkitFormComponent } from './accessibility-comparison.toolkit.form';

/**
 * Accessibility Comparison Page
 *
 * Side-by-side comparison of manual vs toolkit implementations
 * Shows the dramatic code reduction and automatic WCAG 2.2 compliance
 */
@Component({
  selector: 'ngx-accessibility-comparison-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleCardsComponent,
    AccessibilityManualFormComponent,
    AccessibilityToolkitFormComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <header class="mb-8">
      <h1 class="page-title">Accessibility Comparison</h1>
      <p class="page-subtitle">
        Compare manual WCAG implementation vs automatic toolkit enhancements
      </p>
    </header>

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <!-- Side-by-Side Comparison -->
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- Manual Implementation -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
              ❌ Manual Implementation
            </h2>
            <span
              class="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
            >
              95 Lines
            </span>
          </div>

          <div
            class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <ngx-accessibility-manual-form />
          </div>
        </div>

        <!-- Toolkit Implementation -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
              ✅ Toolkit Implementation
            </h2>
            <span
              class="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300"
            >
              31 Lines
            </span>
          </div>

          <div
            class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <ngx-accessibility-toolkit-form #toolkitForm />
          </div>
        </div>
      </div>

      <!-- Form State Debugger (Toolkit Form) -->
      @if (toolkitForm) {
        <div class="mt-8">
          <ngx-signal-form-debugger
            [formTree]="toolkitForm.signupForm()"
            title="Toolkit Form State"
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
