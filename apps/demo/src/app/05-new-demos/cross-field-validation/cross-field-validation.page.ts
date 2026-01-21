import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ExampleCardsComponent, SignalFormDebuggerComponent } from '../../ui';
import { CROSS_FIELD_VALIDATION_CONTENT } from './cross-field-validation.content';
import { CrossFieldValidationComponent } from './cross-field-validation.form';

@Component({
  selector: 'ngx-cross-field-validation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CrossFieldValidationComponent,
    ExampleCardsComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <header class="mb-8">
      <h1 class="page-title">Cross-Field Validation</h1>
      <p class="page-subtitle">Validations depending on multiple fields</p>
    </header>

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
