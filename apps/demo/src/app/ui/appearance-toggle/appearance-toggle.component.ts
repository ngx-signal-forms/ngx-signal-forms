import {
  ChangeDetectionStrategy,
  Component,
  computed,
  model,
} from '@angular/core';
import type { FormFieldAppearance } from '@ngx-signal-forms/toolkit';
import { APPEARANCE_LABELS, APPEARANCE_OPTIONS } from './appearance.constants';

@Component({
  selector: 'ngx-appearance-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="inline-flex items-center gap-1 rounded-full border border-gray-200/80 bg-white/80 p-1 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90"
    >
      @for (appearance of appearanceOptions; track appearance) {
        <button
          type="button"
          (click)="value.set(appearance)"
          [attr.aria-pressed]="normalizedValue() === appearance"
          [class.bg-[#e8f4fb]]="normalizedValue() === appearance"
          [class.shadow-sm]="normalizedValue() === appearance"
          [class.text-[#005d96]]="normalizedValue() === appearance"
          [class.dark:bg-gray-700]="normalizedValue() === appearance"
          [class.dark:text-blue-300]="normalizedValue() === appearance"
          class="rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 transition-all hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005fcc] dark:text-gray-300 dark:hover:text-white"
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

  protected readonly normalizedValue = computed(() => this.value());
}
