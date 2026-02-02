import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import { HEADLESS_ERROR_STATE_CONTENT } from './error-state.content';
import { HeadlessErrorStateComponent } from './error-state.form';

@Component({
  selector: 'ngx-headless-error-state-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    HeadlessErrorStateComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  template: `
    <ngx-page-header
      title="Headless Error State"
      subtitle="Build custom UI with headless directives"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />
    <ngx-split-layout>
      <ngx-headless-error-state left />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.profileForm" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class HeadlessErrorStatePageComponent {
  protected readonly content = HEADLESS_ERROR_STATE_CONTENT;
  protected readonly formRef = viewChild(HeadlessErrorStateComponent);
}
