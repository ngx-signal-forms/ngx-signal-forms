import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
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
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    ErrorMessagesComponent,
    ExampleCardsComponent,
    ErrorDisplayModeSelectorComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  template: `
    <ngx-page-header
      title="Error Message Configuration"
      subtitle="3-tier priority system: validator → registry → default fallback"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <!-- Error Display Mode Selector -->
    <ngx-error-display-mode-selector [(selectedMode)]="errorDisplayMode" />
    <ngx-split-layout>
      <ngx-error-messages [errorDisplayMode]="errorDisplayMode()" left />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.errorMessagesForm" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class ErrorMessagesPage {
  protected readonly errorDisplayMode =
    signal<ErrorDisplayStrategy>('on-touch');
  protected readonly content = ERROR_MESSAGES_CONTENT;
  protected readonly formRef = viewChild(ErrorMessagesComponent);
}
