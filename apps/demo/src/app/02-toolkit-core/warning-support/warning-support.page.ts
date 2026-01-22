import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { type ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import { ExampleCardsComponent, SignalFormDebuggerComponent } from '../../ui';
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
    WarningsSupportFormComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <header class="mb-8">
      <h1 class="page-title">Warning Support</h1>
      <p class="page-subtitle">
        Distinguish between blocking errors (prevent submission) and
        non-blocking warnings (guidance only). WCAG 2.2 compliant messaging
        patterns.
      </p>
    </header>

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <!-- Error Display Mode Selector -->
      <ngx-error-display-mode-selector
        [(selectedMode)]="selectedMode"
        class="mb-6"
      />

      <!-- Side-by-side layout for form and debugger -->
      <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <ngx-warning-support-form
          #formComponent
          [errorDisplayMode]="selectedMode()"
        />
        @if (formComponent) {
          <ngx-signal-form-debugger [formTree]="formComponent.passwordForm()" />
        }
      </div>
    </ngx-example-cards>
  `,
})
export class WarningsSupportPageComponent {
  protected readonly content = WARNING_SUPPORT_CONTENT;
  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');
  protected readonly formComponent =
    viewChild<WarningsSupportFormComponent>('formComponent');
}
