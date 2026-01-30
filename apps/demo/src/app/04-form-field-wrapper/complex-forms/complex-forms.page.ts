import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SignalFormDebuggerComponent,
  SplitLayoutComponent,
} from '../../ui';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
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
    SignalFormDebuggerComponent,
    SplitLayoutComponent,
  ],
  template: `
    <ngx-page-header
      title="Complex Forms with Form Field Wrapper"
      subtitle="Nested objects, dynamic arrays, and maximum code reduction with NgxFormField"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <!-- Error Display Mode Selector -->
    <ngx-error-display-mode-selector [(selectedMode)]="errorDisplayMode" />
    <ngx-split-layout>
      <ngx-complex-forms [errorDisplayMode]="errorDisplayMode()" left />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.complexForm()" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class ComplexFormsPage {
  protected readonly errorDisplayMode =
    signal<ErrorDisplayStrategy>('on-touch');
  protected readonly content = COMPLEX_FORMS_CONTENT;
  protected readonly formRef = viewChild(ComplexFormsComponent);
}
