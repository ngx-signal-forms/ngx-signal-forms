import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { Field, form } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit/core';
import { NgxOutlinedFormField } from '@ngx-signal-forms/toolkit/form-field';
import {
  createEmptyArticle,
  createEmptyFact,
  createEmptyOffense,
  type CustomStyledFormModel,
  type FactEntry,
} from './custom-styled-form.model';
import { customStyledFormSchema } from './custom-styled-form.validations';

/**
 * Custom Styled Form - Demonstrates CSS Custom Properties Theming
 *
 * This example showcases how to use CSS custom properties to theme
 * the NgxSignalFormFieldComponent wrapper to match a custom design system.
 *
 * 🎨 Key Features Demonstrated:
 * - Custom CSS custom properties for complete visual control
 * - Material Design inspired outlined input layout
 * - Dutch legal system form (prison sentence data entry)
 * - Nested card structure with semi-transparent backgrounds
 * - Dynamic array handling (facts, offenses, articles)
 * - Custom icons and action buttons
 *
 * 📐 Design System:
 * - Based on Figma design system with CSS variables
 * - Uses Inter Variable font
 * - Semi-transparent card backgrounds
 * - Subtle borders and rounded corners
 * - Consistent spacing using design tokens
 *
 * @example
 * ```html
 * <ngx-custom-styled-form [errorDisplayMode]="on-touch" />
 * ```
 */
@Component({
  selector: 'ngx-custom-styled-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field, NgxSignalFormToolkit, NgxOutlinedFormField],
  templateUrl: './custom-styled-form.html',
  styleUrl: './custom-styled-form.scss',
})
export class CustomStyledFormComponent {
  /**
   * Error display mode input - controls when errors are shown
   */
  errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  /**
   * Form model signal with default values (1 fact to start)
   */
  protected readonly model = signal<CustomStyledFormModel>({
    facts: [createEmptyFact(1)],
  });

  /**
   * Create form instance with validation schema
   * Exposed as public for debugger access
   */
  readonly showcaseForm = form(this.model, customStyledFormSchema);

  /**
   * Available countries for dropdown
   */
  protected readonly countries = [
    { value: '', label: 'Selecteer een land' },
    { value: 'NL', label: 'Nederland' },
    { value: 'BE', label: 'België' },
    { value: 'DE', label: 'Duitsland' },
    { value: 'FR', label: 'Frankrijk' },
    { value: 'ES', label: 'Spanje' },
    { value: 'IT', label: 'Italië' },
  ];

  /**
   * Available legal articles for dropdown
   */
  protected readonly legalArticles = [
    { value: '', label: 'Selecteer wetsartikel' },
    { value: 'SR-310', label: 'SR-310 - Doodslag' },
    { value: 'SR-287', label: 'SR-287 - Moord' },
    { value: 'SR-289', label: 'SR-289 - Dood door schuld' },
    { value: 'SR-310a', label: 'SR-310a - Doodslag kind' },
  ];

  /**
   * Add a new fact to the form
   */
  protected addFact(): void {
    this.model.update((current) => {
      const nextNumber =
        Math.max(...current.facts.map((f) => f.factNumber)) + 1;
      return {
        facts: [...current.facts, createEmptyFact(nextNumber)],
      };
    });
  }

  /**
   * Remove a fact from the form
   */
  protected removeFact(index: number): void {
    this.model.update((current) => ({
      facts: current.facts.filter((_, i) => i !== index),
    }));
  }

  /**
   * Toggle fact details (expand/collapse)
   */
  protected toggleFactDetails(fact: FactEntry): void {
    // In a real app, you'd track expanded state
    console.log('Toggle fact', fact.factNumber);
  }

  /**
   * Add an offense to a fact
   */
  protected addOffense(factIndex: number): void {
    this.model.update((current) => {
      const facts = [...current.facts];
      facts[factIndex] = {
        ...facts[factIndex],
        offenses: [...facts[factIndex].offenses, createEmptyOffense()],
      };
      return { facts };
    });
  }

  /**
   * Remove an offense from a fact
   */
  protected removeOffense(factIndex: number, offenseIndex: number): void {
    this.model.update((current) => {
      const facts = [...current.facts];
      facts[factIndex] = {
        ...facts[factIndex],
        offenses: facts[factIndex].offenses.filter(
          (_, i) => i !== offenseIndex,
        ),
      };
      return { facts };
    });
  }

  /**
   * Add a legal article to an offense
   */
  protected addArticle(factIndex: number, offenseIndex: number): void {
    this.model.update((current) => {
      const facts = [...current.facts];
      const offenses = [...facts[factIndex].offenses];
      offenses[offenseIndex] = {
        ...offenses[offenseIndex],
        articles: [...offenses[offenseIndex].articles, createEmptyArticle()],
      };
      facts[factIndex] = { ...facts[factIndex], offenses };
      return { facts };
    });
  }

  /**
   * Remove a legal article from an offense
   */
  protected removeArticle(
    factIndex: number,
    offenseIndex: number,
    articleIndex: number,
  ): void {
    this.model.update((current) => {
      const facts = [...current.facts];
      const offenses = [...facts[factIndex].offenses];
      offenses[offenseIndex] = {
        ...offenses[offenseIndex],
        articles: offenses[offenseIndex].articles.filter(
          (_, i) => i !== articleIndex,
        ),
      };
      facts[factIndex] = { ...facts[factIndex], offenses };
      return { facts };
    });
  }

  /**
   * Form submission handler
   */
  protected displaySubmittedData(): void {
    console.log('Form submitted:', this.model());
  }
}
