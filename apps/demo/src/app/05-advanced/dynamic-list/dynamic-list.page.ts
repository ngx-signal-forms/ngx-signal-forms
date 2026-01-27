import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ExampleCardsComponent, SignalFormDebuggerComponent } from '../../ui';
import { DYNAMIC_LIST_CONTENT } from './dynamic-list.content';
import { DynamicListComponent } from './dynamic-list.form';

@Component({
  selector: 'ngx-dynamic-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamicListComponent,
    ExampleCardsComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <header class="mb-8">
      <h1 class="page-title">Dynamic Lists (Form Arrays)</h1>
      <p class="page-subtitle">Managing arrays of data with Signal Forms</p>
    </header>

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ngx-dynamic-list />

      @if (formRef(); as form) {
        <ngx-signal-form-debugger [formTree]="form.tasksForm()" />
      }
    </div>
  `,
})
export class DynamicListPageComponent {
  protected readonly content = DYNAMIC_LIST_CONTENT;
  protected readonly formRef = viewChild(DynamicListComponent);
}
