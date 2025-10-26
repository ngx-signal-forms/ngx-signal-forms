import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit/core';
import { ExampleCardsComponent, SignalFormDebuggerComponent } from '../../ui';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { YOUR_FIRST_FORM_CONTENT } from './your-first-form.content';
import { YourFirstFormComponent } from './your-first-form.form';

/**
 * Your First Form Page - Getting Started with Toolkit
 *
 * Demonstrates basic toolkit features while maintaining manual control over layout.
 * This is the middle ground between pure Signal Forms and full toolkit adoption.
 *
 * Shows:
 * - ngxSignalForm for context and submission tracking
 * - Automatic ARIA attributes
 * - NgxSignalFormErrorComponent for reusable error display
 * - Error display strategies
 * - Manual HTML layout (you control structure)
 */
@Component({
  selector: 'ngx-your-first-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    YourFirstFormComponent,
    ExampleCardsComponent,
    ErrorDisplayModeSelectorComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <header class="mb-8">
      <h1 class="page-title">Your First Form with Toolkit</h1>
      <p class="page-subtitle">
        Contact form with automatic ARIA, error display strategies, and 43% less
        code
      </p>
    </header>

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <!-- Error Display Mode Selector -->
      <ngx-error-display-mode-selector
        [(selectedMode)]="selectedMode"
        class="mb-6"
      />

      <!-- Side-by-side layout for form and debugger -->
      <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <ngx-your-first-form
          #formComponent
          [errorDisplayMode]="selectedMode()"
        />
        @if (formComponent) {
          <ngx-signal-form-debugger
            [formTree]="formComponent.contactForm"
            [errorStrategy]="selectedMode()"
          />
        }
      </div>
    </ngx-example-cards>
  `,
})
export class YourFirstFormPageComponent {
  protected readonly formComponent =
    viewChild.required<YourFirstFormComponent>('formComponent');

  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');

  protected readonly demonstratedContent = YOUR_FIRST_FORM_CONTENT.demonstrated;
  protected readonly learningContent = YOUR_FIRST_FORM_CONTENT.learning;
}
