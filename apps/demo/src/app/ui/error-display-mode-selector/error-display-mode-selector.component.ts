import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { type ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';

export type ErrorDisplayModeConfig = {
  mode: ErrorDisplayStrategy;
  label: string;
  description: string;
  whenToUse: string;
  pros: string[];
  cons: string[];
};

export const ERROR_DISPLAY_MODES: ErrorDisplayModeConfig[] = [
  {
    mode: 'immediate',
    label: 'Immediate',
    description: 'Show errors as the user types',
    whenToUse:
      'Complex input validation (e.g., password strength, format requirements)',
    pros: [
      'Real-time feedback',
      'Prevents invalid submission',
      'Educational for users',
    ],
    cons: [
      'Can be overwhelming',
      'May interrupt flow',
      'Requires careful UX design',
    ],
  },
  {
    mode: 'on-touch',
    label: 'On Touch (Recommended)',
    description: 'Show errors after the user leaves a field',
    whenToUse: 'Most forms - balanced UX with progressive disclosure',
    pros: [
      'Less intrusive',
      'Still provides timely feedback',
      'WCAG recommended',
    ],
    cons: ['Slight delay in feedback', 'Requires tab/click to trigger'],
  },
  {
    mode: 'on-submit',
    label: 'On Submit',
    description: 'Show errors only when the form is submitted',
    whenToUse: 'Simple forms or when you want minimal interruption',
    pros: ['No interruptions during input', 'Clean UI', 'Fast data entry'],
    cons: [
      'Late feedback',
      'Potentially frustrating',
      'Higher abandonment risk',
    ],
  },
  {
    mode: 'manual',
    label: 'Manual',
    description: 'Full control over when errors are displayed',
    whenToUse: 'Guided flows, wizards, or custom validation UX',
    pros: ['Complete flexibility', 'Custom workflows', 'Unique UX patterns'],
    cons: ['Requires manual implementation', 'Easy to miss edge cases'],
  },
];

/**
 * Reusable Error Display Mode Selector Component
 *
 * Allows switching between different error display modes with
 * educational context about each mode's characteristics.
 */
@Component({
  selector: 'ngx-error-display-mode-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Mode Selector Section -->
    <div class="error-mode-wrapper">
      <div class="mb-4">
        <fieldset>
          <legend
            class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            🎛️ Error Display Mode
          </legend>
          <div class="flex flex-wrap gap-4">
            @for (modeConfig of errorDisplayModes; track modeConfig.mode) {
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="errorDisplayMode"
                  [value]="modeConfig.mode"
                  [checked]="selectedMode() === modeConfig.mode"
                  (change)="selectedMode.set($any($event.target).value)"
                  class="form-radio h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >{{ modeConfig.label }}</span
                >
              </label>
            }
          </div>
        </fieldset>
      </div>

      <div class="error-mode-summary">
        <div class="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {{ currentModeConfig().description }}
        </div>
        <div class="text-xs text-gray-600 dark:text-gray-400">
          <strong>When to use:</strong> {{ currentModeConfig().whenToUse }}
        </div>
      </div>

      <!-- Testing Instructions -->
      <div class="error-mode-instructions">
        <div class="text-sm font-medium text-amber-800 dark:text-amber-200">
          🧪 Try this with "{{ currentModeConfig().label }}":
        </div>
        <div class="mt-1 text-xs text-amber-700 dark:text-amber-300">
          @switch (selectedMode()) {
            @case ('immediate') {
              1. Start typing invalid data → 2. See feedback update instantly →
              3. Notice how errors clear as you type
            }
            @case ('on-touch') {
              1. Click a field → 2. Enter invalid data → 3. Tab away → 4.
              Observe errors appearing after you leave the field
            }
            @case ('on-submit') {
              1. Fill the form quickly → 2. Submit without fixing issues → 3.
              Watch all errors appear together
            }
            @case ('manual') {
              1. Interact with fields → 2. Notice no automatic errors → 3.
              Imagine controlling error display yourself (e.g., via guided
              flows)
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class ErrorDisplayModeSelectorComponent {
  /**
   * Two-way bindable error display mode
   * Use with [(selectedMode)]="myMode" for automatic two-way binding
   */
  readonly selectedMode = model.required<ErrorDisplayStrategy>();

  protected readonly errorDisplayModes = ERROR_DISPLAY_MODES;

  protected readonly currentModeConfig = () =>
    this.errorDisplayModes.find((mode) => mode.mode === this.selectedMode()) ||
    this.errorDisplayModes[1];
}
