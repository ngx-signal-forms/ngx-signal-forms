import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SignalFormDebuggerComponent,
} from '../../ui';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { GLOBAL_CONFIG_CONTENT } from './global-configuration.content';
import { GlobalConfigurationComponent } from './global-configuration.form';

/**
 * Global Configuration Page
 *
 * Demonstrates global toolkit configuration via provideNgxSignalFormsConfig().
 * Shows how to set defaults for error strategies, ARIA attributes, and field resolution.
 */
@Component({
  selector: 'ngx-global-configuration-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    GlobalConfigurationComponent,
    ExampleCardsComponent,
    ErrorDisplayModeSelectorComponent,
    PageHeaderComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <ngx-page-header
      title="Global Toolkit Configuration"
      subtitle="Configure toolkit defaults globally with provideNgxSignalFormsConfig()"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <!-- Error Display Mode Selector -->
    <ngx-error-display-mode-selector
      [(selectedMode)]="errorDisplayMode"
      class="mb-6"
    />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ngx-global-configuration [errorDisplayMode]="errorDisplayMode()" />

      @if (formRef(); as form) {
        <ngx-signal-form-debugger [formTree]="form.configForm()" />
      }
    </div>
  `,
})
export class GlobalConfigurationPage {
  protected readonly errorDisplayMode =
    signal<ErrorDisplayStrategy>('on-touch');
  protected readonly content = GLOBAL_CONFIG_CONTENT;
  protected readonly formRef = viewChild(GlobalConfigurationComponent);
}
