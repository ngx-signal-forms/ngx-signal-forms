import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { type ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit/core';
import { ExampleCardsComponent, SignalFormDebuggerComponent } from '../../ui';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { CUSTOM_STYLED_FORM_CONTENT } from './custom-styled-form.content';
import { CustomStyledFormComponent } from './custom-styled-form.form';

/**
 * Custom Styled Form Page
 *
 * Demonstrates complete theming of NgxSignalFormFieldComponent using CSS custom properties
 * to match a Figma design system. This example shows a Dutch legal system form for entering
 * prison sentence data with:
 *
 * - **Complete Design System**: All visual aspects controlled via CSS variables
 * - **Outlined Input Layout**: Material Design inspired floating labels
 * - **Nested Card Structure**: Multi-level hierarchy with semi-transparent backgrounds
 * - **Dynamic Arrays**: Add/remove facts, offenses, and legal articles
 * - **Custom Icons**: SVG icons integrated with design system colors
 * - **Consistent Spacing**: Design tokens for all spacing values
 *
 * This page showcases how to create a production-ready form that matches
 * a custom design system while leveraging the toolkit's automatic error display
 * and accessibility features.
 */
@Component({
  selector: 'ngx-custom-styled-form-page',
  imports: [
    CustomStyledFormComponent,
    ErrorDisplayModeSelectorComponent,
    ExampleCardsComponent,
    SignalFormDebuggerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8">
      <h1 class="page-title">Form Field Wrapper - Custom Styled Form</h1>
      <p class="page-subtitle">
        Complete design system theming with CSS custom properties matching Figma
        design
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
        <ngx-custom-styled-form
          #formComponent
          [errorDisplayMode]="selectedMode()"
        />
        @if (formComponent) {
          <ngx-signal-form-debugger [formTree]="formComponent.showcaseForm()" />
        }
      </div>
    </ngx-example-cards>
  `,
})
export class CustomStyledFormPage {
  protected readonly formComponent =
    viewChild.required<CustomStyledFormComponent>('formComponent');

  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');

  protected readonly demonstratedContent =
    CUSTOM_STYLED_FORM_CONTENT.demonstrated;
  protected readonly learningContent = CUSTOM_STYLED_FORM_CONTENT.learning;
}
