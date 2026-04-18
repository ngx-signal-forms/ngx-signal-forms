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
import { ASYNC_VALIDATION_CONTENT } from './async-validation.content';
import { AsyncValidationComponent } from './async-validation.form';

@Component({
  selector: 'ngx-async-validation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    AsyncValidationComponent,
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
      title="Async Validation"
      subtitle="Server-side checks with improved UX"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <ngx-display-controls-card
      title="Remote validation timing"
      description="Compare when remote feedback becomes visible while the field moves through idle, pending, and unavailable states, with the network check driving the experience."
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
        title="🎨 Pending-state framing"
        description="Switch the wrapper treatment while testing the loading and unavailable states so you can judge whether the feedback remains legible during network latency."
      >
        <ngx-appearance-toggle [(value)]="selectedAppearance" />
      </ngx-display-controls-section>

      <ngx-display-controls-section
        title="↔️ Label orientation"
        description="Check whether async loading and unavailable feedback still reads clearly when labels move into a horizontal column. Outline stays vertical."
      >
        <ngx-orientation-toggle
          [(value)]="selectedOrientation"
          [appearance]="selectedAppearance()"
        />
      </ngx-display-controls-section>
    </ngx-display-controls-card>

    <ngx-split-layout>
      <ngx-async-validation
        [errorDisplayMode]="errorDisplayMode()"
        [appearance]="selectedAppearance()"
        [orientation]="selectedOrientation()"
        left
      />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.regForm" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class AsyncValidationPageComponent {
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
  protected readonly content = ASYNC_VALIDATION_CONTENT;
  protected readonly formRef = viewChild(AsyncValidationComponent);

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
