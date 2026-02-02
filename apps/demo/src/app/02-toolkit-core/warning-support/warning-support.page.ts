import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { type ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SignalFormDebuggerComponent,
  SplitLayoutComponent,
} from '../../ui';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { WARNING_SUPPORT_CONTENT } from './warning-support.content';
import { WarningsSupportFormComponent } from './warning-support.form';

/**
 * Warning Support Page
 *
 * Demonstrates the distinction between blocking errors and non-blocking warnings.
 * Shows WCAG 2.2 compliant messaging patterns for accessible validation.
 */
@Component({
  selector: 'ngx-warning-support-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleCardsComponent,
    ErrorDisplayModeSelectorComponent,
    PageHeaderComponent,
    WarningsSupportFormComponent,
    SplitLayoutComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <ngx-page-header
      title="Warning Support"
      subtitle="Distinguish between blocking errors (prevent submission) and non-blocking warnings (guidance only). WCAG 2.2 compliant messaging patterns."
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <!-- Error Display Mode Selector -->
      <ngx-error-display-mode-selector
        [(selectedMode)]="selectedMode"
        class="mb-6"
      />

      <ngx-split-layout>
        <ngx-warning-support-form
          #formComponent
          [errorDisplayMode]="selectedMode()"
          left
        />
        @if (formComponent) {
          <div right>
            <ngx-signal-form-debugger [formTree]="formComponent.passwordForm" />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class WarningsSupportPageComponent {
  protected readonly content = WARNING_SUPPORT_CONTENT;
  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');
  protected readonly formComponent =
    viewChild<WarningsSupportFormComponent>('formComponent');
}
