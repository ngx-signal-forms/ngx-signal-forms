import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import type {
  ErrorDisplayStrategy,
  FormFieldAppearance,
} from '@ngx-signal-forms/toolkit';
import type { FieldsetErrorPlacement } from '@ngx-signal-forms/toolkit/form-field';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import {
  AppearanceToggleComponent,
  DisplayControlsCardComponent,
  DisplayControlsSectionComponent,
  ExampleCardsComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import {
  ERROR_DISPLAY_MODE_LABELS,
  ErrorDisplayModeSelectorComponent,
} from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { APPEARANCE_LABELS } from '../../ui/appearance-toggle';
import { FieldsetFormComponent } from '../complex-forms/fieldset.form';
import { FIELDSET_GROUPING_CONTENT } from './fieldset-grouping.content';

@Component({
  selector: 'ngx-fieldset-grouping-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ErrorDisplayModeSelectorComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
    AppearanceToggleComponent,
    FieldsetFormComponent,
    DisplayControlsCardComponent,
    DisplayControlsSectionComponent,
  ],
  styles: `
    .page-segmented {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      padding: 0.25rem;
      border-radius: 9999px;
      background: rgba(232, 236, 241, 0.88);
      width: fit-content;
    }

    .page-option {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      background: transparent;
      color: #5d6978;
      padding: 0.45rem 0.95rem;
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1;
      cursor: pointer;
      transition:
        background-color 150ms ease,
        color 150ms ease,
        box-shadow 150ms ease;
    }

    .page-option__input {
      position: absolute;
      inset: 0;
      margin: 0;
      opacity: 0;
      cursor: pointer;
    }

    .page-option:hover {
      color: #324155;
    }

    .page-option[data-active='true'] {
      background: #e8f4fb;
      color: #005d96;
      box-shadow: 0 1px 2px rgba(50, 65, 85, 0.18);
    }

    .page-option:focus-within {
      outline: 2px solid #005fcc;
      outline-offset: 2px;
    }

    :host-context(.dark) {
      .page-segmented {
        background: rgba(31, 41, 55, 0.96);
      }

      .page-option {
        color: #cbd5e1;
      }

      .page-option:hover {
        color: #f8fafc;
      }

      .page-option[data-active='true'] {
        background: rgba(59, 130, 246, 0.2);
        color: #bfdbfe;
      }
    }
  `,
  template: `
    <ngx-page-header
      title="Fieldset Grouping + Errors"
      subtitle="Grouped validation summaries, error placement, and fieldset-level feedback patterns"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <ngx-display-controls-card
        title="Grouped feedback studio"
        description="Shape the page around one question: when several controls belong to one decision, how should their shared summary appear, and where should that summary live?"
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
          title="🎨 Section styling"
          description="Check whether the wrapper treatment reinforces or competes with the grouped summaries once several fieldsets are visible at the same time."
        >
          <ngx-appearance-toggle [(value)]="selectedAppearance" />
        </ngx-display-controls-section>

        <ngx-display-controls-section
          title="Error placement"
          description="Move every grouped summary together so you can judge whether top or bottom placement makes the section hierarchy easier to parse."
        >
          <fieldset class="space-y-3">
            <legend
              class="text-sm font-semibold text-gray-900 dark:text-gray-100"
            >
              Error placement
            </legend>

            <div class="page-segmented">
              @for (placement of placementOptions; track placement) {
                <label
                  class="page-option"
                  [attr.data-active]="selectedErrorPlacement() === placement"
                >
                  <input
                    class="page-option__input"
                    type="radio"
                    name="errorPlacement"
                    [value]="placement"
                    [checked]="selectedErrorPlacement() === placement"
                    (change)="selectedErrorPlacement.set(placement)"
                  />
                  <span>{{ placementLabels[placement] }}</span>
                </label>
              }
            </div>
          </fieldset>
        </ngx-display-controls-section>
      </ngx-display-controls-card>

      <ngx-split-layout>
        <div left>
          <ngx-fieldset-form
            #formComponent
            [errorDisplayMode]="selectedMode()"
            [appearance]="selectedAppearance()"
            [errorPlacement]="selectedErrorPlacement()"
          />
        </div>

        @if (formComponent) {
          <div right>
            <h3
              class="mb-2 text-sm font-semibold tracking-wider text-gray-500 uppercase"
            >
              Fieldset Form State
            </h3>
            <ngx-signal-form-debugger [formTree]="formComponent.fieldsetForm" />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class FieldsetGroupingPage {
  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('outline');
  protected readonly selectedErrorPlacement =
    signal<FieldsetErrorPlacement>('top');
  protected readonly placementOptions = ['top', 'bottom'] as const;
  protected readonly placementLabels = {
    top: 'Top',
    bottom: 'Bottom',
  } as const;
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
      label: 'Placement',
      value: this.placementLabels[this.selectedErrorPlacement()],
    },
  ]);

  protected readonly content = FIELDSET_GROUPING_CONTENT;
}
