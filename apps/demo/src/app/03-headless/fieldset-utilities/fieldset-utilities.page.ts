import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import { HEADLESS_FIELDSET_UTILITIES_CONTENT } from './fieldset-utilities.content';
import { HeadlessFieldsetUtilitiesComponent } from './fieldset-utilities.form';

@Component({
  selector: 'ngx-headless-fieldset-utilities-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    ExampleCardsComponent,
    HeadlessFieldsetUtilitiesComponent,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  template: `
    <ngx-page-header
      title="Headless Fieldset + Utilities"
      subtitle="Group state, field naming, and utilities for custom UI"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <ngx-split-layout>
        <ngx-headless-fieldset-utilities left />

        @if (formRef(); as form) {
          <div right>
            <ngx-signal-form-debugger [formTree]="form.deliveryForm" />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class HeadlessFieldsetUtilitiesPageComponent {
  protected readonly content = HEADLESS_FIELDSET_UTILITIES_CONTENT;
  protected readonly formRef = viewChild(HeadlessFieldsetUtilitiesComponent);
}
