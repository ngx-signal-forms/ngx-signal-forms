import { Component } from '@angular/core';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import { ERROR_MESSAGE_SIGNAL_CONTENT } from './error-message-signal.content';
import { ErrorMessageSignalComponent } from './error-message-signal.form';

@Component({
  selector: 'ngx-error-message-signal-page',

  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    ExampleCardsComponent,
    ErrorMessageSignalComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
  ],
  template: `
    <ngx-page-header
      title="createErrorMessageSignal"
      subtitle="Flat error iteration with visibility gating, message resolution, and stable ARIA IDs"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <ngx-split-layout>
        <ngx-error-message-signal left />
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class ErrorMessageSignalPageComponent {
  protected readonly content = ERROR_MESSAGE_SIGNAL_CONTENT;
}
