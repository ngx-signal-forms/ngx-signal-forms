import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import type {
  ErrorDisplayStrategy,
  FormFieldAppearance,
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
import {
  ERROR_DISPLAY_MODE_LABELS,
  ErrorDisplayModeSelectorComponent,
} from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { APPEARANCE_LABELS } from '../../ui/appearance-toggle';
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
    AppearanceToggleComponent,
    DisplayControlsCardComponent,
    DisplayControlsSectionComponent,
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
      <ngx-display-controls-card
        title="Custom control integration checks"
        description="Verify that a non-native control still inherits the same validation timing, wrapper affordances, and debugging story as the regular toolkit fields around it."
        [chips]="currentControlChips()"
        layout="split"
      >
        <ngx-error-display-mode-selector
          [(selectedMode)]="selectedMode"
          [embedded]="true"
          display-controls-primary
          class="block min-w-0"
        />

        <ngx-display-controls-section
          title="🎨 Wrapper styling"
          description="Change the wrapper treatment without changing the custom control contract, so labels, hints, and errors can be evaluated independently from the rating UI itself."
        >
          <ngx-appearance-toggle [(value)]="selectedAppearance" />
        </ngx-display-controls-section>
      </ngx-display-controls-card>

      <ngx-split-layout>
        <ngx-custom-controls
          #formComponent
          [errorDisplayMode]="selectedMode()"
          [appearance]="selectedAppearance()"
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
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('standard');
  protected readonly currentControlChips = computed(() => [
    {
      label: 'Mode',
      value: ERROR_DISPLAY_MODE_LABELS[this.selectedMode()],
    },
    {
      label: 'Appearance',
      value: APPEARANCE_LABELS[this.selectedAppearance()],
    },
  ]);

  protected readonly demonstratedContent = CUSTOM_CONTROLS_CONTENT.demonstrated;
  protected readonly learningContent = CUSTOM_CONTROLS_CONTENT.learning;
}
