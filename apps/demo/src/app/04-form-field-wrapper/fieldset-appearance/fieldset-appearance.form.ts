import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import {
  type NgxFieldsetAppearance,
  type NgxFieldsetFeedbackAppearance,
  type NgxFieldsetSurfaceTone,
  type NgxFieldsetValidationSurface,
  type NgxFormFieldErrorPlacement,
} from '@ngx-signal-forms/toolkit/form-field';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import {
  DisplayControlsCardComponent,
  DisplayControlsSectionComponent,
  SplitLayoutComponent,
} from '../../ui';
import {
  ERROR_DISPLAY_MODES,
  ERROR_DISPLAY_MODE_LABELS,
} from '../../ui/error-display-mode-selector/error-display-mode-selector';
import { FieldsetFormComponent } from '../complex-forms/fieldset.form';

const FEEDBACK_APPEARANCE_OPTIONS: readonly NgxFieldsetFeedbackAppearance[] = [
  'auto',
  'plain',
  'notification',
];

const FEEDBACK_APPEARANCE_LABELS: Record<
  NgxFieldsetFeedbackAppearance,
  string
> = {
  auto: 'Auto',
  plain: 'Plain',
  notification: 'Notification',
};

const FIELDSET_APPEARANCE_OPTIONS: readonly NgxFieldsetAppearance[] = [
  'outline',
  'plain',
];

const FIELDSET_APPEARANCE_LABELS: Record<NgxFieldsetAppearance, string> = {
  outline: 'Bordered',
  plain: 'Semantic only',
};

const SURFACE_TONE_OPTIONS: readonly NgxFieldsetSurfaceTone[] = [
  'default',
  'neutral',
  'info',
  'success',
  'warning',
  'danger',
];

const SURFACE_TONE_LABELS: Record<NgxFieldsetSurfaceTone, string> = {
  default: 'Default',
  neutral: 'Neutral',
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
};

const VALIDATION_SURFACE_OPTIONS: readonly NgxFieldsetValidationSurface[] = [
  'never',
  'always',
];

const VALIDATION_SURFACE_LABELS: Record<NgxFieldsetValidationSurface, string> =
  {
    never: 'Message only',
    always: 'Tint surface',
  };

type FieldsetListStyle = 'plain' | 'bullets';

const LIST_STYLE_OPTIONS: readonly FieldsetListStyle[] = ['bullets', 'plain'];

const LIST_STYLE_LABELS: Record<FieldsetListStyle, string> = {
  bullets: 'Bullets',
  plain: 'Plain text',
};

const ERROR_PLACEMENT_OPTIONS: readonly NgxFormFieldErrorPlacement[] = [
  'top',
  'bottom',
];

const ERROR_DISPLAY_MODE_OPTIONS: readonly ErrorDisplayStrategy[] = [
  'immediate',
  'on-touch',
  'on-submit',
];

const ERROR_PLACEMENT_LABELS: Record<NgxFormFieldErrorPlacement, string> = {
  top: 'Top',
  bottom: 'Bottom',
};

