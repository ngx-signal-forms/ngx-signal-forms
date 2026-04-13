import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import {
  type ErrorDisplayStrategy,
  type FormFieldAppearance,
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
import { BASIC_USAGE_CONTENT } from './basic-usage.content';
import { BasicUsageComponent } from './basic-usage.form';
import { OutlineFormFieldComponent } from './outline-form-field.form';

/**
 * Basic Usage of Form Field Wrapper
 *
 * Demonstrates the NgxFormField bundle which provides:
 * - **Automatic Error Display**: No need to manually add `<ngx-form-field-error>`
 * - **Consistent Layout**: Standardized spacing via CSS custom properties
 * - **Multiple Field Types**: Works with all form controls
 * - **Clean Markup**: Reduced boilerplate compared to manual error handling
 *
 * This page showcases the difference between manual error display
 * (see getting-started) and automatic error display via wrapper.
 */
@Component({
  selector: 'ngx-basic-usage-page',
  imports: [
    BasicUsageComponent,
    OutlineFormFieldComponent,
    ErrorDisplayModeSelectorComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
    AppearanceToggleComponent,
    DisplayControlsCardComponent,
    DisplayControlsSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-page-header
      title="Form Field Wrapper - Basic Usage"
      subtitle="Automatic error display and consistent layout with NgxFormField"
    />

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <ngx-display-controls-card
        title="Wrapper comparison controls"
        description="Keep the field mix constant while comparing how the wrapper reduces boilerplate and how its two visual treatments change the reading rhythm of the form."
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
          description="Use stacked for the everyday baseline and outline for the denser design-system treatment shown in the second example."
        >
          <ngx-appearance-toggle [(value)]="selectedAppearance" />
        </ngx-display-controls-section>
      </ngx-display-controls-card>

      <ngx-split-layout>
        <div left class="flex flex-col gap-12">
          <section>
            <h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Stacked wrapper baseline
            </h2>
            <ngx-basic-usage
              #formComponent
              [errorDisplayMode]="selectedMode()"
              [appearance]="selectedAppearance()"
            />
          </section>

          <hr class="border-gray-200 dark:border-gray-800" />

          <section>
            <h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Outline wrapper variant
            </h2>
            <ngx-outline-form-field
              #outlineFormComponent
              [errorDisplayMode]="selectedMode()"
              [appearance]="selectedAppearance()"
            />
          </section>
        </div>

        <div right class="flex flex-col gap-8">
          @if (formComponent) {
            <div>
              <h3
                class="mb-2 text-sm font-semibold tracking-wider text-gray-500 uppercase"
              >
                Basic Form State
              </h3>
              <ngx-signal-form-debugger
                [formTree]="formComponent.showcaseForm"
              />
            </div>
          }
          @if (outlineFormComponent) {
            <div>
              <h3
                class="mb-2 text-sm font-semibold tracking-wider text-gray-500 uppercase"
              >
                Outline Form State
              </h3>
              <ngx-signal-form-debugger
                [formTree]="outlineFormComponent.showcaseForm"
              />
            </div>
          }
        </div>
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class BasicUsagePage {
  protected readonly formComponent =
    viewChild<BasicUsageComponent>('formComponent');

  protected readonly outlineFormComponent =
    viewChild<OutlineFormFieldComponent>('outlineFormComponent');

  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('stacked');
  protected readonly currentControlChips = computed(() => [
    {
      label: 'Mode',
      value: ERROR_DISPLAY_MODE_LABELS[this.selectedMode()],
    },
    {
      label: 'Appearance',
      value: APPEARANCE_LABELS[this.selectedAppearance()],
    },
  ]);

  protected readonly demonstratedContent = BASIC_USAGE_CONTENT.demonstrated;
  protected readonly learningContent = BASIC_USAGE_CONTENT.learning;
}
