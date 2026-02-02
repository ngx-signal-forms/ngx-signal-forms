import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { type ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
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
    ErrorDisplayModesFormComponent,
    ExampleCardsComponent,
    ErrorDisplayModeSelectorComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <!-- Header Section -->
      <ngx-page-header
        title="Error Display Strategies"
        subtitle="Explore how different error display timing affects user experience"
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

        <!-- Side-by-side layout for form and debugger -->
        <ngx-split-layout>
          <!-- Interactive Demo Form -->
          <ngx-error-display-modes-form
            #formComponent
            [errorDisplayMode]="selectedMode()"
            left
          />

          <!-- Real-time Form State -->
          @if (formComponent) {
            <div right>
              <ngx-signal-form-debugger
                [formTree]="formComponent.productForm"
                [errorStrategy]="selectedMode()"
              />
            </div>
          }
        </ngx-split-layout>
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
