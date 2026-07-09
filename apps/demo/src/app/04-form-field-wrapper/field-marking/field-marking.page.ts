import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  FieldMarkingMode,
  FormFieldAppearance,
} from '@ngx-signal-forms/toolkit';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/debugger';
import {
  AppearanceToggleComponent,
  DisplayControlsCardComponent,
  DisplayControlsSectionComponent,
  ExampleCardsComponent,
  NgxPageControlsDirective,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import { APPEARANCE_LABELS } from '../../ui/appearance-toggle';
import { FIELD_MARKING_CONTENT } from './field-marking.content';
import { FieldMarkingFormComponent } from './field-marking.form';

const MODE_OPTIONS: readonly { value: FieldMarkingMode; label: string }[] = [
  { value: 'required', label: 'Required' },
  { value: 'optional', label: 'Optional' },
  { value: 'none', label: 'None' },
];

@Component({
  selector: 'ngx-field-marking-page',
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    FormsModule,
    FieldMarkingFormComponent,
    ExampleCardsComponent,
    NgxPageControlsDirective,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
    AppearanceToggleComponent,
    DisplayControlsCardComponent,
    DisplayControlsSectionComponent,
  ],
  template: `
    <ng-template ngxPageControls>
      <ngx-display-controls-card
        title="Marking controls"
        description="Everything here feeds both the field markers and the legend, so they always agree."
        [chips]="currentChips()"
        layout="split"
      >
        <ngx-display-controls-section
          title="✳️ Marking mode"
          description="Choose which fields carry a marker."
          display-controls-primary
        >
          <div class="mode-toggle" role="group" aria-label="Marking mode">
            @for (option of modeOptions; track option.value) {
              <button
                type="button"
                class="rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005fcc] dark:text-gray-300 dark:hover:text-white"
                [attr.aria-label]="'Mark ' + option.value"
                [class.bg-[#e8f4fb]]="mode() === option.value"
                [class.shadow-sm]="mode() === option.value"
                [class.text-[#005d96]]="mode() === option.value"
                [class.dark:bg-gray-700]="mode() === option.value"
                [class.dark:text-blue-300]="mode() === option.value"
                [attr.aria-pressed]="mode() === option.value"
                (click)="mode.set(option.value)"
              >
                {{ option.label }}
              </button>
            }
          </div>
        </ngx-display-controls-section>

        <ngx-display-controls-section
          title="🎨 Wrapper appearance"
          description="Markers render in every appearance, not just outline."
        >
          <ngx-appearance-toggle [(value)]="appearance" />
        </ngx-display-controls-section>

        <ngx-display-controls-section
          title="🔤 Marker text"
          description="The legend stays in sync via the {{ '{marker}' }} token."
        >
          <div class="text-controls">
            <label class="text-controls__row">
              <span>Required marker</span>
              <input type="text" [(ngModel)]="requiredMarker" />
            </label>
            <label class="text-controls__row">
              <span>Optional marker</span>
              <input type="text" [(ngModel)]="optionalMarker" />
            </label>
            <label class="text-controls__row">
              <span>Legend text override</span>
              <input
                type="text"
                placeholder="(empty = mode default)"
                [(ngModel)]="legendText"
              />
            </label>
          </div>
        </ngx-display-controls-section>

        <ngx-display-controls-section
          title="🔁 Conditional required"
          description="Flip a field's required-ness and watch the legend react."
        >
          <label class="checkbox-row">
            <input type="checkbox" [(ngModel)]="phoneRequiredModel" />
            <span>Make the phone field required</span>
          </label>
        </ngx-display-controls-section>
      </ngx-display-controls-card>
    </ng-template>

    <ngx-page-header
      title="Required / Optional Field Marking"
      subtitle="Mark required fields, mark optional fields, or mark nothing — with a configurable, form-aware legend"
    />

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <ngx-split-layout>
        <ngx-field-marking-form
          #formComponent
          left
          [markingMode]="mode()"
          [appearance]="appearance()"
          [requiredMarkerText]="requiredMarker()"
          [optionalMarkerText]="optionalMarker()"
          [legendText]="legendText()"
          [phoneRequired]="phoneRequiredModel()"
        />
        @if (formComponent) {
          <div right>
            <ngx-signal-form-debugger [formTree]="formComponent.markingForm" />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
  styles: `
    .mode-toggle {
      display: inline-flex;
      max-width: 100%;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.25rem;
      border: 1px solid rgb(229 231 235 / 0.8);
      background: rgb(255 255 255 / 0.8);
      padding: 0.25rem;
      border-radius: 9999px;
      box-shadow: 0 1px 2px rgb(15 23 42 / 0.08);
      backdrop-filter: blur(4px);
    }

    :host-context(.dark) .mode-toggle {
      border-color: rgb(55 65 81);
      background: rgb(31 41 55 / 0.9);
    }

    .text-controls {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .text-controls__row {
      display: grid;
      grid-template-columns: minmax(0, 7.5rem) minmax(0, 1fr);
      gap: 0.5rem;
      align-items: center;
      font-size: 0.875rem;
    }

    .text-controls__row input {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: 0.35rem 0.5rem;
      border: 1px solid rgb(0 0 0 / 0.15);
      border-radius: 0.375rem;
      font: inherit;
    }

    .checkbox-row {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      cursor: pointer;
    }
  `,
})
export class FieldMarkingPage {
  protected readonly modeOptions = MODE_OPTIONS;

  protected readonly mode = signal<FieldMarkingMode>('required');
  protected readonly appearance = signal<FormFieldAppearance>('standard');
  protected readonly requiredMarker = signal(' *');
  protected readonly optionalMarker = signal(' (optional)');
  protected readonly legendText = signal('');
  protected readonly phoneRequiredModel = signal(false);

  protected readonly demonstratedContent = FIELD_MARKING_CONTENT.demonstrated;
  protected readonly learningContent = FIELD_MARKING_CONTENT.learning;

  protected readonly currentChips = computed(() => [
    {
      label: 'Mode',
      value:
        this.modeOptions.find((o) => o.value === this.mode())?.label ??
        this.mode(),
    },
    { label: 'Appearance', value: APPEARANCE_LABELS[this.appearance()] },
    {
      label: 'Phone',
      value: this.phoneRequiredModel() ? 'required' : 'optional',
    },
  ]);
}
