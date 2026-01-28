import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SignalFormDebuggerComponent,
} from '../../ui';
import { NESTED_GROUPS_CONTENT } from './nested-groups.content';
import { NestedGroupsComponent } from './nested-groups.form';

@Component({
  selector: 'ngx-nested-groups-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NestedGroupsComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <ngx-page-header
      title="Nested Form Groups"
      subtitle="Handling complex, hierarchical data structures"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ngx-nested-groups />

      @if (formRef(); as form) {
        <ngx-signal-form-debugger [formTree]="form.profileForm()" />
      }
    </div>
  `,
})
export class NestedGroupsPageComponent {
  protected readonly content = NESTED_GROUPS_CONTENT;
  protected readonly formRef = viewChild(NestedGroupsComponent);
}
