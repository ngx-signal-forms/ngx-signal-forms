import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import {
  type ErrorDisplayStrategy,
  type FormFieldAppearance,
  type FormFieldOrientation,
} from '@ngx-signal-forms/toolkit';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import {
  AppearanceToggleComponent,
  DisplayControlsCardComponent,
  DisplayControlsSectionComponent,
  ExampleCardsComponent,
  OrientationToggleComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import { APPEARANCE_LABELS } from '../../ui/appearance-toggle';
import {
  getOrientationLabel,
  isOrientationDisabledForAppearance,
} from '../../ui/orientation-toggle';
import {
  ERROR_DISPLAY_MODE_LABELS,
  ErrorDisplayModeSelectorComponent,
} from '../../ui/error-display-mode-selector/error-display-mode-selector';
import { SUBMISSION_PATTERNS_CONTENT } from './submission-patterns.content';
import { SubmissionPatternsComponent } from './submission-patterns.form';

/**
 * Submission Patterns Page
 *
 * Demonstrates form submission patterns with async operations and server errors.
 */
@Component({
  selector: 'ngx-submission-patterns-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    SubmissionPatternsComponent,
    ExampleCardsComponent,
    ErrorDisplayModeSelectorComponent,
    AppearanceToggleComponent,
    OrientationToggleComponent,
    DisplayControlsCardComponent,
    DisplayControlsSectionComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  template: `
    <ngx-page-header
      title="Form Submission Patterns"
      subtitle="Async operations, server errors, and WCAG 2.2 compliance"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <ngx-display-controls-card
      title="Submission phase controls"
      description="Use the same registration flow to compare three moments in the lifecycle: pre-submit guidance, the submit attempt itself, and the server response that follows."
      [chips]="currentControlChips()"
      layout="split"
    >
      <ngx-error-display-mode-selector
        [(selectedMode)]="errorDisplayMode"
        [embedded]="true"
        display-controls-primary
        class="block min-w-0"
      />

      <ngx-display-controls-section
        title="🎨 Submission styling"
        description="Stress-test loading, success, and server-error states under both wrapper treatments without changing the underlying submission contract."
      >
        <ngx-appearance-toggle [(value)]="selectedAppearance" />
      </ngx-display-controls-section>

      <ngx-display-controls-section
        title="↔️ Label orientation"
        description="Switch between vertical labels and horizontal label columns while checking pre-submit, submitting, and server-error states. Outline remains vertical only."
      >
        <ngx-orientation-toggle
          [(value)]="selectedOrientation"
          [appearance]="selectedAppearance()"
        />
      </ngx-display-controls-section>
    </ngx-display-controls-card>

    <ngx-split-layout>
      <ngx-submission-patterns
        [errorDisplayMode]="errorDisplayMode()"
        [appearance]="selectedAppearance()"
        [orientation]="selectedOrientation()"
        left
      />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.registrationForm" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class SubmissionPatternsPage {
  protected readonly errorDisplayMode =
    signal<ErrorDisplayStrategy>('on-touch');
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('outline');
  protected readonly selectedOrientation =
    signal<FormFieldOrientation>('vertical');
  protected readonly currentControlChips = computed(() => [
    {
      label: 'Mode',
      value: ERROR_DISPLAY_MODE_LABELS[this.errorDisplayMode()],
    },
    {
      label: 'Appearance',
      value: APPEARANCE_LABELS[this.selectedAppearance()],
    },
    {
      label: 'Orientation',
      value: getOrientationLabel(this.selectedOrientation()),
    },
  ]);
  protected readonly content = SUBMISSION_PATTERNS_CONTENT;
  protected readonly formRef = viewChild(SubmissionPatternsComponent);

  constructor() {
    effect(() => {
      if (
        isOrientationDisabledForAppearance(
          this.selectedAppearance(),
          this.selectedOrientation(),
        )
      ) {
        this.selectedOrientation.set('vertical');
      }
    });
  }
}
