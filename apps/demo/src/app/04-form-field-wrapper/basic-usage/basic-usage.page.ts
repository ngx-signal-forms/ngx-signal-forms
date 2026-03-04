import {
  ChangeDetectionStrategy,
  Component,
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
  ExampleCardsComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { BASIC_USAGE_CONTENT } from './basic-usage.content';
import { BasicUsageComponent } from './basic-usage.form';
import { OutlineFormFieldComponent } from './outline-form-field.form';

/**
 * Basic Usage of Form Field Wrapper
 *
 * Demonstrates the NgxFormField bundle which provides:
 * - **Automatic Error Display**: No need to manually add `<ngx-signal-form-error>`
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
      <div class="mb-6 flex flex-wrap items-start gap-6">
        <!-- Error Display Mode Selector -->
        <ngx-error-display-mode-selector
          [(selectedMode)]="selectedMode"
          class="min-w-[300px] flex-1"
        />

        <!-- Appearance Selector -->
        <div class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            🎨 Appearance
          </span>
          <ngx-appearance-toggle [(value)]="selectedAppearance" />
        </div>
      </div>

      <ngx-split-layout>
        <div left class="flex flex-col gap-12">
          <section>
            <h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">Basic Structure</h2>
            <ngx-basic-usage
              #formComponent
              [errorDisplayMode]="selectedMode()"
              [appearance]="selectedAppearance()"
            />
          </section>
          
          <hr class="border-gray-200 dark:border-gray-800" />
          
          <section>
            <h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">Outline Design (Figma Match)</h2>
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
              <h3 class="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">Basic Form State</h3>
              <ngx-signal-form-debugger [formTree]="formComponent.showcaseForm" />
            </div>
          }
          @if (outlineFormComponent) {
            <div>
              <h3 class="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">Outline Form State</h3>
              <ngx-signal-form-debugger [formTree]="outlineFormComponent.showcaseForm" />
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
    signal<FormFieldAppearance>('standard');

  protected readonly demonstratedContent = BASIC_USAGE_CONTENT.demonstrated;
  protected readonly learningContent = BASIC_USAGE_CONTENT.learning;
}
