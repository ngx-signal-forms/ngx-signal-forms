import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import type {
  FormFieldAppearance,
  FormFieldOrientation,
} from '@ngx-signal-forms/toolkit';
import {
  isOrientationDisabledForAppearance,
  ORIENTATION_LABELS,
  ORIENTATION_OPTIONS,
} from './orientation.constants';

@Component({
  selector: 'ngx-orientation-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="inline-flex items-center gap-1 rounded-full border border-gray-200/80 bg-white/80 p-1 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90"
      role="group"
      aria-label="Field orientation"
    >
      @for (orientation of orientationOptions; track orientation) {
        <button
          type="button"
          (click)="value.set(orientation)"
          [disabled]="isDisabled(orientation)"
          [attr.aria-pressed]="value() === orientation"
          [class.bg-[#e8f4fb]]="value() === orientation"
          [class.shadow-sm]="value() === orientation"
          [class.text-[#005d96]]="value() === orientation"
          [class.dark:bg-gray-700]="value() === orientation"
          [class.dark:text-blue-300]="value() === orientation"
          class="rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 transition-all hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005fcc] disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:text-white"
        >
          {{ orientationLabels[orientation] }}
        </button>
      }
    </div>
  `,
})
export class OrientationToggleComponent {
  protected readonly orientationLabels = ORIENTATION_LABELS;
  protected readonly orientationOptions = ORIENTATION_OPTIONS;

  readonly appearance = input<FormFieldAppearance>('standard');
  readonly value = model.required<FormFieldOrientation>();

  protected isDisabled(orientation: FormFieldOrientation): boolean {
    return isOrientationDisabledForAppearance(this.appearance(), orientation);
  }
}
