import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ExampleCardsComponent, SignalFormDebuggerComponent } from '../../ui';
import { STEPPER_FORM_CONTENT } from './stepper-form.content';
import { StepperFormComponent } from './stepper-form.form';

@Component({
  selector: 'ngx-stepper-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StepperFormComponent,
    ExampleCardsComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <header class="mb-8">
      <h1 class="page-title">Multi-Step Form Wizard</h1>
      <p class="page-subtitle">Breaking complex forms into manageable steps</p>
    </header>

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ngx-stepper-form />

      @if (formRef(); as form) {
        <ngx-signal-form-debugger [formTree]="form.wizardForm()" />
      }
    </div>
  `,
})
export class StepperFormPageComponent {
  protected readonly content = STEPPER_FORM_CONTENT;
  protected readonly formRef = viewChild(StepperFormComponent);
}
