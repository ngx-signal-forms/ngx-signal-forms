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
import { FIELD_STATE_PATTERNS_CONTENT } from './field-state-patterns.content';
import { FieldStatePatternsComponent } from './field-state-patterns.form';

@Component({
  selector: 'ngx-field-state-patterns-page',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    FieldStatePatternsComponent,
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
        title="State visibility framing"
        description="Compare the same state rules under different error timings and wrapper treatments so you can judge whether hidden, disabled, and readonly affordances stay obvious."
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
          description="Switch the wrapper treatment to confirm that state cues remain understandable across outline, standard, and plain surfaces."
        >
          <ngx-appearance-toggle [(value)]="selectedAppearance" />
        </ngx-display-controls-section>
        <ngx-display-controls-section
          title="↔️ Label orientation"
          description="Check whether disabled and readonly cues still read clearly when labels shift into a horizontal layout. Outline stays vertical on purpose."
        >
          <ngx-orientation-toggle
            [(value)]="selectedOrientation"
            [appearance]="selectedAppearance()"
          />
        </ngx-display-controls-section>
      </ngx-display-controls-card>
    </ng-template>

    <ngx-page-header
      title="Field State Patterns"
      subtitle="hidden(), disabled(), and readonly() with Angular 22's consistent when() syntax"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <ngx-split-layout>
        <ngx-field-state-patterns
          [errorDisplayMode]="errorDisplayMode()"
          [appearance]="selectedAppearance()"
          [orientation]="selectedOrientation()"
          left
        />

        @if (formRef(); as form) {
          <div right>
            <ngx-signal-form-debugger [formTree]="form.stateForm" />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class FieldStatePatternsPageComponent {
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
  protected readonly content = FIELD_STATE_PATTERNS_CONTENT;
  protected readonly formRef = viewChild(FieldStatePatternsComponent);
}
