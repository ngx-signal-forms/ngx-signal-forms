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
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  template: `
    <ngx-page-header
      title="Your First Form with Toolkit"
      subtitle="Contact form with automatic ARIA, error display strategies, and 43% less code"
    />

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <!-- Error Display Mode Selector -->
      <ngx-error-display-mode-selector
        [(selectedMode)]="selectedMode"
        class="mb-6"
      />

      <ngx-split-layout>
        <ngx-your-first-form
          #formComponent
          [errorDisplayMode]="selectedMode()"
          left
        />
        @if (formComponent) {
          <div right>
            <ngx-signal-form-debugger
              [formTree]="formComponent.contactForm"
              [errorStrategy]="selectedMode()"
            />
          </div>
        }
      </ngx-split-layout>
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
