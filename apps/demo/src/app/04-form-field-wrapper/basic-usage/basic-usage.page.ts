import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { type ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SignalFormDebuggerComponent,
  SplitLayoutComponent,
} from '../../ui';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { BASIC_USAGE_CONTENT } from './basic-usage.content';
import { BasicUsageComponent } from './basic-usage.form';

/**
 * Basic Usage of Form Field Wrapper
 *
 * Demonstrates the NgxSignalFormFieldWrapperComponent wrapper which provides:
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
    ErrorDisplayModeSelectorComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    SignalFormDebuggerComponent,
    SplitLayoutComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-page-header
      title="Form Field Wrapper - Basic Usage"
      subtitle="Automatic error display and consistent layout with NgxSignalFormFieldWrapperComponent"
    />

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <!-- Error Display Mode Selector -->
      <ngx-error-display-mode-selector
        [(selectedMode)]="selectedMode"
        class="mb-6"
      />

      <ngx-split-layout>
        <ngx-basic-usage
          #formComponent
          [errorDisplayMode]="selectedMode()"
          left
        />
        @if (formComponent) {
          <div right>
            <ngx-signal-form-debugger
              [formTree]="formComponent.showcaseForm()"
            />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class BasicUsagePage {
  protected readonly formComponent =
    viewChild.required<BasicUsageComponent>('formComponent');

  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');

  protected readonly demonstratedContent = BASIC_USAGE_CONTENT.demonstrated;
  protected readonly learningContent = BASIC_USAGE_CONTENT.learning;
}
