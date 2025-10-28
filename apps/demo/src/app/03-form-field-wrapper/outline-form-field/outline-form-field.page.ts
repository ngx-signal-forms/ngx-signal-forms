import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { type ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit/core';
import { ExampleCardsComponent, SignalFormDebuggerComponent } from '../../ui';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { OUTLINE_FORM_FIELD_CONTENT } from './outline-form-field.content';
import { OutlineFormFieldComponent } from './outline-form-field.form';

/**
 * Outline Form Field Page
 *
 * Demonstrates default outlined form field styling that matches the Figma design
 * without custom CSS overrides. This example shows a Dutch legal system form for
 * entering prison sentence data with:
 *
 * - **Default Styling**: Uses toolkit's default outlined form field design
 * - **Figma Design**: Matches Figma design system out of the box
 * - **Outlined Input Layout**: Material Design inspired floating labels
 * - **Nested Card Structure**: Multi-level hierarchy with semi-transparent backgrounds
 * - **Dynamic Arrays**: Add/remove facts, offenses, and legal articles
 * - **Custom Icons**: SVG icons integrated with design system colors
 * - **Consistent Spacing**: Design tokens for all spacing values
 *
 * This page showcases how the default outlined form field styling works
 * immediately without custom theming, while still leveraging the toolkit's
 * automatic error display and accessibility features.
 */
@Component({
  selector: 'ngx-outline-form-field-page',
  imports: [
    OutlineFormFieldComponent,
    ErrorDisplayModeSelectorComponent,
    ExampleCardsComponent,
    SignalFormDebuggerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8">
      <h1 class="page-title">Form Field Wrapper - Outlined Form Fields</h1>
      <p class="page-subtitle">
        Default outlined form field styling matching Figma design
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
        <ngx-outline-form-field
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
export class OutlineFormFieldPage {
  protected readonly formComponent =
    viewChild.required<OutlineFormFieldComponent>('formComponent');

  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');

  protected readonly demonstratedContent =
    OUTLINE_FORM_FIELD_CONTENT.demonstrated;
  protected readonly learningContent = OUTLINE_FORM_FIELD_CONTENT.learning;
}
