import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormField, form, submit } from '@angular/forms/signals';
import type { ErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxOutlinedFormField } from '@ngx-signal-forms/toolkit/form-field';
import type { ComplexFormModel } from './complex-forms.model';
import { complexFormSchema } from './complex-forms.validations';

/**
 * Complex Forms Component
 *
 * Demonstrates NgxOutlinedFormField with:
 * - Nested object structures
 * - Dynamic arrays (add/remove items)
 * - Maximum code reduction with form field wrapper
 */
@Component({
  selector: 'ngx-complex-forms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxOutlinedFormField],
  template: `
    <form [ngxSignalForm]="complexForm" (submit)="handleSubmit($event)">
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
            [formField]="complexForm.personalInfo.firstName"
            fieldName="firstName"
          >
            <label for="firstName">First Name *</label>
            <input
              id="firstName"
              type="text"
              [formField]="complexForm.personalInfo.firstName"
            />
          </ngx-signal-form-field>

          <ngx-signal-form-field
            [formField]="complexForm.personalInfo.lastName"
            fieldName="lastName"
          >
            <label for="lastName">Last Name *</label>
            <input
              id="lastName"
              type="text"
              [formField]="complexForm.personalInfo.lastName"
            />
          </ngx-signal-form-field>

          <ngx-signal-form-field
            [formField]="complexForm.personalInfo.email"
            fieldName="email"
          >
            <svg
              prefix
              aria-hidden="true"
              class="size-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
            <label for="email">Email *</label>
            <input
              id="email"
              type="email"
              [formField]="complexForm.personalInfo.email"
            />
          </ngx-signal-form-field>

          <ngx-signal-form-field
            [formField]="complexForm.personalInfo.age"
            fieldName="age"
          >
            <label for="age">Age *</label>
            <input
              id="age"
              type="number"
              [formField]="complexForm.personalInfo.age"
              aria-valuemin="18"
              aria-valuemax="120"
            />
            <span suffix aria-hidden="true" class="text-sm text-gray-400"
              >years</span
            >
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
            [formField]="complexForm.addressInfo.street"
            fieldName="street"
          >
            <svg
              prefix
              aria-hidden="true"
              class="size-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 10.5c0 7.5-9 12-9 12s-9-4.5-9-12a9 9 0 1 1 18 0Z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 12.75a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
              />
            </svg>
            <label for="street">Street Address *</label>
            <input
              id="street"
              type="text"
              [formField]="complexForm.addressInfo.street"
            />
          </ngx-signal-form-field>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <ngx-signal-form-field
              [formField]="complexForm.addressInfo.city"
              fieldName="city"
            >
              <label for="city">City *</label>
              <input
                id="city"
                type="text"
                [formField]="complexForm.addressInfo.city"
              />
            </ngx-signal-form-field>

            <ngx-signal-form-field
              [formField]="complexForm.addressInfo.zipCode"
              fieldName="zipCode"
            >
              <label for="zipCode">Zip Code *</label>
              <input
                id="zipCode"
                type="text"
                [formField]="complexForm.addressInfo.zipCode"
                placeholder="12345"
              />
            </ngx-signal-form-field>

            <ngx-signal-form-field
              [formField]="complexForm.addressInfo.country"
              fieldName="country"
            >
              <label for="country">Country *</label>
              <select
                id="country"
                [formField]="complexForm.addressInfo.country"
              >
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
            class="mb-4 grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr,150px]"
          >
            <ngx-signal-form-field
              [formField]="complexForm.skills[i].name"
              [fieldName]="'skill-' + i + '-name'"
            >
              <label [for]="'skill-' + i + '-name'">Skill Name *</label>
              <input
                [id]="'skill-' + i + '-name'"
                type="text"
                [formField]="complexForm.skills[i].name"
                placeholder="e.g., Angular"
              />
              <button
                suffix
                type="button"
                (click)="removeSkill(i)"
                class="text-gray-400 transition-colors hover:text-red-600 dark:hover:text-red-400"
                [attr.aria-label]="'Remove skill ' + (i + 1)"
              >
                ✕
              </button>
            </ngx-signal-form-field>

            <ngx-signal-form-field
              [formField]="complexForm.skills[i].level"
              [fieldName]="'skill-' + i + '-level'"
            >
              <label [for]="'skill-' + i + '-level'">Level (1-10) *</label>
              <input
                [id]="'skill-' + i + '-level'"
                type="number"
                [formField]="complexForm.skills[i].level"
                aria-valuemin="1"
                aria-valuemax="10"
              />
            </ngx-signal-form-field>
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
            class="mb-4 grid grid-cols-1 items-start gap-4 md:grid-cols-[150px,1fr]"
          >
            <ngx-signal-form-field
              [formField]="complexForm.contacts[i].type"
              [fieldName]="'contact-' + i + '-type'"
            >
              <label [for]="'contact-' + i + '-type'">Type *</label>
              <select
                [id]="'contact-' + i + '-type'"
                [formField]="complexForm.contacts[i].type"
              >
                <option value="">Select...</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </ngx-signal-form-field>

            <ngx-signal-form-field
              [formField]="complexForm.contacts[i].value"
              [fieldName]="'contact-' + i + '-value'"
            >
              @if (complexForm.contacts[i].type().value() === 'email') {
                <svg
                  prefix
                  aria-hidden="true"
                  class="size-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
              } @else if (complexForm.contacts[i].type().value() === 'phone') {
                <svg
                  prefix
                  aria-hidden="true"
                  class="size-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15H19.5A2.25 2.25 0 0 0 21.75 19.5v-1.372a1.125 1.125 0 0 0-.852-1.09l-4.423-1.106a1.125 1.125 0 0 0-1.257.517l-.916 1.532a12.035 12.035 0 0 1-5.292-5.292l1.532-.916a1.125 1.125 0 0 0 .517-1.257L6.962 3.852A1.125 1.125 0 0 0 5.872 3H4.5A2.25 2.25 0 0 0 2.25 5.25v1.5Z"
                  />
                </svg>
              }
              <label [for]="'contact-' + i + '-value'">Value *</label>
              <input
                [id]="'contact-' + i + '-value'"
                type="text"
                [formField]="complexForm.contacts[i].value"
                [placeholder]="
                  complexForm.contacts[i].type().value() === 'email'
                    ? 'user@example.com'
                    : '+1 (555) 123-4567'
                "
              />
              <button
                suffix
                type="button"
                (click)="removeContact(i)"
                class="text-gray-400 transition-colors hover:text-red-600 dark:hover:text-red-400"
                [attr.aria-label]="'Remove contact ' + (i + 1)"
              >
                ✕
              </button>
            </ngx-signal-form-field>
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
              [formField]="complexForm.preferences.newsletter"
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
              [formField]="complexForm.preferences.notifications"
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
        <button
          type="submit"
          class="btn-primary"
          aria-live="polite"
          [disabled]="complexForm().pending()"
        >
          @if (complexForm().pending()) {
            Submitting...
          } @else {
            Submit Application
          }
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
      },
    });
  }
}
