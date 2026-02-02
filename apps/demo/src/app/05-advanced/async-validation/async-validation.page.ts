import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import { ASYNC_VALIDATION_CONTENT } from './async-validation.content';
import { AsyncValidationComponent } from './async-validation.form';

@Component({
  selector: 'ngx-async-validation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    AsyncValidationComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
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

    <ngx-split-layout>
      <ngx-async-validation left />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.regForm" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class AsyncValidationPageComponent {
  protected readonly content = ASYNC_VALIDATION_CONTENT;
  protected readonly formRef = viewChild(AsyncValidationComponent);
}
