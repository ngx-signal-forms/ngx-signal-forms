import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SignalFormDebuggerComponent,
} from '../../ui';
import { CROSS_FIELD_VALIDATION_CONTENT } from './cross-field-validation.content';
import { CrossFieldValidationComponent } from './cross-field-validation.form';

@Component({
  selector: 'ngx-cross-field-validation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CrossFieldValidationComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    SignalFormDebuggerComponent,
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

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ngx-cross-field-validation />

      @if (formRef(); as form) {
        <ngx-signal-form-debugger [formTree]="form.bookingForm()" />
      }
    </div>
  `,
})
export class CrossFieldValidationPageComponent {
  protected readonly content = CROSS_FIELD_VALIDATION_CONTENT;
  protected readonly formRef = viewChild(CrossFieldValidationComponent);
}
