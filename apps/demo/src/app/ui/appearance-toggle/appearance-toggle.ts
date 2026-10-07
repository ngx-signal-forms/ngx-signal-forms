import { Component, model } from '@angular/core';
import type { FormFieldAppearance } from '@ngx-signal-forms/toolkit';
import { APPEARANCE_LABELS, APPEARANCE_OPTIONS } from './appearance.constants';

@Component({
  selector: 'ngx-appearance-toggle',

  template: `
    <div
      class="inline-flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-gray-200/80 bg-white/80 p-1 shadow-sm backdrop-blur-sm [corner-shape:squircle] dark:border-gray-700 dark:bg-gray-800/90"
      role="group"
      aria-label="Field appearance"
    >
      @for (appearance of appearanceOptions; track appearance) {
        <button
          type="button"
          (click)="value.set(appearance)"
          [attr.aria-pressed]="value() === appearance"
          [class.bg-selected]="value() === appearance"
          [class.shadow-sm]="value() === appearance"
          [class.text-on-selected]="value() === appearance"
          class="focus-visible:outline-border-focus rounded-xl px-3 py-1.5 text-sm font-medium text-gray-600 transition-all [corner-shape:squircle] hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-gray-300 dark:hover:text-white"
        >
          {{ appearanceLabels[appearance] }}
        </button>
      }
    </div>
  `,
})
export class AppearanceToggleComponent {
  protected readonly appearanceLabels = APPEARANCE_LABELS;
  protected readonly appearanceOptions = APPEARANCE_OPTIONS;

  readonly value = model.required<FormFieldAppearance>();
}
