import { Component, input, model } from '@angular/core';
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

  template: `
    <div
      class="inline-flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-gray-200/80 bg-white/80 p-1 shadow-sm backdrop-blur-sm [corner-shape:squircle] dark:border-gray-700 dark:bg-gray-800/90"
      role="group"
      aria-label="Field orientation"
    >
      @for (orientation of orientationOptions; track orientation) {
        <button
          type="button"
          (click)="value.set(orientation)"
          [disabled]="isDisabled(orientation)"
          [attr.aria-pressed]="value() === orientation"
          [class.bg-selected]="value() === orientation"
          [class.shadow-sm]="value() === orientation"
          [class.text-on-selected]="value() === orientation"
          class="focus-visible:outline-border-focus rounded-xl px-3 py-1.5 text-sm font-medium text-gray-600 transition-all [corner-shape:squircle] hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:text-white"
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
