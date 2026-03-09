import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import type {
  ErrorDisplayStrategy,
  FormFieldAppearance,
} from '@ngx-signal-forms/toolkit';
import {
  createOnInvalidHandler,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
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

  /** Form field appearance input */
  readonly appearance = input<FormFieldAppearance>('standard');

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
  readonly complexForm = form(this.#model, complexFormSchema, {
    submission: {
      action: async () => {
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log('Complex form submitted:', this.#model());
      },
      onInvalid: createOnInvalidHandler(),
    },
  });

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
