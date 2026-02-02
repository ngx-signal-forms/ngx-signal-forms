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
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    SubmissionPatternsComponent,
    ExampleCardsComponent,
    ErrorDisplayModeSelectorComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
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
    <ngx-error-display-mode-selector [(selectedMode)]="errorDisplayMode" />

    <ngx-split-layout>
      <ngx-submission-patterns [errorDisplayMode]="errorDisplayMode()" left />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.registrationForm" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class SubmissionPatternsPage {
  protected readonly errorDisplayMode =
    signal<ErrorDisplayStrategy>('on-touch');
  protected readonly content = SUBMISSION_PATTERNS_CONTENT;
  protected readonly formRef = viewChild(SubmissionPatternsComponent);
}
