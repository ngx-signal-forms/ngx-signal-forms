import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import type { NgxFormFieldListStyle } from '@ngx-signal-forms/toolkit/assistive';
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
  ERROR_DISPLAY_MODE_LABELS,
  ErrorDisplayModeSelectorComponent,
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

const LIST_STYLE_OPTIONS: readonly NgxFormFieldListStyle[] = [
  'bullets',
  'plain',
];

const LIST_STYLE_LABELS: Record<NgxFormFieldListStyle, string> = {
  bullets: 'Bullets',
  plain: 'Plain text',
};

const ERROR_PLACEMENT_OPTIONS: readonly NgxFormFieldErrorPlacement[] = [
  'top',
  'bottom',
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
    ErrorDisplayModeSelectorComponent,
    FieldsetFormComponent,
    NgxSignalFormDebugger,
    SplitLayoutComponent,
  ],
  templateUrl: './fieldset-appearance.form.html',
})
export class FieldsetAppearanceFormComponent {
  protected readonly controlGroupClass =
    'inline-flex items-center gap-1 rounded-full border border-gray-200/80 bg-white/80 p-1 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90';
  protected readonly controlButtonClass =
    'rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 transition-all hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005fcc] dark:text-gray-300 dark:hover:text-white';

  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');
  protected readonly selectedFieldsetAppearance =
    signal<NgxFieldsetAppearance>('outline');
  protected readonly selectedFeedbackAppearance =
    signal<NgxFieldsetFeedbackAppearance>('auto');
  protected readonly selectedSurfaceTone =
    signal<NgxFieldsetSurfaceTone>('default');
  protected readonly selectedValidationSurface =
    signal<NgxFieldsetValidationSurface>('never');
  protected readonly selectedListStyle =
    signal<NgxFormFieldListStyle>('bullets');
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
