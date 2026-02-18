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
import { FIELDSET_CONTENT } from './fieldset.content';
import { FieldsetFormComponent } from './fieldset.form';

/**
 * Fieldset Demo Page
 *
 * Demonstrates the NgxSignalFormFieldset for:
 * - Grouping related form fields (addresses, credentials)
 * - Aggregating validation errors at the group level
 * - Cross-field validation (password confirmation)
 * - Conditional fieldset visibility
 * - WCAG 2.2 compliant accessibility
 *
 * This page showcases how to reduce visual clutter by displaying
 * aggregated errors instead of per-field error messages.
 */
@Component({
  selector: 'ngx-fieldset-page',
  imports: [
    FieldsetFormComponent,
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
      title="Form Fieldset - Aggregated Errors"
      subtitle="Group related fields and display combined validation messages with NgxSignalFormFieldset"
    />

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <div class="mb-6 flex items-center gap-6">
        <!-- Error Display Mode Selector -->
        <ngx-error-display-mode-selector [(selectedMode)]="selectedMode" />
        <!-- Appearance Toggle -->
        <ngx-appearance-toggle [(value)]="selectedAppearance" />
      </div>

      <ngx-split-layout>
        <ngx-fieldset-form
          #formComponent
          [errorDisplayMode]="selectedMode()"
          [appearance]="selectedAppearance()"
          left
        />
        @if (formComponent) {
          <div right>
            <ngx-signal-form-debugger [formTree]="formComponent.fieldsetForm" />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class FieldsetPage {
  protected readonly formComponent =
    viewChild.required<FieldsetFormComponent>('formComponent');

  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('standard');

  protected readonly demonstratedContent = FIELDSET_CONTENT.demonstrated;
  protected readonly learningContent = FIELDSET_CONTENT.learning;
}
