import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import {
  ExampleCardsComponent,
  PageHeaderComponent,
  SignalFormDebuggerComponent,
  SplitLayoutComponent,
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
    SplitLayoutComponent,
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

    <ngx-split-layout>
      <ngx-nested-groups left />

      @if (formRef(); as form) {
        <div right>
          <ngx-signal-form-debugger [formTree]="form.profileForm()" />
        </div>
      }
    </ngx-split-layout>
  `,
})
export class NestedGroupsPageComponent {
  protected readonly content = NESTED_GROUPS_CONTENT;
  protected readonly formRef = viewChild(NestedGroupsComponent);
}
