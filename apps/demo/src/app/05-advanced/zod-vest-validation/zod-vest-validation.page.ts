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
import { getAppearanceLabel } from '../../ui/appearance-toggle';
import {
  getOrientationLabel,
  isOrientationDisabledForAppearance,
} from '../../ui/orientation-toggle';
import {
  ERROR_DISPLAY_MODE_LABELS,
  ErrorDisplayModeSelectorComponent,
} from '../../ui/error-display-mode-selector/error-display-mode-selector';
import { ZOD_VEST_VALIDATION_CONTENT } from './zod-vest-validation.content';
import { ZodVestValidationComponent } from './zod-vest-validation.form';

@Component({
  selector: 'ngx-zod-vest-validation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    ZodVestValidationComponent,
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
      title="Zod + Vest Validation"
      subtitle="Structural contract checks from Zod, business policy from Vest"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <ngx-display-controls-card
      title="Layered validation visibility"
      description="Use the same form to compare structural errors and business-policy errors while changing only the display timing and wrapper appearance."
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
        title="🎨 Layer framing"
        description="Switch the wrapper appearance to confirm that both Zod and Vest messages remain readable without special per-validator rendering logic."
      >
        <ngx-appearance-toggle [(value)]="selectedAppearance" />
      </ngx-display-controls-section>

      <ngx-display-controls-section
        title="↔️ Label orientation"
        description="Use a horizontal label column for the non-outline states to compare how structural and business-policy errors scan in denser layouts."
      >
        <ngx-orientation-toggle
          [(value)]="selectedOrientation"
          [appearance]="selectedAppearance()"
        />
      </ngx-display-controls-section>
    </ngx-display-controls-card>

    <ngx-split-layout>
      <ngx-zod-vest-validation
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
export class ZodVestValidationPage {
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
      value: getAppearanceLabel(this.selectedAppearance()),
    },
    {
      label: 'Orientation',
      value: getOrientationLabel(this.selectedOrientation()),
    },
  ]);
  protected readonly content = ZOD_VEST_VALIDATION_CONTENT;
  protected readonly formRef = viewChild(ZodVestValidationComponent);

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
