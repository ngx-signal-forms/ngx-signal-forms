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
    AppearanceToggleComponent,
    DisplayControlsCardComponent,
    DisplayControlsSectionComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
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

    <ngx-display-controls-card
      title="Default-versus-override controls"
      description="Use local overrides to pressure-test the global toolkit defaults and make the precedence chain visible: app config first, page override second, rendered form last."
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
        title="🎨 Appearance override"
        description="Swap the wrapper treatment to show that visual defaults can diverge from the globally configured baseline without changing the underlying validation rules."
      >
        <ngx-appearance-toggle [(value)]="selectedAppearance" />
      </ngx-display-controls-section>
    </ngx-display-controls-card>
    <ngx-split-layout>
      <ngx-global-configuration
        [errorDisplayMode]="errorDisplayMode()"
        [appearance]="selectedAppearance()"
        left
      />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.configForm" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class GlobalConfigurationPage {
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
  protected readonly content = GLOBAL_CONFIG_CONTENT;
  protected readonly formRef = viewChild(GlobalConfigurationComponent);
}
