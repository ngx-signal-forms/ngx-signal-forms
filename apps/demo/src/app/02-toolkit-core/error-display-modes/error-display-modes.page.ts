import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { type ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
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
    DisplayControlsCardComponent,
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
        <ngx-display-controls-card
          title="Strategy playground"
          description="Switch between the timing strategies and compare how the same validation scenario feels when feedback is immediate, on touch, or delayed until submit."
          [chips]="currentControlChips()"
        >
          <ngx-error-display-mode-selector
            [(selectedMode)]="selectedMode"
            [embedded]="true"
            display-controls-primary
            class="block min-w-0"
          />
        </ngx-display-controls-card>

        @switch (selectedMode()) {
          @case ('immediate') {
            <ngx-split-layout>
              <ngx-error-display-modes-form
                #formComponent
                [errorDisplayMode]="'immediate'"
                left
              />

              @if (formComponent) {
                <div right>
                  <ngx-signal-form-debugger
                    [formTree]="formComponent.productForm"
                    [errorStrategy]="'immediate'"
                  />
                </div>
              }
            </ngx-split-layout>
          }

          @case ('on-submit') {
            <ngx-split-layout>
              <ngx-error-display-modes-form
                #formComponent
                [errorDisplayMode]="'on-submit'"
                left
              />

              @if (formComponent) {
                <div right>
                  <ngx-signal-form-debugger
                    [formTree]="formComponent.productForm"
                    [errorStrategy]="'on-submit'"
                  />
                </div>
              }
            </ngx-split-layout>
          }

          @default {
            <ngx-split-layout>
              <ngx-error-display-modes-form
                #formComponent
                [errorDisplayMode]="'on-touch'"
                left
              />

              @if (formComponent) {
                <div right>
                  <ngx-signal-form-debugger
                    [formTree]="formComponent.productForm"
                    [errorStrategy]="'on-touch'"
                  />
                </div>
              }
            </ngx-split-layout>
          }
        }
      </ngx-example-cards>
    </div>
  `,
})
export class ErrorDisplayModesPageComponent {
  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');
  protected readonly currentControlChips = computed(() => [
    {
      label: 'Mode',
      value: ERROR_DISPLAY_MODE_LABELS[this.selectedMode()],
    },
  ]);

  protected readonly demonstratedContent =
    ERROR_DISPLAY_MODES_CONTENT.demonstrated;
  protected readonly learningContent = ERROR_DISPLAY_MODES_CONTENT.learning;
}
