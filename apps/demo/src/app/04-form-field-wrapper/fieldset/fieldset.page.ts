import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { type ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import { ExampleCardsComponent, SignalFormDebuggerComponent } from '../../ui';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { FIELDSET_CONTENT } from './fieldset.content';
import { FieldsetFormComponent } from './fieldset.form';

/**
 * Fieldset Demo Page
 *
 * Demonstrates the NgxSignalFormFieldsetComponent for:
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
    SignalFormDebuggerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8">
      <h1 class="page-title">Form Fieldset - Aggregated Errors</h1>
      <p class="page-subtitle">
        Group related fields and display combined validation messages with
        NgxSignalFormFieldsetComponent
      </p>
    </header>

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <!-- Error Display Mode Selector -->
      <ngx-error-display-mode-selector
        [(selectedMode)]="selectedMode"
        class="mb-6"
      />

      <!-- Side-by-side layout for form and debugger -->
      <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <ngx-fieldset-form #formComponent [errorDisplayMode]="selectedMode()" />
        @if (formComponent) {
          <ngx-signal-form-debugger [formTree]="formComponent.fieldsetForm()" />
        }
      </div>
    </ngx-example-cards>
  `,
})
export class FieldsetPage {
  protected readonly formComponent =
    viewChild.required<FieldsetFormComponent>('formComponent');

  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');

  protected readonly demonstratedContent = FIELDSET_CONTENT.demonstrated;
  protected readonly learningContent = FIELDSET_CONTENT.learning;
}
