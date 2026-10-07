import { Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { ExampleCardsComponent, PageHeaderComponent } from '../../ui';
import {
  FIELDSET_APPEARANCE_CONTENT,
  FIELDSET_COMPOSITION_CONTENT,
  GROUPED_FEEDBACK_CONTENT,
} from './fieldset-appearance.content';
import { FieldsetAppearanceFormComponent } from './fieldset-appearance.form';
import type { FieldsetExample } from '../complex-forms/fieldset.form';

const EXAMPLES = {
  appearance: {
    title: 'Fieldset Appearance',
    subtitle:
      'Compare fieldset shells and surface tones with one address group',
    content: FIELDSET_APPEARANCE_CONTENT,
  },
  feedback: {
    title: 'Grouped Feedback and Placement',
    subtitle:
      'Compare notification cards, lists, titles, and message placement',
    content: GROUPED_FEEDBACK_CONTENT,
  },
  composition: {
    title: 'Fieldset Composition',
    subtitle:
      'Explore nested aggregation, conditional groups, and cross-field validation',
    content: FIELDSET_COMPOSITION_CONTENT,
  },
} as const;

@Component({
  selector: 'ngx-fieldset-appearance-page',

  imports: [
    ExampleCardsComponent,
    PageHeaderComponent,
    FieldsetAppearanceFormComponent,
    RouterLink,
    RouterLinkActive,
  ],
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  template: `
    <ngx-page-header
      [title]="currentExample().title"
      [subtitle]="currentExample().subtitle"
    />

    <nav aria-label="Fieldset examples" class="flex flex-wrap gap-4">
      @for (link of exampleLinks; track link.path) {
        <a
          [routerLink]="link.path"
          routerLinkActive="font-semibold"
          [routerLinkActiveOptions]="{ exact: true }"
          ariaCurrentWhenActive="page"
          class="text-link"
          >{{ link.label }}</a
        >
      }
    </nav>

    <ngx-example-cards
      [demonstrated]="currentExample().content.demonstrated"
      [learning]="currentExample().content.learning"
    >
      <ngx-fieldset-appearance-form [example]="example()" />
    </ngx-example-cards>
  `,
})
export class FieldsetAppearancePage {
  readonly example = input<FieldsetExample>('appearance');
  protected readonly currentExample = computed(() => EXAMPLES[this.example()]);
  protected readonly exampleLinks = [
    { path: DEMO_PATHS.fieldsetAppearance, label: 'Appearance' },
    { path: DEMO_PATHS.groupedFeedback, label: 'Grouped Feedback' },
    { path: DEMO_PATHS.fieldsetComposition, label: 'Composition' },
    { path: DEMO_PATHS.complexForms, label: 'Nested Forms and Arrays' },
  ];
}
