import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SignalFormDebuggerComponent,
  SplitLayoutComponent,
} from '../../ui';
import { STEPPER_FORM_CONTENT } from './stepper-form.content';
import { StepperFormComponent } from './stepper-form.form';

@Component({
  selector: 'ngx-stepper-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StepperFormComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    SignalFormDebuggerComponent,
    SplitLayoutComponent,
  ],
  template: `
    <ngx-page-header
      title="Multi-Step Form Wizard"
      subtitle="Breaking complex forms into manageable steps"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <ngx-split-layout>
      <ngx-stepper-form left />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.wizardForm()" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class StepperFormPageComponent {
  protected readonly content = STEPPER_FORM_CONTENT;
  protected readonly formRef = viewChild(StepperFormComponent);
}
