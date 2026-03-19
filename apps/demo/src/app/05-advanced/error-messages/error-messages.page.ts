import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import {
  type ErrorDisplayStrategy,
  type FormFieldAppearance,
} from '@ngx-signal-forms/toolkit';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import {
  AppearanceToggleComponent,
  DisplayControlsCardComponent,
  DisplayControlsSectionComponent,
  ExampleCardsComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import { APPEARANCE_LABELS } from '../../ui/appearance-toggle';
import {
  ERROR_DISPLAY_MODE_LABELS,
  ErrorDisplayModeSelectorComponent,
} from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { ERROR_MESSAGES_CONTENT } from './error-messages.content';
import { ErrorMessagesComponent } from './error-messages.form';

/**
 * Error Messages Page
 *
 * Demonstrates the 3-tier error message priority system:
 * 1. Validator message (highest priority)
 * 2. Registry override (fallback)
 * 3. Default toolkit message (final fallback)
 */
@Component({
  selector: 'ngx-error-messages-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    ErrorMessagesComponent,
    ExampleCardsComponent,
    ErrorDisplayModeSelectorComponent,
    AppearanceToggleComponent,
    DisplayControlsCardComponent,
    DisplayControlsSectionComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  template: `
    <ngx-page-header
      title="Error Message Configuration"
      subtitle="3-tier priority system: validator → registry → default fallback"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <ngx-display-controls-card
      title="Message source comparison"
      description="Hold the form constant while comparing three message sources—validator copy, registry overrides, and toolkit fallbacks—under the same validation timing rules."
      [chips]="currentControlChips()"
      layout="split"
    >
      <ngx-error-display-mode-selector
        [(selectedMode)]="errorDisplayMode"
        [embedded]="true"
        display-controls-primary
        class="block min-w-0"
      />

      <ngx-display-controls-section
        title="🎨 Message framing"
        description="Switch the wrapper treatment to see whether the origin of each message still feels obvious when the visual chrome becomes quieter or stronger."
      >
        <ngx-appearance-toggle [(value)]="selectedAppearance" />
      </ngx-display-controls-section>
    </ngx-display-controls-card>
    <ngx-split-layout>
      <ngx-error-messages
        [errorDisplayMode]="errorDisplayMode()"
        [appearance]="selectedAppearance()"
        left
      />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.errorMessagesForm" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class ErrorMessagesPage {
  protected readonly errorDisplayMode =
    signal<ErrorDisplayStrategy>('on-touch');
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('outline');
  protected readonly currentControlChips = computed(() => [
    {
      label: 'Mode',
      value: ERROR_DISPLAY_MODE_LABELS[this.errorDisplayMode()],
    },
    {
      label: 'Appearance',
      value: APPEARANCE_LABELS[this.selectedAppearance()],
    },
  ]);
  protected readonly content = ERROR_MESSAGES_CONTENT;
  protected readonly formRef = viewChild(ErrorMessagesComponent);
}
