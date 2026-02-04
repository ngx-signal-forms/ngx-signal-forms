import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { type FormFieldAppearance } from '@ngx-signal-forms/toolkit';

@Component({
  selector: 'ngx-appearance-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800"
    >
      <button
        type="button"
        (click)="value.set('standard')"
        [class.bg-white]="value() === 'standard'"
        [class.shadow-sm]="value() === 'standard'"
        [class.text-indigo-600]="value() === 'standard'"
        [class.dark:bg-gray-700]="value() === 'standard'"
        [class.dark:text-indigo-400]="value() === 'standard'"
        class="rounded px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        Standard
      </button>
      <button
        type="button"
        (click)="value.set('outline')"
        [class.bg-white]="value() === 'outline'"
        [class.shadow-sm]="value() === 'outline'"
        [class.text-indigo-600]="value() === 'outline'"
        [class.dark:bg-gray-700]="value() === 'outline'"
        [class.dark:text-indigo-400]="value() === 'outline'"
        class="rounded px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        Outline
      </button>
    </div>
  `,
})
export class AppearanceToggleComponent {
  readonly value = model.required<FormFieldAppearance>();
}