@Component({
  selector: 'ngx-fieldset-appearance-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DisplayControlsCardComponent,
    DisplayControlsSectionComponent,
    FieldsetFormComponent,
    NgxSignalFormDebugger,
    SplitLayoutComponent,
  ],
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .fieldset-appearance-form__control-group {
      display: inline-flex;
      max-width: 100%;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.25rem;
      border: 1px solid rgb(229 231 235 / 0.8);
      border-radius: 9999px;
      background: rgb(255 255 255 / 0.8);
      padding: 0.25rem;
      box-shadow: 0 1px 2px rgb(15 23 42 / 0.08);
      backdrop-filter: blur(10px);
    }

    .fieldset-appearance-form__control-button {
      border: 0;
      border-radius: 9999px;
      background: transparent;
      padding: 0.375rem 1rem;
      font-size: 0.875rem;
      line-height: 1.25rem;
      font-weight: 500;
      color: rgb(75 85 99);
      transition:
        color 150ms ease,
        background-color 150ms ease,
        box-shadow 150ms ease;
    }

    .fieldset-appearance-form__control-button:hover {
      color: rgb(17 24 39);
    }

    .fieldset-appearance-form__control-button:focus-visible {
      outline: 2px solid #005fcc;
      outline-offset: 2px;
    }

    .fieldset-appearance-form__control-button--selected {
      background: #e8f4fb;
      box-shadow: 0 1px 2px rgb(15 23 42 / 0.08);
      color: #005d96;
    }

    .fieldset-appearance-form__primary-panel {
      display: grid;
      gap: 0.9rem;
      min-width: 0;
    }

    .fieldset-appearance-form__primary-title {
      margin: 0;
      font-size: 1.125rem;
      line-height: 1.75rem;
      font-weight: 600;
      color: rgb(17 24 39);
    }

    .fieldset-appearance-form__primary-summary,
    .fieldset-appearance-form__primary-instructions {
      display: grid;
      gap: 0.35rem;
      padding-top: 0.9rem;
    }

    .fieldset-appearance-form__primary-summary {
      border-top: 1px solid rgb(99 102 241 / 0.14);
    }

    .fieldset-appearance-form__primary-instructions {
      border-top: 1px dashed rgb(245 158 11 / 0.38);
    }

    .fieldset-appearance-form__primary-copy {
      font-size: 0.875rem;
      line-height: 1.5rem;
      color: rgb(17 24 39);
    }

    .fieldset-appearance-form__primary-hint {
      font-size: 0.75rem;
      line-height: 1.25rem;
      color: rgb(75 85 99);
    }

    .fieldset-appearance-form__primary-instruction-title {
      font-size: 0.875rem;
      line-height: 1.5rem;
      font-weight: 500;
      color: rgb(146 64 14);
    }

    .fieldset-appearance-form__primary-instruction-copy {
      font-size: 0.75rem;
      line-height: 1.25rem;
      color: rgb(180 83 9);
    }

    :host-context(.dark) .fieldset-appearance-form__control-group {
      border-color: rgb(55 65 81);
      background: rgb(31 41 55 / 0.9);
    }

    :host-context(.dark) .fieldset-appearance-form__control-button {
      color: rgb(209 213 219);
    }

    :host-context(.dark) .fieldset-appearance-form__control-button:hover {
      color: rgb(255 255 255);
    }

    :host-context(.dark) .fieldset-appearance-form__control-button--selected {
      background: rgb(55 65 81);
      color: rgb(147 197 253);
    }

    :host-context(.dark) .fieldset-appearance-form__primary-title,
    :host-context(.dark) .fieldset-appearance-form__primary-copy {
      color: rgb(243 244 246);
    }

    :host-context(.dark) .fieldset-appearance-form__primary-summary {
      border-top-color: rgb(129 140 248 / 0.28);
    }

    :host-context(.dark) .fieldset-appearance-form__primary-hint {
      color: rgb(156 163 175);
    }

    :host-context(.dark) .fieldset-appearance-form__primary-instructions {
      border-top-color: rgb(251 191 36 / 0.34);
    }

    :host-context(.dark) .fieldset-appearance-form__primary-instruction-title {
      color: rgb(253 230 138);
    }

    :host-context(.dark) .fieldset-appearance-form__primary-instruction-copy {
      color: rgb(252 211 77);
    }
  `,
  templateUrl: './fieldset-appearance.form.html',
})
export class FieldsetAppearanceFormComponent {
  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');
  protected readonly selectedFieldsetAppearance =
    signal<NgxFieldsetAppearance>('outline');
  protected readonly selectedFeedbackAppearance =
    signal<NgxFieldsetFeedbackAppearance>('auto');
  protected readonly selectedSurfaceTone =
    signal<NgxFieldsetSurfaceTone>('default');
  protected readonly selectedValidationSurface =
    signal<NgxFieldsetValidationSurface>('never');
  protected readonly selectedListStyle = signal<FieldsetListStyle>('bullets');
  protected readonly selectedErrorPlacement =
    signal<NgxFormFieldErrorPlacement>('bottom');
  protected readonly includeNestedErrors = signal(true);
  protected readonly showNotificationTitle = signal(true);

  protected readonly fieldsetAppearanceOptions = FIELDSET_APPEARANCE_OPTIONS;
  protected readonly fieldsetAppearanceLabels = FIELDSET_APPEARANCE_LABELS;
  protected readonly feedbackAppearanceOptions = FEEDBACK_APPEARANCE_OPTIONS;
  protected readonly feedbackAppearanceLabels = FEEDBACK_APPEARANCE_LABELS;
  protected readonly surfaceToneOptions = SURFACE_TONE_OPTIONS;
  protected readonly surfaceToneLabels = SURFACE_TONE_LABELS;
  protected readonly validationSurfaceOptions = VALIDATION_SURFACE_OPTIONS;
  protected readonly validationSurfaceLabels = VALIDATION_SURFACE_LABELS;
  protected readonly listStyleOptions = LIST_STYLE_OPTIONS;
  protected readonly listStyleLabels = LIST_STYLE_LABELS;
  protected readonly errorDisplayModeLabels = ERROR_DISPLAY_MODE_LABELS;
  protected readonly errorDisplayModeOptions = ERROR_DISPLAY_MODE_OPTIONS;
  protected readonly errorPlacementOptions = ERROR_PLACEMENT_OPTIONS;
  protected readonly errorPlacementLabels = ERROR_PLACEMENT_LABELS;

  protected readonly resolvedNotificationTitle = computed(() => {
    if (
      !this.showNotificationTitle() ||
      this.selectedFeedbackAppearance() === 'plain'
    ) {
      return null;
    }

    return 'Review the grouped fields below';
  });

  protected readonly notificationTitleChip = computed(() =>
    this.resolvedNotificationTitle() ? 'Visible' : 'Hidden',
  );

  protected readonly currentModeConfig = computed(() => {
    return (
      ERROR_DISPLAY_MODES.find((mode) => mode.mode === this.selectedMode()) ??
      ERROR_DISPLAY_MODES[1]
    );
  });

  protected readonly currentModeInstructions = computed(() => {
    switch (this.selectedMode()) {
      case 'immediate':
        return '1. Start typing invalid data → 2. See feedback update instantly → 3. Notice how errors clear as you type';
      case 'inherit':
      case 'on-touch':
        return '1. Click a field → 2. Enter invalid data → 3. Tab away → 4. Observe errors appearing after you leave the field';
      case 'on-submit':
        return '1. Fill the form quickly → 2. Submit without fixing issues → 3. Watch all errors appear together';
      default:
        return '1. Click a field → 2. Enter invalid data → 3. Tab away → 4. Observe errors appearing after you leave the field';
    }
  });

  protected readonly currentControlChips = computed(() => [
    {
      label: 'Mode',
      value: ERROR_DISPLAY_MODE_LABELS[this.selectedMode()],
    },
    {
      label: 'Shell',
      value: FIELDSET_APPEARANCE_LABELS[this.selectedFieldsetAppearance()],
    },
    {
      label: 'Feedback',
      value: FEEDBACK_APPEARANCE_LABELS[this.selectedFeedbackAppearance()],
    },
    {
      label: 'Tone',
      value: SURFACE_TONE_LABELS[this.selectedSurfaceTone()],
    },
    {
      label: 'Validation surface',
      value: VALIDATION_SURFACE_LABELS[this.selectedValidationSurface()],
    },
    {
      label: 'Aggregation',
      value: this.includeNestedErrors() ? 'Include nested' : 'Group only',
    },
    {
      label: 'Placement',
      value: ERROR_PLACEMENT_LABELS[this.selectedErrorPlacement()],
    },
  ]);
}
