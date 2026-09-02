import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import {
  type ResolvedErrorDisplayStrategy,
  type FormFieldAppearance,
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
  createOrientationSelection,
  getOrientationLabel,
} from '../../ui/orientation-toggle';
import {
  ERROR_DISPLAY_MODE_LABELS,
  ErrorDisplayModeSelectorComponent,
} from '../../ui/error-display-mode-selector/error-display-mode-selector';
import { AUTOSAVE_CONTENT } from './autosave.content';
import { AutosaveComponent } from './autosave.form';

@Component({
  selector: 'ngx-autosave-page',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    AutosaveComponent,
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
        title="Autosave controls"
        description="Compare error timing and wrapper treatments while watching debounced, field-level saves."
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
          title="🎨 Wrapper appearance"
          description="Confirm the save-status regions stay legible across wrapper treatments."
        >
          <ngx-appearance-toggle [(value)]="selectedAppearance" />
        </ngx-display-controls-section>
        <ngx-display-controls-section
          title="↔️ Label orientation"
          description="Check the same states with horizontal label columns. Outline remains vertical only."
        >
          <ngx-orientation-toggle
            [(value)]="selectedOrientation"
            [appearance]="selectedAppearance()"
          />
        </ngx-display-controls-section>
      </ngx-display-controls-card>
    </ng-template>

    <ngx-page-header
      title="Autosave"
      subtitle="Debounced field-level save with accessible save status — no submit button"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <ngx-split-layout>
        <ngx-autosave
          [errorDisplayMode]="errorDisplayMode()"
          [appearance]="selectedAppearance()"
          [orientation]="selectedOrientation()"
          left
        />

        @if (formRef(); as form) {
          <div right>
            <ngx-signal-form-debugger [formTree]="form.profileForm" />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class AutosavePage {
  protected readonly errorDisplayMode =
    signal<ResolvedErrorDisplayStrategy>('on-touch');
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('outline');
  protected readonly selectedOrientation = createOrientationSelection(
    this.selectedAppearance,
  );

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
  protected readonly content = AUTOSAVE_CONTENT;
  protected readonly formRef = viewChild(AutosaveComponent);
}
