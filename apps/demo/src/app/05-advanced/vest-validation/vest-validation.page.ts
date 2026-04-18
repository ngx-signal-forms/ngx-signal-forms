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
import { VEST_VALIDATION_CONTENT } from './vest-validation.content';
import { VestValidationComponent } from './vest-validation.form';

@Component({
  selector: 'ngx-vest-validation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    VestValidationComponent,
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
      title="Vest-Only Validation"
      subtitle="Conditional business rules powered entirely by a Vest suite"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <ngx-display-controls-card
      title="Business-rule visibility"
      description="Compare how the same Vest-powered policy errors feel under different display timings and wrapper treatments without changing the validation suite itself."
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
        title="🎨 Policy framing"
        description="Switch the wrapper appearance to check whether conditional business errors stay clear when the surrounding visual hierarchy changes."
      >
        <ngx-appearance-toggle [(value)]="selectedAppearance" />
      </ngx-display-controls-section>

      <ngx-display-controls-section
        title="↔️ Label orientation"
        description="Compare policy-heavy forms with vertical labels and horizontal columns. Outline remains vertical because the floating-label treatment is intentionally preserved."
      >
        <ngx-orientation-toggle
          [(value)]="selectedOrientation"
          [appearance]="selectedAppearance()"
        />
      </ngx-display-controls-section>
    </ngx-display-controls-card>

    <ngx-split-layout>
      <ngx-vest-validation
        [errorDisplayMode]="errorDisplayMode()"
        [appearance]="selectedAppearance()"
        [orientation]="selectedOrientation()"
        left
      />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.accountForm" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class VestValidationPage {
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
  protected readonly content = VEST_VALIDATION_CONTENT;
  protected readonly formRef = viewChild(VestValidationComponent);

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
