import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import type {
  ResolvedErrorDisplayStrategy,
  FormFieldAppearance,
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
  createOrientationSelection,
  getOrientationLabel,
} from '../../ui/orientation-toggle';
import { LABELLESS_FIELDS_CONTENT } from './labelless-fields.content';
import { LabellessFieldsFormComponent } from './labelless-fields.form';

@Component({
  selector: 'ngx-labelless-fields-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LabellessFieldsFormComponent,
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
        title="Appearance + orientation"
        description="Toggle to see the label-space collapse behavior across every layout the toolkit supports."
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
          description="Switch appearance to verify standard, outline, and plain all cope with missing labels."
        >
          <ngx-appearance-toggle [(value)]="selectedAppearance" />
        </ngx-display-controls-section>

        <ngx-display-controls-section
          title="↔️ Label orientation"
          description="Horizontal layout collapses the label column when no label is projected."
        >
          <ngx-orientation-toggle
            [(value)]="selectedOrientation"
            [appearance]="selectedAppearance()"
          />
        </ngx-display-controls-section>
      </ngx-display-controls-card>
    </ng-template>

    <ngx-page-header
      title="Labelless Form Fields"
      subtitle="Wrapper collapses reserved label space when no <label> is projected"
    />

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <ngx-split-layout>
        <ngx-labelless-fields
          #formComponent
          [errorDisplayMode]="selectedMode()"
          [appearance]="selectedAppearance()"
          [orientation]="selectedOrientation()"
          left
        />
        @if (formComponent) {
          <div right>
            <ngx-signal-form-debugger
              [formTree]="formComponent.labellessForm"
            />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class LabellessFieldsPage {
  protected readonly formComponent =
    viewChild.required<LabellessFieldsFormComponent>('formComponent');

  protected readonly selectedMode =
    signal<ResolvedErrorDisplayStrategy>('on-touch');
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('standard');
  protected readonly selectedOrientation = createOrientationSelection(
    this.selectedAppearance,
  );

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

  protected readonly demonstratedContent =
    LABELLESS_FIELDS_CONTENT.demonstrated;
  protected readonly learningContent = LABELLESS_FIELDS_CONTENT.learning;
}
