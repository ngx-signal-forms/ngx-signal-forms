import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit/core';
import { ExampleCardsComponent, SignalFormDebuggerComponent } from '../../ui';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { ERROR_MESSAGES_CONTENT } from './error-messages.content';
import { ErrorMessagesComponent } from './error-messages.form';

/**
 * Error Messages Page
 *
 * Demonstrates the 3-tier error message priority system:
 * 1. Validator message (highest priority)
 * 2. Registry override (fallback)
 * 3. Default toolkit message (final fallback)
 */
@Component({
  selector: 'ngx-error-messages-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ErrorMessagesComponent,
    ExampleCardsComponent,
    ErrorDisplayModeSelectorComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <header class="mb-8">
      <h1 class="page-title">Error Message Configuration</h1>
      <p class="page-subtitle">
        3-tier priority system: validator → registry → default fallback
      </p>
    </header>

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <!-- Error Display Mode Selector -->
    <ngx-error-display-mode-selector
      [(selectedMode)]="errorDisplayMode"
      class="mb-6"
    />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ngx-error-messages [errorDisplayMode]="errorDisplayMode()" />

      @if (formRef(); as form) {
        <ngx-signal-form-debugger [formTree]="form.errorMessagesForm()" />
      }
    </div>
  `,
})
export class ErrorMessagesPage {
  protected readonly errorDisplayMode =
    signal<ErrorDisplayStrategy>('on-touch');
  protected readonly content = ERROR_MESSAGES_CONTENT;
  protected readonly formRef = viewChild(ErrorMessagesComponent);
}
