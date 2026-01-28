import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SignalFormDebuggerComponent,
} from '../../ui';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { SUBMISSION_PATTERNS_CONTENT } from './submission-patterns.content';
import { SubmissionPatternsComponent } from './submission-patterns.form';

/**
 * Submission Patterns Page
 *
 * Demonstrates form submission patterns with async operations and server errors.
 */
@Component({
  selector: 'ngx-submission-patterns-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SubmissionPatternsComponent,
    ExampleCardsComponent,
    ErrorDisplayModeSelectorComponent,
    PageHeaderComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <ngx-page-header
      title="Form Submission Patterns"
      subtitle="Async operations, server errors, and WCAG 2.2 compliance"
    />

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
      <ngx-submission-patterns [errorDisplayMode]="errorDisplayMode()" />

      @if (formRef(); as form) {
        <ngx-signal-form-debugger [formTree]="form.registrationForm()" />
      }
    </div>
  `,
})
export class SubmissionPatternsPage {
  protected readonly errorDisplayMode =
    signal<ErrorDisplayStrategy>('on-touch');
  protected readonly content = SUBMISSION_PATTERNS_CONTENT;
  protected readonly formRef = viewChild(SubmissionPatternsComponent);
}
