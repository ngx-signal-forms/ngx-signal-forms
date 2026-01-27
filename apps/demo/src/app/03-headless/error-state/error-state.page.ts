import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ExampleCardsComponent, SignalFormDebuggerComponent } from '../../ui';
import { HEADLESS_ERROR_STATE_CONTENT } from './error-state.content';
import { HeadlessErrorStateComponent } from './error-state.form';

@Component({
  selector: 'ngx-headless-error-state-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeadlessErrorStateComponent,
    ExampleCardsComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <header class="mb-8">
      <h1 class="page-title">Headless Error State</h1>
      <p class="page-subtitle">Build custom UI with headless directives</p>
    </header>

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ngx-headless-error-state />

      @if (formRef(); as form) {
        <ngx-signal-form-debugger [formTree]="form.profileForm()" />
      }
    </div>
  `,
})
export class HeadlessErrorStatePageComponent {
  protected readonly content = HEADLESS_ERROR_STATE_CONTENT;
  protected readonly formRef = viewChild(HeadlessErrorStateComponent);
}
