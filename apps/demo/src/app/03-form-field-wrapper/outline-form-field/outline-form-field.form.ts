import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormField, form, submit } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit/core';
import { NgxOutlinedFormField } from '@ngx-signal-forms/toolkit/form-field';
import { CardComponent } from '../../ui';
import {
  createEmptyArticle,
  createEmptyFact,
  createEmptyOffense,
  type FactEntry,
  type OutlineFormFieldModel,
} from './outline-form-field.model';
import { outlineFormFieldSchema } from './outline-form-field.validations';

/**
 * Outline Form Field - Demonstrates Default Outlined Layout
 *
 * This example showcases the default outlined form field styling
 * that matches the Figma design system without custom CSS overrides.
 *
 * 🎨 Key Features Demonstrated:
 * - Default outlined input layout (Figma design)
 * - Dutch legal system form (prison sentence data entry)
 * - Nested card structure with semi-transparent backgrounds
 * - Dynamic array handling (facts, offenses, articles)
 * - Custom icons and action buttons
 * - No custom CSS overrides needed
 *
 * 📐 Design System:
 * - Based on Figma design system (default toolkit styling)
 * - Uses Inter Variable font
 * - Semi-transparent card backgrounds
 * - Subtle borders and rounded corners
 * - Consistent spacing using design tokens
 *
 * @example
 * ```html
 * <ngx-outline-form-field [errorDisplayMode]="on-touch" />
 * ```
 */
@Component({
  selector: 'ngx-outline-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxOutlinedFormField,
    CardComponent,
  ],
  templateUrl: './outline-form-field.html',
  styleUrl: './outline-form-field.scss',
})
export class OutlineFormFieldComponent {
  /**
   * Error display mode input - controls when errors are shown
   */
  errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  /**
   * Form model signal with default values (1 fact to start)
   */
  readonly #model = signal<OutlineFormFieldModel>({
    facts: [createEmptyFact(1)],
  });

  /** Expose model for template iteration (read-only) */
  protected readonly model = this.#model.asReadonly();

  /**
   * Create form instance with validation schema
   * Exposed as public for debugger access
   */
  readonly showcaseForm = form(this.#model, outlineFormFieldSchema);

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
    this.#model.update((current) => {
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
    this.#model.update((current) => ({
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
    this.#model.update((current) => {
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
    this.#model.update((current) => {
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
    this.#model.update((current) => {
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
    this.#model.update((current) => {
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
   * Form submission handler using submit() helper
   */
  protected saveCase(event: Event): void {
    event.preventDefault();
    submit(this.showcaseForm, async () => {
      console.log('Form submitted:', this.#model());
      return null;
    });
  }
}
