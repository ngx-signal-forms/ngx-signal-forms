import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  minLength,
  required,
  schema,
  submit,
} from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';
import { NgxOutlinedFormField } from '@ngx-signal-forms/toolkit/form-field';

interface Address {
  street: string;
  city: string;
  zipCode: string;
}

interface UserProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  shippingAddress: Address;
  billingAddress: Address;
}

const profileSchema = schema<UserProfile>((path) => {
  // Personal Info
  required(path.personalInfo.firstName, { message: 'First name is required' });
  required(path.personalInfo.lastName, { message: 'Last name is required' });
  email(path.personalInfo.email, { message: 'Valid email is required' });

  // Shipping Address
  required(path.shippingAddress.street, { message: 'Street is required' });
  required(path.shippingAddress.city, { message: 'City is required' });
  required(path.shippingAddress.zipCode, { message: 'Zip is required' });
  minLength(path.shippingAddress.zipCode, 5, { message: 'Min 5 chars' });

  // Billing Address
  required(path.billingAddress.street, { message: 'Street is required' });
  required(path.billingAddress.city, { message: 'City is required' });
  required(path.billingAddress.zipCode, { message: 'Zip is required' });
});

@Component({
  selector: 'ngx-nested-groups',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxOutlinedFormField],
  template: `
    <div class="p-6">
      <h2 class="mb-4 text-2xl font-bold">Nested Groups Demo</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Complex form with deeply nested data structures.
      </p>

      <form
        [ngxSignalForm]="profileForm"
        (submit)="saveProfile($event)"
        class="max-w-4xl space-y-8"
      >
        <!-- Section 1: Personal Info -->
        <section
          class="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <h3 class="mb-4 border-b pb-2 text-lg font-semibold">
            Personal Information
          </h3>
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ngx-signal-form-field
              [formField]="profileForm.personalInfo.firstName"
              outline
            >
              <label for="firstName">First Name</label>
              <input
                id="firstName"
                [formField]="profileForm.personalInfo.firstName"
                class="form-input"
              />
            </ngx-signal-form-field>

            <ngx-signal-form-field
              [formField]="profileForm.personalInfo.lastName"
              outline
            >
              <label for="lastName">Last Name</label>
              <input
                id="lastName"
                [formField]="profileForm.personalInfo.lastName"
                class="form-input"
              />
            </ngx-signal-form-field>

            <div class="md:col-span-2">
              <ngx-signal-form-field
                [formField]="profileForm.personalInfo.email"
                outline
              >
                <label for="email">Email</label>
                <input
                  id="email"
                  type="email"
                  [formField]="profileForm.personalInfo.email"
                  class="form-input"
                />
              </ngx-signal-form-field>
            </div>
          </div>
        </section>

        <!-- Section 2: Shipping Address -->
        <section
          class="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <h3 class="mb-4 border-b pb-2 text-lg font-semibold">
            Shipping Address
          </h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div class="md:col-span-12">
              <ngx-signal-form-field
                [formField]="profileForm.shippingAddress.street"
                outline
              >
                <label for="shipStreet">Street</label>
                <input
                  id="shipStreet"
                  [formField]="profileForm.shippingAddress.street"
                  class="form-input"
                />
              </ngx-signal-form-field>
            </div>

            <div class="md:col-span-8">
              <ngx-signal-form-field
                [formField]="profileForm.shippingAddress.city"
                outline
              >
                <label for="shipCity">City</label>
                <input
                  id="shipCity"
                  [formField]="profileForm.shippingAddress.city"
                  class="form-input"
                />
              </ngx-signal-form-field>
            </div>

            <div class="md:col-span-4">
              <ngx-signal-form-field
                [formField]="profileForm.shippingAddress.zipCode"
                outline
              >
                <label for="shipZip">Zip Code</label>
                <input
                  id="shipZip"
                  [formField]="profileForm.shippingAddress.zipCode"
                  class="form-input"
                />
              </ngx-signal-form-field>
            </div>
          </div>
        </section>

        <!-- Section 3: Billing Address -->
        <section
          class="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="mb-4 flex items-center justify-between border-b pb-2">
            <h3 class="text-lg font-semibold">Billing Address</h3>
            <button
              type="button"
              (click)="copyShippingToBilling()"
              class="text-sm text-blue-600 hover:text-blue-800"
            >
              Copy from Shipping
            </button>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div class="md:col-span-12">
              <ngx-signal-form-field
                [formField]="profileForm.billingAddress.street"
                outline
              >
                <label for="billStreet">Street</label>
                <input
                  id="billStreet"
                  [formField]="profileForm.billingAddress.street"
                  class="form-input"
                />
              </ngx-signal-form-field>
            </div>

            <div class="md:col-span-8">
              <ngx-signal-form-field
                [formField]="profileForm.billingAddress.city"
                outline
              >
                <label for="billCity">City</label>
                <input
                  id="billCity"
                  [formField]="profileForm.billingAddress.city"
                  class="form-input"
                />
              </ngx-signal-form-field>
            </div>

            <div class="md:col-span-4">
              <ngx-signal-form-field
                [formField]="profileForm.billingAddress.zipCode"
                outline
              >
                <label for="billZip">Zip Code</label>
                <input
                  id="billZip"
                  [formField]="profileForm.billingAddress.zipCode"
                  class="form-input"
                />
              </ngx-signal-form-field>
            </div>
          </div>
        </section>

        <!-- Actions -->
        <div class="flex gap-4">
          <button
            type="submit"
            class="btn-primary"
            [disabled]="profileForm().pending()"
          >
            @if (profileForm().pending()) {
              Saving...
            } @else {
              Save Profile
            }
          </button>

          <button type="button" (click)="resetForm()" class="btn-secondary">
            Reset
          </button>
        </div>
      </form>
    </div>
  `,
})
export class NestedGroupsComponent {
  readonly #initialData: UserProfile = {
    personalInfo: { firstName: '', lastName: '', email: '' },
    shippingAddress: { street: '', city: '', zipCode: '' },
    billingAddress: { street: '', city: '', zipCode: '' },
  };

  readonly #model = signal<UserProfile>(this.#initialData);

  readonly profileForm = form(this.#model, profileSchema);

  copyShippingToBilling(): void {
    const current = this.#model();
    this.#model.set({
      ...current,
      billingAddress: { ...current.shippingAddress },
    });
  }

  protected async saveProfile(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.profileForm, async (data) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Profile saved:', data());
      return null;
    });
  }

  protected resetForm(): void {
    this.profileForm().reset();
    this.#model.set(this.#initialData);
  }
}
