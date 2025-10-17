import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { Field, form, submit } from '@angular/forms/signals';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
import type { ComplexFormModel } from './complex-forms.model';
import { complexFormSchema } from './complex-forms.validations';

/**
 * Complex Forms Component
 *
 * Demonstrates NgxSignalFormFieldComponent with:
 * - Nested object structures
 * - Dynamic arrays (add/remove items)
 * - Maximum code reduction with form field wrapper
 */
@Component({
  selector: 'ngx-complex-forms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field, NgxSignalFormToolkit, NgxSignalFormFieldComponent],
  template: `
    <form
      [ngxSignalFormProvider]="complexForm"
      [errorStrategy]="errorDisplayMode()"
      (ngSubmit)="(saveForm)"
      class="form-container"
    >
      <!-- Personal Information Section -->
      <fieldset
        class="mb-8 rounded-lg border border-gray-200 p-6 dark:border-gray-700"
      >
        <legend
          class="px-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          👤 Personal Information
        </legend>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ngx-signal-form-field
            [field]="complexForm.personalInfo.firstName"
            fieldName="firstName"
          >
            <label for="firstName">First Name *</label>
            <input
              id="firstName"
              type="text"
              [field]="complexForm.personalInfo.firstName"
            />
          </ngx-signal-form-field>

          <ngx-signal-form-field
            [field]="complexForm.personalInfo.lastName"
            fieldName="lastName"
          >
            <label for="lastName">Last Name *</label>
            <input
              id="lastName"
              type="text"
              [field]="complexForm.personalInfo.lastName"
            />
          </ngx-signal-form-field>

          <ngx-signal-form-field
            [field]="complexForm.personalInfo.email"
            fieldName="email"
          >
            <label for="email">Email *</label>
            <input
              id="email"
              type="email"
              [field]="complexForm.personalInfo.email"
            />
          </ngx-signal-form-field>

          <ngx-signal-form-field
            [field]="complexForm.personalInfo.age"
            fieldName="age"
          >
            <label for="age">Age *</label>
            <input
              id="age"
              type="number"
              [field]="complexForm.personalInfo.age"
              min="18"
              max="120"
            />
          </ngx-signal-form-field>
        </div>
      </fieldset>

      <!-- Address Information Section -->
      <fieldset
        class="mb-8 rounded-lg border border-gray-200 p-6 dark:border-gray-700"
      >
        <legend
          class="px-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          🏠 Address Information
        </legend>

        <div class="grid grid-cols-1 gap-6">
          <ngx-signal-form-field
            [field]="complexForm.addressInfo.street"
            fieldName="street"
          >
            <label for="street">Street Address *</label>
            <input
              id="street"
              type="text"
              [field]="complexForm.addressInfo.street"
            />
          </ngx-signal-form-field>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <ngx-signal-form-field
              [field]="complexForm.addressInfo.city"
              fieldName="city"
            >
              <label for="city">City *</label>
              <input
                id="city"
                type="text"
                [field]="complexForm.addressInfo.city"
              />
            </ngx-signal-form-field>

            <ngx-signal-form-field
              [field]="complexForm.addressInfo.zipCode"
              fieldName="zipCode"
            >
              <label for="zipCode">Zip Code *</label>
              <input
                id="zipCode"
                type="text"
                [field]="complexForm.addressInfo.zipCode"
                placeholder="12345"
              />
            </ngx-signal-form-field>

            <ngx-signal-form-field
              [field]="complexForm.addressInfo.country"
              fieldName="country"
            >
              <label for="country">Country *</label>
              <select id="country" [field]="complexForm.addressInfo.country">
                <option value="">Select...</option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
              </select>
            </ngx-signal-form-field>
          </div>
        </div>
      </fieldset>

      <!-- Skills Section (Dynamic Array) -->
      <fieldset
        class="mb-8 rounded-lg border border-gray-200 p-6 dark:border-gray-700"
      >
        <legend
          class="px-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          🎯 Skills
        </legend>

        @for (skill of complexForm.skills; track $index; let i = $index) {
          <div
            class="mb-4 grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr,150px,auto]"
          >
            <ngx-signal-form-field
              [field]="complexForm.skills[i].name"
              [fieldName]="'skill-' + i + '-name'"
            >
              <label [for]="'skill-' + i + '-name'">Skill Name *</label>
              <input
                [id]="'skill-' + i + '-name'"
                type="text"
                [field]="complexForm.skills[i].name"
                placeholder="e.g., Angular"
              />
            </ngx-signal-form-field>

            <ngx-signal-form-field
              [field]="complexForm.skills[i].level"
              [fieldName]="'skill-' + i + '-level'"
            >
              <label [for]="'skill-' + i + '-level'">Level (1-10) *</label>
              <input
                [id]="'skill-' + i + '-level'"
                type="number"
                [field]="complexForm.skills[i].level"
                min="1"
                max="10"
              />
            </ngx-signal-form-field>

            <div class="flex items-end">
              <button
                type="button"
                (click)="removeSkill(i)"
                class="btn-secondary h-[42px]"
                [attr.aria-label]="'Remove skill ' + (i + 1)"
              >
                Remove
              </button>
            </div>
          </div>
        }

        <button type="button" (click)="addSkill()" class="btn-secondary mt-2">
          + Add Skill
        </button>
      </fieldset>

      <!-- Contacts Section (Dynamic Array with Types) -->
      <fieldset
        class="mb-8 rounded-lg border border-gray-200 p-6 dark:border-gray-700"
      >
        <legend
          class="px-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          📞 Contact Methods
        </legend>

        @for (contact of complexForm.contacts; track $index; let i = $index) {
          <div
            class="mb-4 grid grid-cols-1 items-start gap-4 md:grid-cols-[150px,1fr,auto]"
          >
            <ngx-signal-form-field
              [field]="complexForm.contacts[i].type"
              [fieldName]="'contact-' + i + '-type'"
            >
              <label [for]="'contact-' + i + '-type'">Type *</label>
              <select
                [id]="'contact-' + i + '-type'"
                [field]="complexForm.contacts[i].type"
              >
                <option value="">Select...</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </ngx-signal-form-field>

            <ngx-signal-form-field
              [field]="complexForm.contacts[i].value"
              [fieldName]="'contact-' + i + '-value'"
            >
              <label [for]="'contact-' + i + '-value'">Value *</label>
              <input
                [id]="'contact-' + i + '-value'"
                type="text"
                [field]="complexForm.contacts[i].value"
                [placeholder]="
                  complexForm.contacts[i].type().value() === 'email'
                    ? 'user@example.com'
                    : '+1 (555) 123-4567'
                "
              />
            </ngx-signal-form-field>

            <div class="flex items-end">
              <button
                type="button"
                (click)="removeContact(i)"
                class="btn-secondary h-[42px]"
                [attr.aria-label]="'Remove contact ' + (i + 1)"
              >
                Remove
              </button>
            </div>
          </div>
        }

        <button type="button" (click)="addContact()" class="btn-secondary mt-2">
          + Add Contact
        </button>
      </fieldset>

      <!-- Preferences Section -->
      <fieldset
        class="mb-8 rounded-lg border border-gray-200 p-6 dark:border-gray-700"
      >
        <legend
          class="px-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          ⚙️ Preferences
        </legend>

        <div class="space-y-4">
          <label class="flex items-center space-x-3">
            <input
              id="newsletter"
              type="checkbox"
              [field]="complexForm.preferences.newsletter"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Subscribe to newsletter
            </span>
          </label>

          <label class="flex items-center space-x-3">
            <input
              id="notifications"
              type="checkbox"
              [field]="complexForm.preferences.notifications"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Enable email notifications
            </span>
          </label>
        </div>
      </fieldset>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="submit" class="btn-primary" aria-live="polite">
          Submit Application
        </button>
        <button type="button" (click)="resetForm()" class="btn-secondary">
          Reset
        </button>
      </div>
    </form>
  `,
})
export class ComplexFormsComponent {
  /** Error display mode input */
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  /** Form data model */
  readonly #formData = signal<ComplexFormModel>({
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
    },
  });

  /** Create form with validation schema */
  readonly complexForm = form(this.#formData, complexFormSchema);

  /**
   * Add new skill to the array
   */
  protected addSkill(): void {
    this.#formData.update((data) => ({
      ...data,
      skills: [...data.skills, { name: '', level: 1 }],
    }));
  }

  /**
   * Remove skill at index
   */
  protected removeSkill(index: number): void {
    this.#formData.update((data) => ({
      ...data,
      skills: data.skills.filter((_, i) => i !== index),
    }));
  }

  /**
   * Add new contact to the array
   */
  protected addContact(): void {
    this.#formData.update((data) => ({
      ...data,
      contacts: [...data.contacts, { type: 'email', value: '' }],
    }));
  }

  /**
   * Remove contact at index
   */
  protected removeContact(index: number): void {
    this.#formData.update((data) => ({
      ...data,
      contacts: data.contacts.filter((_, i) => i !== index),
    }));
  }

  /**
   * Form submission handler using Angular Signal Forms submit() helper.
   * ACCESSIBILITY: Button never disabled (best practice).
   */
  protected readonly saveForm = submit(this.complexForm, async (formData) => {
    console.log('✅ Form submitted:', formData().value());

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 500));

    return null;
  });

  /**
   * Reset form to initial state
   */
  protected resetForm(): void {
    this.#formData.set({
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
      },
    });
  }
}
