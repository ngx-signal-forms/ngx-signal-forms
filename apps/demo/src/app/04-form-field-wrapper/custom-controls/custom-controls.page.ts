import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import type {
  ErrorDisplayStrategy,
  FormFieldAppearance,
  FormFieldOrientation,
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
import {
  ERROR_DISPLAY_MODE_LABELS,
  ErrorDisplayModeSelectorComponent,
} from '../../ui/error-display-mode-selector/error-display-mode-selector';
import { APPEARANCE_LABELS } from '../../ui/appearance-toggle';
import {
  getOrientationLabel,
  normalizeOrientationForAppearance,
} from '../../ui/orientation-toggle';
import { CUSTOM_CONTROLS_CONTENT } from './custom-controls.content';
import { CustomControlsFormComponent } from './custom-controls.form';

@Component({
  selector: 'ngx-custom-controls-page',
  imports: [
    CustomControlsFormComponent,
    ErrorDisplayModeSelectorComponent,
    ExampleCardsComponent,
    NgxPageControlsDirective,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
    AppearanceToggleComponent,
    OrientationToggleComponent,
    DisplayControlsCardComponent,
    DisplayControlsSectionComponent,
  ],

  template: `
    <ng-template ngxPageControls>
      <ngx-display-controls-card
        title="Custom control integration checks"
        description="Verify that a non-native control still inherits the same validation timing, wrapper affordances, and debugging story as the regular toolkit fields around it."
        [chips]="currentControlChips()"
        layout="split"
      >
        <ngx-error-display-mode-selector
          [(selectedMode)]="selectedMode"
          [embedded]="true"
          display-controls-primary
          class="block min-w-0"
        />

        <ngx-display-controls-section
          title="🎨 Wrapper styling"
          description="Change the wrapper treatment without changing the custom control contract, so labels, hints, and errors can be evaluated independently from the rating UI itself."
        >
          <ngx-appearance-toggle [(value)]="selectedAppearance" />
        </ngx-display-controls-section>

        <ngx-display-controls-section
          title="↔️ Label orientation"
          description="Compare vertical and horizontal labels for the non-outline wrappers. Outline stays vertical because its floating-label treatment depends on the label living inside the field chrome."
        >
          <ngx-orientation-toggle
            [(value)]="selectedOrientationPreference"
            [appearance]="selectedAppearance()"
          />
        </ngx-display-controls-section>
      </ngx-display-controls-card>
    </ng-template>

    <ngx-page-header
      title="Custom Signal Forms Controls"
      subtitle="FormValueControl components with form field wrapper integration"
    />

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <ngx-split-layout>
        <ngx-custom-controls
          #formComponent
          [errorDisplayMode]="selectedMode()"
          [appearance]="selectedAppearance()"
          [orientation]="selectedOrientation()"
          left
        />
        @if (formComponent) {
          <div right>
            <ngx-signal-form-debugger [formTree]="formComponent.reviewForm" />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class CustomControlsPage {
  protected readonly formComponent =
    viewChild.required<CustomControlsFormComponent>('formComponent');

  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('standard');
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
  ]);

  protected readonly demonstratedContent = CUSTOM_CONTROLS_CONTENT.demonstrated;
  protected readonly learningContent = CUSTOM_CONTROLS_CONTENT.learning;
}
