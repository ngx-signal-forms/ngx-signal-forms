import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormField, form, submit } from '@angular/forms/signals';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import type { ComplexFormModel } from './complex-forms.model';
import { complexFormSchema } from './complex-forms.validations';

/**
 * Complex Forms Component
 *
 * Demonstrates NgxFormField with:
 * - Nested object structures
 * - Dynamic arrays (add/remove items)
 * - Maximum code reduction with form field wrapper
 */
@Component({
  selector: 'ngx-complex-forms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  templateUrl: './complex-forms.form.html',
})
export class ComplexFormsComponent {
  /** Error display mode input */
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  /** Form data model */
  readonly #model = signal<ComplexFormModel>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      age: 0,
    },
    addressInfo: {
      street: '',
      city: '',
      zipCode: '',
      country: '',
    },
    skills: [{ name: '', level: 1 }],
    contacts: [{ type: 'email', value: '' }],
    preferences: {
      newsletter: false,
      notifications: false,
      contactMethod: '',
    },
  });

  /** Create form with validation schema */
  readonly complexForm = form(this.#model, complexFormSchema);

  /**
   * Add new skill to the array
   */
  protected addSkill(): void {
    this.#model.update((data) => ({
      ...data,
      skills: [...data.skills, { name: '', level: 1 }],
    }));
  }

  /**
   * Remove skill at index
   */
  protected removeSkill(index: number): void {
    this.#model.update((data) => ({
      ...data,
      skills: data.skills.filter((_, i) => i !== index),
    }));
  }

  /**
   * Add new contact to the array
   */
  protected addContact(): void {
    this.#model.update((data) => ({
      ...data,
      contacts: [...data.contacts, { type: 'email', value: '' }],
    }));
  }

  /**
   * Remove contact at index
   */
  protected removeContact(index: number): void {
    this.#model.update((data) => ({
      ...data,
      contacts: data.contacts.filter((_, i) => i !== index),
    }));
  }

  /**
   * Form submission handler using Angular Signal Forms submit() helper.
   *
   * CRITICAL: SigsubmitApplicatione native DOM submit event, NOT ngSubmit.
   * - Template binding: (submit)="handleSubmit($event)" with $event
   * - Handler must call event.preventDefault() to prevent page reload
   * - submit() signature: async function submit<T>(form, action): Promise<void>
   * - Automatically marks all fields as touched
   * - Only executes callback when form is VALID
   *
   * ACCESSIBILITY: Button never disabled (best practice).
   */
  protected async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.complexForm, async () => {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 500));

      return null; // No server errors
    });
  }

  /**
   * Reset form to initial state
   */
  protected resetForm(): void {
    this.#model.set({
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        age: 0,
      },
      addressInfo: {
        street: '',
        city: '',
        zipCode: '',
        country: '',
      },
      skills: [{ name: '', level: 1 }],
      contacts: [{ type: 'email', value: '' }],
      preferences: {
        newsletter: false,
        notifications: false,
        contactMethod: '',
      },
    });
  }
}
