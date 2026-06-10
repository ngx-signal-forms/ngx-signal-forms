import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import {
  type ErrorDisplayStrategy,
  type FormFieldAppearance,
  type FormFieldOrientation,
} from '@ngx-signal-forms/toolkit';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/debugger';
import {
  AppearanceToggleComponent,
  DisplayControlsCardComponent,
  DisplayControlsSectionComponent,
  ExampleCardsComponent,
  NgxPageControlsDirective,
  OrientationToggleComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import { APPEARANCE_LABELS } from '../../ui/appearance-toggle';
import {
  getOrientationLabel,
  normalizeOrientationForAppearance,
} from '../../ui/orientation-toggle';
import {
  ERROR_DISPLAY_MODE_LABELS,
  ErrorDisplayModeSelectorComponent,
} from '../../ui/error-display-mode-selector/error-display-mode-selector';
import { ASYNC_VALIDATION_CONTENT } from './async-validation.content';
import { AsyncValidationComponent } from './async-validation.form';

@Component({
  selector: 'ngx-async-validation-page',

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
    NgxPageControlsDirective,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  template: `
    <ng-template ngxPageControls>
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
            [(value)]="selectedOrientationPreference"
            [appearance]="selectedAppearance()"
          />
        </ngx-display-controls-section>
      </ngx-display-controls-card>
    </ng-template>

    <ngx-page-header
      title="Async Validation"
      subtitle="Server-side checks with improved UX"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

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
  protected readonly selectedOrientationPreference =
    signal<FormFieldOrientation>('vertical');
  protected readonly selectedOrientation = linkedSignal<FormFieldOrientation>(
    () => {
      return normalizeOrientationForAppearance(
        this.selectedAppearance(),
        this.selectedOrientationPreference(),
      );
    },
  );
  constructor() {
    effect(() => {
      const preferredOrientation = this.selectedOrientationPreference();
      const normalizedOrientation = normalizeOrientationForAppearance(
        this.selectedAppearance(),
        preferredOrientation,
      );

      if (preferredOrientation !== normalizedOrientation) {
        this.selectedOrientationPreference.set(normalizedOrientation);
      }
    });
  }

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
}
