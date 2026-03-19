import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import type {
  ErrorDisplayStrategy,
  FormFieldAppearance,
} from '@ngx-signal-forms/toolkit';
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
import { COMPLEX_FORMS_CONTENT } from './complex-forms.content';
import { ComplexFormsComponent } from './complex-forms.form';

/**
 * Complex Forms Page
 *
 * Demonstrates NgxFormField with:
 * - Nested object validation (personalInfo, addressInfo)
 * - Dynamic arrays (skills, contacts)
 * - Add/remove array items
 * - Maximum code reduction (67% less boilerplate)
 *
 * Shows progression from manual implementation (Phase 1) to
 * maximum automation with form field wrapper.
 */
@Component({
  selector: 'ngx-complex-forms-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    PageHeaderComponent,
    ComplexFormsComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
    AppearanceToggleComponent,
    DisplayControlsCardComponent,
    DisplayControlsSectionComponent,
  ],
  template: `
    <ngx-page-header
      title="Complex Forms with Form Field Wrapper"
      subtitle="Nested objects, dynamic arrays, and maximum code reduction with NgxFormField"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
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
      </ngx-display-controls-card>
    </ngx-example-cards>

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
  protected readonly currentControlChips = computed(() => [
    {
      label: 'Mode',
      value: ERROR_DISPLAY_MODE_LABELS[this.errorDisplayMode()],
    },
    {
      label: 'Appearance',
      value: APPEARANCE_LABELS[this.selectedAppearance()],
    },
  ]);

  protected readonly content = COMPLEX_FORMS_CONTENT;
  protected readonly complexFormRef =
    viewChild<ComplexFormsComponent>('complexFormRef');
}
