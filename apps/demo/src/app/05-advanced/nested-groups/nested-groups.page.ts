import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ExampleCardsComponent, SignalFormDebuggerComponent } from '../../ui';
import { NESTED_GROUPS_CONTENT } from './nested-groups.content';
import { NestedGroupsComponent } from './nested-groups.form';

@Component({
  selector: 'ngx-nested-groups-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NestedGroupsComponent,
    ExampleCardsComponent,
    SignalFormDebuggerComponent,
  ],
  template: `
    <header class="mb-8">
      <h1 class="page-title">Nested Form Groups</h1>
      <p class="page-subtitle">
        Handling complex, hierarchical data structures
      </p>
    </header>

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
