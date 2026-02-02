import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
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
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    PureSignalFormComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  template: `
    <ngx-page-header
      title="Pure Signal Forms (No Toolkit)"
      subtitle="Baseline: What you write manually without the enhancement library"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />
    <ngx-split-layout>
      <ngx-pure-signal-form left />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.signupForm" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class PureSignalFormPageComponent {
  protected readonly content = PURE_SIGNAL_FORM_CONTENT;
  protected readonly formRef = viewChild(PureSignalFormComponent);
}
