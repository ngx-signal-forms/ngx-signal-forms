import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/debugger';
import type { FormFieldAppearance } from '@ngx-signal-forms/toolkit';

import {
  AppearanceToggleComponent,
  DisplayControlsCardComponent,
  ExampleCardsComponent,
  NgxPageControlsDirective,
  OrientationToggleComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import { APPEARANCE_LABELS } from '../../ui/appearance-toggle';
import {
  createOrientationSelection,
  getOrientationLabel,
} from '../../ui/orientation-toggle';

import { SINGLE_MODEL_WIZARD_CONTENT } from './single-model-wizard.content';
import { SingleModelWizardComponent } from './single-model-wizard.form';

@Component({
  selector: 'ngx-single-model-wizard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    SingleModelWizardComponent,
    AppearanceToggleComponent,
    DisplayControlsCardComponent,
    ExampleCardsComponent,
    NgxPageControlsDirective,
    OrientationToggleComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  template: `
    <ng-template ngxPageControls>
      <ngx-display-controls-card
        title="Wrapper controls"
        description="Carry one wrapper treatment through the account and shipping steps so field presentation can be compared without changing the single-model validation flow."
        [chips]="currentControlChips()"
      >
        <div display-controls-primary class="grid gap-4">
          <ngx-appearance-toggle [(value)]="selectedAppearance" />
          <ngx-orientation-toggle
            [(value)]="selectedOrientation"
            [appearance]="selectedAppearance()"
          />
        </div>
      </ngx-display-controls-card>
    </ng-template>

    <ngx-page-header
      title="Single-Model Wizard"
      subtitle="One form() model spanning every step, gated by the shared wizard's canNavigate guard"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <ngx-split-layout>
        <ngx-single-model-wizard
          [appearance]="selectedAppearance()"
          [orientation]="selectedOrientation()"
          left
        />

        @if (wizardRef(); as wizard) {
          <div right>
            <ngx-signal-form-debugger
              [formTree]="wizard.formTree"
              title="Whole-Wizard Form State"
            />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class SingleModelWizardPageComponent {
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('outline');
  protected readonly selectedOrientation = createOrientationSelection(
    this.selectedAppearance,
  );
  protected readonly content = SINGLE_MODEL_WIZARD_CONTENT;
  protected readonly wizardRef = viewChild(SingleModelWizardComponent);

  protected readonly currentControlChips = computed(() => [
    {
      label: 'Appearance',
      value: APPEARANCE_LABELS[this.selectedAppearance()],
    },
    {
      label: 'Orientation',
      value: getOrientationLabel(this.selectedOrientation()),
    },
  ]);
}
