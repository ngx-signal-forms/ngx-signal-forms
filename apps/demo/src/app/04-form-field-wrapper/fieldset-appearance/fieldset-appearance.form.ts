import { Component, computed, input, signal } from '@angular/core';
import type {
  FormFieldAppearance,
  ResolvedErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import {
  type NgxFormFieldsetAppearance,
  type NgxFormFieldsetFeedbackAppearance,
  type NgxFormFieldsetSurfaceTone,
  type NgxFormFieldsetValidationSurface,
  type NgxFormFieldErrorPlacement,
} from '@ngx-signal-forms/toolkit/form-field';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/debugger';
import {
  AppearanceToggleComponent,
  DisplayControlsCardComponent,
  DisplayControlsSectionComponent,
  NgxPageControlsDirective,
  OrientationToggleComponent,
  SplitLayoutComponent,
} from '../../ui';
import { APPEARANCE_LABELS } from '../../ui/appearance-toggle';
import {
  ERROR_DISPLAY_MODES,
  ERROR_DISPLAY_MODE_LABELS,
} from '../../ui/error-display-mode-selector/error-display-mode-selector';
import {
  createOrientationSelection,
  getOrientationLabel,
} from '../../ui/orientation-toggle';
import {
  FieldsetFormComponent,
  type FieldsetExample,
} from '../complex-forms/fieldset.form';

const FEEDBACK_APPEARANCE_OPTIONS: readonly NgxFormFieldsetFeedbackAppearance[] =
  ['auto', 'plain', 'notification'];

const FEEDBACK_APPEARANCE_LABELS: Record<
  NgxFormFieldsetFeedbackAppearance,
  string
> = {
  auto: 'Auto',
  plain: 'Plain',
  notification: 'Notification',
};

const FIELDSET_APPEARANCE_OPTIONS: readonly NgxFormFieldsetAppearance[] = [
  'outline',
  'plain',
];

const FIELDSET_APPEARANCE_LABELS: Record<NgxFormFieldsetAppearance, string> = {
  outline: 'Bordered',
  plain: 'Semantic only',
};

const SURFACE_TONE_OPTIONS: readonly NgxFormFieldsetSurfaceTone[] = [
  'default',
  'neutral',
  'info',
  'success',
  'warning',
  'danger',
];

const SURFACE_TONE_LABELS: Record<NgxFormFieldsetSurfaceTone, string> = {
  default: 'Default',
  neutral: 'Neutral',
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
};

const VALIDATION_SURFACE_OPTIONS: readonly NgxFormFieldsetValidationSurface[] =
  ['never', 'always'];

const VALIDATION_SURFACE_LABELS: Record<
  NgxFormFieldsetValidationSurface,
  string
> = {
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

const ERROR_DISPLAY_MODE_OPTIONS: readonly ResolvedErrorDisplayStrategy[] = [
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

  imports: [
    AppearanceToggleComponent,
    DisplayControlsCardComponent,
    DisplayControlsSectionComponent,
    FieldsetFormComponent,
    NgxPageControlsDirective,
    NgxSignalFormDebugger,
    OrientationToggleComponent,
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
      border: 1px solid
        light-dark(
          color-mix(in oklab, var(--color-gray-200) 80%, transparent),
          var(--color-gray-700)
        );
      border-radius: 1rem;
      corner-shape: squircle;
      background: light-dark(
        color-mix(in oklab, var(--color-white) 80%, transparent),
        color-mix(in oklab, var(--color-gray-800) 90%, transparent)
      );
      padding: 0.25rem;
      box-shadow: 0 1px 2px rgb(15 23 42 / 0.08);
      backdrop-filter: blur(10px);
    }

    .fieldset-appearance-form__control-button {
      border: 0;
      border-radius: 0.75rem;
      corner-shape: squircle;
      background: transparent;
      padding: 0.375rem 1rem;
      font-size: 0.875rem;
      line-height: 1.25rem;
      font-weight: 500;
      color: light-dark(var(--color-gray-600), var(--color-gray-300));
      transition:
        color 150ms ease,
        background-color 150ms ease,
        box-shadow 150ms ease;
    }

    .fieldset-appearance-form__control-button:hover {
      color: light-dark(var(--color-gray-900), var(--color-white));
    }

    .fieldset-appearance-form__control-button:focus-visible {
      outline: 2px solid var(--color-border-focus);
      outline-offset: 2px;
    }

    .fieldset-appearance-form__control-button--selected {
      background: var(--color-selected);
      box-shadow: 0 1px 2px rgb(15 23 42 / 0.08);
      color: var(--color-on-selected);
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
      color: light-dark(var(--color-gray-900), var(--color-gray-100));
    }

    .fieldset-appearance-form__primary-summary,
    .fieldset-appearance-form__primary-instructions {
      display: grid;
      gap: 0.35rem;
      padding-top: 0.9rem;
    }

    .fieldset-appearance-form__primary-summary {
      border-top: 1px solid
        light-dark(rgb(99 102 241 / 0.14), rgb(129 140 248 / 0.28));
    }

    .fieldset-appearance-form__primary-instructions {
      border-top: 1px dashed
        light-dark(rgb(245 158 11 / 0.38), rgb(251 191 36 / 0.34));
    }

    .fieldset-appearance-form__primary-copy {
      font-size: 0.875rem;
      line-height: 1.5rem;
      color: light-dark(var(--color-gray-900), var(--color-gray-100));
    }

    .fieldset-appearance-form__primary-hint {
      font-size: 0.75rem;
      line-height: 1.25rem;
      color: light-dark(var(--color-gray-600), var(--color-gray-400));
    }

    .fieldset-appearance-form__primary-instruction-title {
      font-size: 0.875rem;
      line-height: 1.5rem;
      font-weight: 500;
      color: light-dark(rgb(146 64 14), rgb(253 230 138));
    }

    .fieldset-appearance-form__primary-instruction-copy {
      font-size: 0.75rem;
      line-height: 1.25rem;
      color: light-dark(rgb(180 83 9), rgb(252 211 77));
    }
  `,
  templateUrl: './fieldset-appearance.form.html',
})
export class FieldsetAppearanceFormComponent {
  readonly example = input<FieldsetExample>('appearance');
  protected readonly selectedMode =
    signal<ResolvedErrorDisplayStrategy>('on-touch');
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('standard');
  protected readonly selectedOrientation = createOrientationSelection(
    this.selectedAppearance,
  );
  protected readonly selectedFieldsetAppearance =
    signal<NgxFormFieldsetAppearance>('outline');
  protected readonly selectedFeedbackAppearance =
    signal<NgxFormFieldsetFeedbackAppearance>('auto');
  protected readonly selectedSurfaceTone =
    signal<NgxFormFieldsetSurfaceTone>('default');
  protected readonly selectedValidationSurface =
    signal<NgxFormFieldsetValidationSurface>('never');
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
      label: 'Appearance',
      value: APPEARANCE_LABELS[this.selectedAppearance()],
    },
    {
      label: 'Orientation',
      value: getOrientationLabel(this.selectedOrientation()),
    },
    ...(this.example() === 'feedback'
      ? []
      : [
          {
            label: 'Shell',
            value:
              FIELDSET_APPEARANCE_LABELS[this.selectedFieldsetAppearance()],
          },
        ]),
    ...(this.example() === 'appearance'
      ? []
      : [
          {
            label: 'Feedback',
            value:
              FEEDBACK_APPEARANCE_LABELS[this.selectedFeedbackAppearance()],
          },
        ]),
    ...(this.example() === 'feedback'
      ? []
      : [
          {
            label: 'Tone',
            value: SURFACE_TONE_LABELS[this.selectedSurfaceTone()],
          },
          {
            label: 'Validation surface',
            value: VALIDATION_SURFACE_LABELS[this.selectedValidationSurface()],
          },
        ]),
    ...(this.example() === 'composition'
      ? [
          {
            label: 'Aggregation',
            value: this.includeNestedErrors() ? 'Include nested' : 'Group only',
          },
        ]
      : []),
    ...(this.example() === 'appearance'
      ? []
      : [
          {
            label: 'Placement',
            value: ERROR_PLACEMENT_LABELS[this.selectedErrorPlacement()],
          },
          { label: 'List', value: LIST_STYLE_LABELS[this.selectedListStyle()] },
          { label: 'Title', value: this.notificationTitleChip() },
        ]),
  ]);
}
