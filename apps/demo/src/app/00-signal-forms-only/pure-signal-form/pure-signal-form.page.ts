import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ExampleCardsComponent, SignalFormDebuggerComponent } from '../../ui';
import { PURE_SIGNAL_FORM_CONTENT } from './pure-signal-form.content';
import { PureSignalFormComponent } from './pure-signal-form.form';

/**
 * Pure Signal Forms Page - Baseline Example
 *
 * Demonstrates what you must write manually when using Angular Signal Forms
 * WITHOUT the @ngx-signal-forms/toolkit enhancement library.
 *
 * This is the baseline example showing:
 * - Manual ARIA attribute bindings
 * - Manual error visibility logic
 * - Manual touch state tracking
 * - Manual error container setup
 *
 * Compare with toolkit examples to see the improvements.
 */
@Component({
  selector: 'ngx-pure-signal-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PureSignalFormComponent,
    ExampleCardsComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <header class="mb-8">
      <h1 class="page-title">Pure Signal Forms (No Toolkit)</h1>
      <p class="page-subtitle">
        Baseline: What you write manually without the enhancement library
      </p>
    </header>

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ngx-pure-signal-form />

      @if (formRef(); as form) {
        <ngx-signal-form-debugger [formTree]="form.signupForm()" />
      }
    </div>
  `,
})
export class PureSignalFormPageComponent {
  protected readonly content = PURE_SIGNAL_FORM_CONTENT;
  protected readonly formRef = viewChild(PureSignalFormComponent);
}
