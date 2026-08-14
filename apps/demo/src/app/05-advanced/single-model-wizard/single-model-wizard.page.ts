import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/debugger';

import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';

import { SINGLE_MODEL_WIZARD_CONTENT } from './single-model-wizard.content';
import { SingleModelWizardComponent } from './single-model-wizard.form';

@Component({
  selector: 'ngx-single-model-wizard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    SingleModelWizardComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  template: `
    <ngx-page-header
      title="Single-Model Wizard"
      subtitle="One form() model spanning every step, gated by the shared wizard's canNavigate guard"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <ngx-split-layout>
        <ngx-single-model-wizard left />

        @if (wizardRef(); as wizard) {
          <div right>
            <ngx-signal-form-debugger
              [formTree]="wizard.formTree"
              title="Whole-Wizard Form State"
            />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class SingleModelWizardPageComponent {
  protected readonly content = SINGLE_MODEL_WIZARD_CONTENT;
  protected readonly wizardRef = viewChild(SingleModelWizardComponent);
}
