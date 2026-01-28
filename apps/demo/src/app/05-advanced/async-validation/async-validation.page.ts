import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SignalFormDebuggerComponent,
} from '../../ui';
import { ASYNC_VALIDATION_CONTENT } from './async-validation.content';
import { AsyncValidationComponent } from './async-validation.form';

@Component({
  selector: 'ngx-async-validation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncValidationComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <ngx-page-header
      title="Async Validation"
      subtitle="Server-side checks with improved UX"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ngx-async-validation />

      @if (formRef(); as form) {
        <ngx-signal-form-debugger [formTree]="form.regForm()" />
      }
    </div>
  `,
})
export class AsyncValidationPageComponent {
  protected readonly content = ASYNC_VALIDATION_CONTENT;
  protected readonly formRef = viewChild(AsyncValidationComponent);
}
