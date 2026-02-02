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
import { CUSTOM_CONTROLS_CONTENT } from './custom-controls.content';
import { CustomControlsComponent } from './custom-controls.form';

/**
 * Custom Controls Demo Page
 *
 * Demonstrates how custom Angular Signal Forms controls (FormValueControl)
 * work seamlessly with ngx-signal-form-field-wrapper.
 *
 * Key features:
 * - Custom RatingControl implementing FormValueControl<number>
 * - Auto-derivation of fieldName from custom control's id attribute
 * - Full validation and error display integration
 * - Keyboard navigation and accessibility
 */
@Component({
  selector: 'ngx-custom-controls-page',
  imports: [
    CustomControlsComponent,
    ErrorDisplayModeSelectorComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-page-header
      title="Custom Signal Forms Controls"
      subtitle="FormValueControl components with form field wrapper integration"
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
        <ngx-custom-controls
          #formComponent
          [errorDisplayMode]="selectedMode()"
          left
        />
        @if (formComponent) {
          <div right>
            <ngx-signal-form-debugger [formTree]="formComponent.reviewForm" />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class CustomControlsPage {
  protected readonly formComponent =
    viewChild.required<CustomControlsComponent>('formComponent');

  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');

  protected readonly demonstratedContent = CUSTOM_CONTROLS_CONTENT.demonstrated;
  protected readonly learningContent = CUSTOM_CONTROLS_CONTENT.learning;
}
