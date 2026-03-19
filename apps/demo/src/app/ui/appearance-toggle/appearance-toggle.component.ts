import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { type FormFieldAppearance } from '@ngx-signal-forms/toolkit';

@Component({
  selector: 'ngx-appearance-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="inline-flex items-center gap-1 rounded-full border border-gray-200/80 bg-white/80 p-1 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90"
    >
      <button
        type="button"
        (click)="value.set('standard')"
        [attr.aria-pressed]="value() === 'standard'"
        [class.bg-[#e8f4fb]]="value() === 'standard'"
        [class.shadow-sm]="value() === 'standard'"
        [class.text-[#005d96]]="value() === 'standard'"
        [class.dark:bg-gray-700]="value() === 'standard'"
        [class.dark:text-blue-300]="value() === 'standard'"
        class="rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 transition-all hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005fcc] dark:text-gray-300 dark:hover:text-white"
      >
        Standard
      </button>
      <button
        type="button"
        (click)="value.set('outline')"
        [attr.aria-pressed]="value() === 'outline'"
        [class.bg-[#e8f4fb]]="value() === 'outline'"
        [class.shadow-sm]="value() === 'outline'"
        [class.text-[#005d96]]="value() === 'outline'"
        [class.dark:bg-gray-700]="value() === 'outline'"
        [class.dark:text-blue-300]="value() === 'outline'"
        class="rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 transition-all hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005fcc] dark:text-gray-300 dark:hover:text-white"
      >
        Outline
      </button>
    </div>
  `,
})
export class AppearanceToggleComponent {
  readonly value = model.required<FormFieldAppearance>();
}
