import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleCardsComponent, PageHeaderComponent } from '../../ui';
import { FIELDSET_APPEARANCE_CONTENT } from './fieldset-appearance.content';
import { FieldsetAppearanceFormComponent } from './fieldset-appearance.form';

@Component({
  selector: 'ngx-fieldset-appearance-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleCardsComponent,
    PageHeaderComponent,
    FieldsetAppearanceFormComponent,
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
      title="Fieldset Appearance + Grouping"
      subtitle="Compare grouped summaries, nested aggregation, and surfaced tones for NgxFormFieldset"
    />

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <ngx-fieldset-appearance-form />
    </ngx-example-cards>
  `,
})
export class FieldsetAppearancePage {
  protected readonly demonstratedContent =
    FIELDSET_APPEARANCE_CONTENT.demonstrated;
  protected readonly learningContent = FIELDSET_APPEARANCE_CONTENT.learning;
}
