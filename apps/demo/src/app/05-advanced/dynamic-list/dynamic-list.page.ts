import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SignalFormDebuggerComponent,
  SplitLayoutComponent,
} from '../../ui';
import { DYNAMIC_LIST_CONTENT } from './dynamic-list.content';
import { DynamicListComponent } from './dynamic-list.form';

@Component({
  selector: 'ngx-dynamic-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamicListComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    SignalFormDebuggerComponent,
    SplitLayoutComponent,
  ],
  template: `
    <ngx-page-header
      title="Dynamic Lists (Form Arrays)"
      subtitle="Managing arrays of data with Signal Forms"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <ngx-split-layout>
      <ngx-dynamic-list left />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.tasksForm()" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class DynamicListPageComponent {
  protected readonly content = DYNAMIC_LIST_CONTENT;
  protected readonly formRef = viewChild(DynamicListComponent);
}
