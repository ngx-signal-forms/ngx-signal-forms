import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import {
  CardComponent,
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
    CardComponent,
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

    <!-- Escape-hatch guidance: wrapper vs headless decision -->
    <ngx-card variant="educational" data-testid="escape-hatch-card">
      <div card-header>
        {{ content.escapeHatch.icon }} {{ content.escapeHatch.title }}
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        @for (section of content.escapeHatch.sections; track section.title) {
          <div>
            <h3
              class="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              {{ section.title }}
            </h3>
            <ul class="space-y-1 text-xs text-gray-700 dark:text-gray-300">
              @for (item of section.items; track item) {
                <li>{{ item }}</li>
              }
            </ul>
          </div>
        }
      </div>
    </ngx-card>
  `,
})
export class HeadlessFieldsetUtilitiesPageComponent {
  protected readonly content = HEADLESS_FIELDSET_UTILITIES_CONTENT;
  protected readonly formRef = viewChild(HeadlessFieldsetUtilitiesComponent);
}
