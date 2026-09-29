import { Component, computed, signal, viewChild } from '@angular/core';
import { type ResolvedErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/debugger';
import {
  DisplayControlsCardComponent,
  ExampleCardsComponent,
  NgxPageControlsDirective,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import {
  ERROR_DISPLAY_MODE_LABELS,
  ErrorDisplayModeSelectorComponent,
} from '../../ui/error-display-mode-selector/error-display-mode-selector';
import { WARNING_SUPPORT_CONTENT } from './warning-support.content';
import { WarningsSupportFormComponent } from './warning-support.form';

@Component({
  selector: 'ngx-warning-support-page',

  imports: [
    ExampleCardsComponent,
    ErrorDisplayModeSelectorComponent,
    DisplayControlsCardComponent,
    NgxPageControlsDirective,
    PageHeaderComponent,
    WarningsSupportFormComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  template: `
    <ng-template ngxPageControls>
      <ngx-display-controls-card
        title="Warning timing controls"
        description="Compare how blocking errors and non-blocking warnings appear when feedback is immediate versus delayed until the field has been touched."
        [chips]="currentControlChips()"
      >
        <ngx-error-display-mode-selector
          [modes]="supportedModes"
          [(selectedMode)]="selectedMode"
          [embedded]="true"
          display-controls-primary
          class="block min-w-0"
        />
      </ngx-display-controls-card>
    </ng-template>

    <ngx-page-header
      title="Warning Support"
      subtitle="Distinguish between blocking errors (prevent submission) and non-blocking warnings (guidance only). WCAG 2.2 compliant messaging patterns."
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <ngx-split-layout>
        <ngx-warning-support-form
          #formComponent
          [errorDisplayMode]="selectedMode()"
          left
        />
        @if (formComponent) {
          <div right>
            @defer (on idle) {
              <ngx-signal-form-debugger
                [formTree]="formComponent.passwordForm"
              />
            } @placeholder {
              <div class="debugger-placeholder" aria-hidden="true"></div>
            } @error {
              <p class="debugger-placeholder">
                The form debugger failed to load.
              </p>
            }
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class WarningsSupportPageComponent {
  protected readonly content = WARNING_SUPPORT_CONTENT;
  protected readonly supportedModes = ['immediate', 'on-touch'] as const;
  protected readonly selectedMode =
    signal<ResolvedErrorDisplayStrategy>('on-touch');
  protected readonly currentControlChips = computed(() => [
    {
      label: 'Mode',
      value: ERROR_DISPLAY_MODE_LABELS[this.selectedMode()],
    },
  ]);
  protected readonly formComponent =
    viewChild<WarningsSupportFormComponent>('formComponent');
}
