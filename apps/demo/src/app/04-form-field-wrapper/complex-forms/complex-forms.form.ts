import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import type {
  ErrorDisplayStrategy,
  FormFieldAppearance,
  FormFieldOrientation,
} from '@ngx-signal-forms/toolkit';
import {
  createOnInvalidHandler,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { SwitchControlComponent } from '../../shared/controls';
import type { ComplexFormModel } from './complex-forms.model';
import { complexFormSchema } from './complex-forms.validations';

function createInitialComplexFormModel(): ComplexFormModel {
  return {
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
  };
}

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
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    SwitchControlComponent,
  ],
  styles: `
    :host {
      display: block;
    }

    .complex-form-fieldset {
      --ngx-signal-form-fieldset-gap: 0;
      --ngx-signal-form-fieldset-padding: 0;
      --ngx-signal-form-fieldset-border-width: 0;
      --ngx-signal-form-fieldset-content-offset: 0.5rem;
    }

    .complex-array-fieldset {
      --ngx-signal-form-fieldset-gap: 0;
    }

    .preferences-stack {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .array-entry-grid + .array-entry-grid {
      margin-top: 1rem;
    }

    .add-array-button {
      display: flex;
      inline-size: 100%;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-block-size: 2.75rem;
      margin-top: 0.5rem;
      margin-bottom: 0.75rem;
      padding: 0.625rem 0.875rem;
      border: 1.5px dotted color-mix(in srgb, #6366f1 55%, #cbd5e1);
      border-radius: 0.75rem;
      background: color-mix(in srgb, #eef2ff 75%, white);
      color: #4338ca;
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      transition:
        border-color 150ms ease,
        background-color 150ms ease,
        color 150ms ease,
        transform 150ms ease,
        box-shadow 150ms ease;
    }

    .add-array-button:hover {
      border-color: #4f46e5;
      background: color-mix(in srgb, #e0e7ff 78%, white);
      color: #3730a3;
      box-shadow: 0 10px 24px -18px rgb(79 70 229 / 0.65);
      transform: translateY(-1px);
    }

    .add-array-button:focus-visible {
      outline: 2px solid #6366f1;
      outline-offset: 2px;
    }

    .add-array-button__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 1.25rem;
      block-size: 1.25rem;
      border-radius: 9999px;
      background: rgb(99 102 241 / 0.12);
      font-size: 0.9rem;
      line-height: 1;
    }

    :host-context(.dark) {
      .add-array-button {
        border-color: color-mix(in srgb, #818cf8 60%, #475569);
        background: color-mix(in srgb, #312e81 24%, #0f172a);
        color: #c7d2fe;
      }

      .add-array-button:hover {
        border-color: #a5b4fc;
        background: color-mix(in srgb, #3730a3 30%, #0f172a);
        color: #e0e7ff;
        box-shadow: 0 12px 28px -20px rgb(165 180 252 / 0.45);
      }

      .add-array-button__icon {
        background: rgb(165 180 252 / 0.18);
      }
    }
  `,
  templateUrl: './complex-forms.form.html',
})
export class ComplexFormsComponent {
  /** Error display mode input */
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  /** Form field appearance input */
  readonly appearance = input<FormFieldAppearance>('standard');

  readonly orientation = input<FormFieldOrientation>('vertical');

  protected readonly personalInfoGridClass = computed(() =>
    this.isStandardHorizontalLayout()
      ? 'grid grid-cols-1 gap-x-4 gap-y-4'
      : 'grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2',
  );

  protected readonly addressPairGridClass = computed(() =>
    this.isStandardHorizontalLayout()
      ? 'grid grid-cols-1 gap-x-4 gap-y-4'
      : 'grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2',
  );

  /** Form data model */
  readonly #model = signal(createInitialComplexFormModel());

  /** Create form with validation schema */
  readonly complexForm = form(this.#model, complexFormSchema, {
    submission: {
      action: async () => {
        // Simulate async operation
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 500);
        });
        console.log('Complex form submitted:', this.#model());
      },
      onInvalid: createOnInvalidHandler(),
    },
  });

  protected readonly isStandardHorizontalLayout = computed(
    () =>
      this.appearance() === 'standard' && this.orientation() === 'horizontal',
  );

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
    this.#model.set(createInitialComplexFormModel());
    this.complexForm().reset();
  }
}
