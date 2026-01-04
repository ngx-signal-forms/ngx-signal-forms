import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { type ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit/core';
import { ExampleCardsComponent, SignalFormDebuggerComponent } from '../../ui';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { ERROR_DISPLAY_MODES_CONTENT } from './error-display-modes.content';
import { ErrorDisplayModesFormComponent } from './error-display-modes.form';

/**
 * Error Display Modes Page Wrapper
 *
 * Provides educational context and houses the interactive demo form.
 * This page demonstrates how different error display modes affect user experience.
 */
@Component({
  selector: 'ngx-error-display-modes-page',
  imports: [
    ExampleCardsComponent,
    ErrorDisplayModeSelectorComponent,
    ErrorDisplayModesFormComponent,
    SignalFormDebuggerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <!-- Header Section -->
      <header class="mb-8">
        <h1 class="page-title">Error Display Strategies</h1>
        <p class="page-subtitle">
          Explore how different error display timing affects user experience
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
          <!-- Interactive Demo Form -->
          <ngx-error-display-modes-form
            #formComponent
            [errorDisplayMode]="selectedMode()"
          />

          <!-- Real-time Form State -->
          @if (formComponent?.productForm(); as form) {
            <ngx-signal-form-debugger
              [formTree]="form"
              [errorStrategy]="selectedMode()"
            />
          }
        </div>
      </ngx-example-cards>
    </div>
  `,
})
export class ErrorDisplayModesPageComponent {
  protected readonly formComponent =
    viewChild<ErrorDisplayModesFormComponent>('formComponent');

  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');

  protected readonly demonstratedContent =
    ERROR_DISPLAY_MODES_CONTENT.demonstrated;
  protected readonly learningContent = ERROR_DISPLAY_MODES_CONTENT.learning;
}
