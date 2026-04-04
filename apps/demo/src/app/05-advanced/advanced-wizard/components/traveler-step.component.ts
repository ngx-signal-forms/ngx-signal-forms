import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  inject,
  viewChild,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';

import {
  focusFirstInvalid,
  type FormFieldAppearance,
  NgxSignalFormToolkit,
  submitWithWarnings,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import type { Destination } from '../schemas/wizard.schemas';

import { createTravelerStepForm } from '../forms/traveler-step.form';
import { WizardStore } from '../stores/wizard.store';
import { WizardStepInterface } from '../wizard-step.interface';

type ReadonlyRequirement = Readonly<
  Destination['activities'][number]['requirements'][number]
>;
type ReadonlyActivity = Readonly<
  Omit<Destination['activities'][number], 'requirements'>
> & {
  readonly requirements: readonly ReadonlyRequirement[];
};
type ReadonlyDestination = Readonly<Omit<Destination, 'activities'>> & {
  readonly activities: readonly ReadonlyActivity[];
};

@Component({
  selector: 'ngx-traveler-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <div class="traveler-step">
      <h2 #stepHeading class="mb-4 text-xl font-semibold" tabindex="-1">
        Traveler Information
      </h2>

      <form [formRoot]="travelerForm" class="space-y-4">
        <!-- First Name -->
        <ngx-signal-form-field-wrapper
          [formField]="travelerForm.firstName"
          [appearance]="appearance()"
        >
          <label for="firstName">
            First Name <span class="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            [formField]="travelerForm.firstName"
          />
          <ngx-signal-form-field-hint position="left">
            Enter your legal first name as shown on passport
          </ngx-signal-form-field-hint>
        </ngx-signal-form-field-wrapper>

        <!-- Last Name -->
        <ngx-signal-form-field-wrapper
          [formField]="travelerForm.lastName"
          [appearance]="appearance()"
        >
          <label for="lastName">
            Last Name <span class="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            [formField]="travelerForm.lastName"
          />
        </ngx-signal-form-field-wrapper>

        <!-- Email -->
        <ngx-signal-form-field-wrapper
          [formField]="travelerForm.email"
          [appearance]="appearance()"
        >
          <label for="email"> Email <span class="text-red-500">*</span> </label>
          <input id="email" type="email" [formField]="travelerForm.email" />
          <ngx-signal-form-field-hint position="left">
            We'll send booking confirmation to this address
          </ngx-signal-form-field-hint>
        </ngx-signal-form-field-wrapper>

        <!-- Nationality -->
        <ngx-signal-form-field-wrapper
          [formField]="travelerForm.nationality"
          [appearance]="appearance()"
        >
          <label for="nationality">
            Nationality <span class="text-red-500">*</span>
          </label>
          <input
            id="nationality"
            type="text"
            [formField]="travelerForm.nationality"
          />
        </ngx-signal-form-field-wrapper>

        <div class="mt-4 border-t pt-4">
          <h3 class="mb-3 text-lg font-medium">Passport Information</h3>

          <div class="grid grid-cols-2 gap-4">
            <!-- Passport Number -->
            <ngx-signal-form-field-wrapper
              [formField]="travelerForm.passportNumber"
              [appearance]="appearance()"
            >
              <label for="passportNumber">
                Passport Number <span class="text-red-500">*</span>
              </label>
              <input
                id="passportNumber"
                type="text"
                [formField]="travelerForm.passportNumber"
              />
            </ngx-signal-form-field-wrapper>

            <!-- Passport Expiry with cross-field validation -->
            <ngx-signal-form-field-wrapper
              [formField]="travelerForm.passportExpiry"
              [appearance]="appearance()"
            >
              <label for="passportExpiry">
                Expiry Date <span class="text-red-500">*</span>
              </label>
              <input
                id="passportExpiry"
                type="date"
                [formField]="travelerForm.passportExpiry"
              />
              <ngx-signal-form-field-hint position="left">
                Must be valid 6 months after trip ends
              </ngx-signal-form-field-hint>
            </ngx-signal-form-field-wrapper>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: `
    .traveler-step {
      padding: 1rem;
    }
  `,
})
export class TravelerStepComponent implements WizardStepInterface {
  readonly appearance = input<FormFieldAppearance>('outline');

  readonly #store = inject(WizardStore);
  protected readonly stepHeading =
    viewChild<ElementRef<HTMLHeadingElement>>('stepHeading');

  // Compute latest departure date for passport cross-field validation
  readonly #lastDepartureDate = computed(() => {
    const destinations = this.#store.destinations();
    if (destinations.length === 0) return null;

    const departures = destinations
      .map((d: ReadonlyDestination) => d.departureDate)
      .filter(Boolean)
      .slice();

    // oxlint-disable-next-line unicorn/no-array-sort -- The workspace targets ES2022, so toSorted() is not available in the demo build.
    departures.sort();

    return departures.length > 0 ? departures[departures.length - 1] : null;
  });

  // Create form using factory function
  readonly #travelerStepForm = createTravelerStepForm(
    this.#store,
    this.#lastDepartureDate,
  );

  // Expose form and computed signals to template
  readonly travelerForm = this.#travelerStepForm.form;
  readonly #model = this.#travelerStepForm.model;
  readonly isValid = this.#travelerStepForm.isValid;

  /**
   * Commit form data to store.
   * Transfers local linkedSignal data to store's committed state.
   */
  commitToStore(): void {
    this.#store.setTraveler(this.#model());
  }

  async validateAndFocus(): Promise<boolean> {
    await submitWithWarnings(this.travelerForm, async () => undefined);

    if (this.travelerForm().invalid()) {
      focusFirstInvalid(this.travelerForm);
      return false;
    }

    return true;
  }

  focusHeading(): void {
    this.stepHeading()?.nativeElement.focus();
  }
}
