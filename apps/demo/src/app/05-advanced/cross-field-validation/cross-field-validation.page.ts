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
import { CROSS_FIELD_VALIDATION_CONTENT } from './cross-field-validation.content';
import { CrossFieldValidationComponent } from './cross-field-validation.form';

@Component({
  selector: 'ngx-cross-field-validation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    CrossFieldValidationComponent,
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
      title="Cross-Field Validation"
      subtitle="Validations depending on multiple fields"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <ngx-display-controls-card
      title="Dependency rule controls"
      description="Use timing and styling controls to study what happens when one input invalidates another, especially for date ranges and guest-dependent promo logic."
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
        title="🎨 Dependency framing"
        description="Compare wrapper treatments to see which one makes dependent errors easier to read when the problem spans more than one control."
      >
        <ngx-appearance-toggle [(value)]="selectedAppearance" />
      </ngx-display-controls-section>

      <ngx-display-controls-section
        title="↔️ Label orientation"
        description="Compare vertical and horizontal label placement while one field invalidates another. Outline remains vertical so its floating label stays intact."
      >
        <ngx-orientation-toggle
          [(value)]="selectedOrientation"
          [appearance]="selectedAppearance()"
        />
      </ngx-display-controls-section>
    </ngx-display-controls-card>

    <ngx-split-layout>
      <ngx-cross-field-validation
        [errorDisplayMode]="errorDisplayMode()"
        [appearance]="selectedAppearance()"
        [orientation]="selectedOrientation()"
        left
      />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.bookingForm" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class CrossFieldValidationPageComponent {
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
  protected readonly content = CROSS_FIELD_VALIDATION_CONTENT;
  protected readonly formRef = viewChild(CrossFieldValidationComponent);

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
