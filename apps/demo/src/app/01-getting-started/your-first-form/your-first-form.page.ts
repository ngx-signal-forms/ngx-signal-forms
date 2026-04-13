import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import {
  DisplayControlsCardComponent,
  ExampleCardsComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import {
  ERROR_DISPLAY_MODE_LABELS,
  ErrorDisplayModeSelectorComponent,
} from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { YOUR_FIRST_FORM_CONTENT } from './your-first-form.content';
import { YourFirstFormComponent } from './your-first-form.form';

/**
 * Your First Form Page - Getting Started with Toolkit
 *
 * Demonstrates basic toolkit features while maintaining manual control over layout.
 * This is the middle ground between pure Signal Forms and full toolkit adoption.
 *
 * Shows:
 * - [formRoot] directive for context and submission tracking
 * - Automatic ARIA attributes
 * - NgxFormFieldErrorComponent for reusable error display
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
    DisplayControlsCardComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  template: `
    <ngx-page-header
      title="Your First Form with Toolkit"
      subtitle="Contact form onboarding with automatic ARIA, strategy controls, and baseline-to-toolkit setup guidance"
    />

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <ngx-display-controls-card
        title="Validation timing controls"
        description="Change when this first toolkit form reveals errors so you can compare the same contact flow under different timing strategies."
        [chips]="currentControlChips()"
      >
        <ngx-error-display-mode-selector
          [(selectedMode)]="selectedMode"
          [embedded]="true"
          display-controls-primary
          class="block min-w-0"
        />
      </ngx-display-controls-card>

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
  protected readonly currentControlChips = computed(() => [
    {
      label: 'Mode',
      value: ERROR_DISPLAY_MODE_LABELS[this.selectedMode()],
    },
  ]);

  protected readonly demonstratedContent = YOUR_FIRST_FORM_CONTENT.demonstrated;
  protected readonly learningContent = YOUR_FIRST_FORM_CONTENT.learning;
}
