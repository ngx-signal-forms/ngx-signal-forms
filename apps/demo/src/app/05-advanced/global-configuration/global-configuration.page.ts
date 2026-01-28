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
  SplitLayoutComponent,
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
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    GlobalConfigurationComponent,
    ExampleCardsComponent,
    ErrorDisplayModeSelectorComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
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
    <ngx-error-display-mode-selector [(selectedMode)]="errorDisplayMode" />
    <ngx-split-layout>
      <ngx-global-configuration [errorDisplayMode]="errorDisplayMode()" left />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.configForm()" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class GlobalConfigurationPage {
  protected readonly errorDisplayMode =
    signal<ErrorDisplayStrategy>('on-touch');
  protected readonly content = GLOBAL_CONFIG_CONTENT;
  protected readonly formRef = viewChild(GlobalConfigurationComponent);
}
