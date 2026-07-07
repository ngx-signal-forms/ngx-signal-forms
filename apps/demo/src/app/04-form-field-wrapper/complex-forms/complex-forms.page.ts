import { Component, computed, signal, viewChild } from '@angular/core';
import type {
  ErrorDisplayStrategy,
  FormFieldAppearance,
} from '@ngx-signal-forms/toolkit';
import type { NgxFormFieldErrorPlacement } from '@ngx-signal-forms/toolkit/form-field';
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
import { COMPLEX_FORMS_CONTENT } from './complex-forms.content';
import { ComplexFormsComponent } from './complex-forms.form';

const FIELDSET_ERROR_PLACEMENT_OPTIONS: NgxFormFieldErrorPlacement[] = [
  'top',
  'bottom',
];

const FIELDSET_ERROR_PLACEMENT_LABELS: Record<
  NgxFormFieldErrorPlacement,
  string
> = {
  top: 'Top',
  bottom: 'Bottom',
};

@Component({
  selector: 'ngx-complex-forms-page',

  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    ErrorDisplayModeSelectorComponent,
    ExampleCardsComponent,
    NgxPageControlsDirective,
    PageHeaderComponent,
    ComplexFormsComponent,
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
        title="Nested form behavior controls"
        description="Use the same long-form data model to study where wrapper timing and visual weight help most once nested groups and repeatable rows start stacking up."
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
          title="🎨 Long-form styling"
          description="Compare whether the standard or outline wrapper does a better job of keeping long sections and array rows scannable."
        >
          <ngx-appearance-toggle [(value)]="selectedAppearance" />
        </ngx-display-controls-section>
        <ngx-display-controls-section
          title="↔️ Label orientation"
          description="Switch between standard vertical labels and horizontal label columns for the non-outline wrappers. Outline remains vertical by design."
        >
          <ngx-orientation-toggle
            [(value)]="selectedOrientation"
            [appearance]="selectedAppearance()"
          />
        </ngx-display-controls-section>
        <ngx-display-controls-section
          title="↕️ Grouped feedback placement"
          description="Move grouped feedback above or below each section to compare when a shared summary or grouped wrapper error should lead or follow the controls."
        >
          <div
            class="inline-flex items-center gap-1 rounded-full border border-gray-200/80 bg-white/80 p-1 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90"
            role="group"
            aria-label="Grouped feedback placement"
          >
            @for (placement of fieldsetErrorPlacementOptions; track placement) {
              <button
                type="button"
                (click)="selectedFieldsetErrorPlacement.set(placement)"
                [attr.aria-pressed]="
                  selectedFieldsetErrorPlacement() === placement
                "
                [class.bg-blue-50]="
                  selectedFieldsetErrorPlacement() === placement
                "
                [class.shadow-sm]="
                  selectedFieldsetErrorPlacement() === placement
                "
                [class.text-blue-700]="
                  selectedFieldsetErrorPlacement() === placement
                "
                [class.dark:bg-gray-700]="
                  selectedFieldsetErrorPlacement() === placement
                "
                [class.dark:text-blue-300]="
                  selectedFieldsetErrorPlacement() === placement
                "
                class="rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 transition-all hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-gray-300 dark:hover:text-white"
              >
                {{ fieldsetErrorPlacementLabels[placement] }}
              </button>
            }
          </div>
        </ngx-display-controls-section>
      </ngx-display-controls-card>
    </ng-template>

    <ngx-page-header
      title="Complex Forms with Form Field Wrapper"
      subtitle="Nested objects, dynamic arrays, and maximum code reduction with NgxFormField"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <ngx-split-layout>
      <div left class="flex flex-col gap-12">
        <section>
          <h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            Nested & Arrays
          </h2>
          <ngx-complex-forms
            #complexFormRef
            [errorDisplayMode]="errorDisplayMode()"
            [appearance]="selectedAppearance()"
            [orientation]="selectedOrientation()"
            [errorPlacement]="selectedFieldsetErrorPlacement()"
          />
        </section>
      </div>

      <div right class="flex flex-col gap-8">
        @if (complexFormRef) {
          <div>
            <h3
              class="mb-2 text-sm font-semibold tracking-wider text-gray-500 uppercase"
            >
              Complex Form State
            </h3>
            <ngx-signal-form-debugger [formTree]="complexFormRef.complexForm" />
          </div>
        }
      </div>
    </ngx-split-layout>
  `,
})
export class ComplexFormsPage {
  protected readonly errorDisplayMode =
    signal<ErrorDisplayStrategy>('on-touch');
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('outline');
  protected readonly fieldsetErrorPlacementLabels =
    FIELDSET_ERROR_PLACEMENT_LABELS;
  protected readonly fieldsetErrorPlacementOptions =
    FIELDSET_ERROR_PLACEMENT_OPTIONS;
  protected readonly selectedFieldsetErrorPlacement =
    signal<NgxFormFieldErrorPlacement>('bottom');
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
    {
      label: 'Grouped feedback',
      value:
        this.fieldsetErrorPlacementLabels[
          this.selectedFieldsetErrorPlacement()
        ],
    },
  ]);

  protected readonly content = COMPLEX_FORMS_CONTENT;
  protected readonly complexFormRef =
    viewChild<ComplexFormsComponent>('complexFormRef');
}
