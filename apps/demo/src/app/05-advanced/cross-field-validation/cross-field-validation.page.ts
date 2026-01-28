import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SignalFormDebuggerComponent,
  SplitLayoutComponent,
} from '../../ui';
import { CROSS_FIELD_VALIDATION_CONTENT } from './cross-field-validation.content';
import { CrossFieldValidationComponent } from './cross-field-validation.form';

@Component({
  selector: 'ngx-cross-field-validation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    CrossFieldValidationComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    SignalFormDebuggerComponent,
    SplitLayoutComponent,
  ],
  template: `
    <ngx-page-header
      title="Cross-Field Validation"
      subtitle="Validations depending on multiple fields"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <ngx-split-layout>
      <ngx-cross-field-validation left />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.bookingForm()" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class CrossFieldValidationPageComponent {
  protected readonly content = CROSS_FIELD_VALIDATION_CONTENT;
  protected readonly formRef = viewChild(CrossFieldValidationComponent);
}
