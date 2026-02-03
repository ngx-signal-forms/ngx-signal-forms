import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';

import {
  focusFirstInvalid,
  NgxSignalFormToolkit,
  submitWithWarnings,
} from '@ngx-signal-forms/toolkit';
import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

import { createTravelerStepForm } from '../forms/traveler-step.form';
import { WizardStore } from '../stores/wizard.store';

@Component({
  selector: 'ngx-traveler-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    NgxSignalFormErrorComponent,
  ],
  template: `
    <div class="traveler-step">
      <h2 #stepHeading class="mb-4 text-xl font-semibold" tabindex="-1">
        Traveler Information
      </h2>

      <form novalidate class="space-y-4">
        <!-- First Name -->
        <ngx-signal-form-field-wrapper [formField]="travelerForm.firstName">
          <label for="firstName">
            First Name <span class="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            [formField]="travelerForm.firstName"
            class="form-input"
          />
          <ngx-signal-form-field-hint position="left">
            Enter your legal first name as shown on passport
          </ngx-signal-form-field-hint>
        </ngx-signal-form-field-wrapper>

        <!-- Last Name -->
        <ngx-signal-form-field-wrapper [formField]="travelerForm.lastName">
          <label for="lastName">
            Last Name <span class="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            [formField]="travelerForm.lastName"
            class="form-input"
          />
        </ngx-signal-form-field-wrapper>

        <!-- Email -->
        <ngx-signal-form-field-wrapper [formField]="travelerForm.email">
          <label for="email"> Email <span class="text-red-500">*</span> </label>
          <input
            id="email"
            type="email"
            [formField]="travelerForm.email"
            class="form-input"
          />
          <ngx-signal-form-field-hint position="left">
            We'll send booking confirmation to this address
          </ngx-signal-form-field-hint>
        </ngx-signal-form-field-wrapper>

        <!-- Nationality -->
        <ngx-signal-form-field-wrapper [formField]="travelerForm.nationality">
          <label for="nationality">
            Nationality <span class="text-red-500">*</span>
          </label>
          <input
            id="nationality"
            type="text"
            [formField]="travelerForm.nationality"
            class="form-input"
          />
        </ngx-signal-form-field-wrapper>

        <div class="mt-4 border-t pt-4">
          <h3 class="mb-3 text-lg font-medium">Passport Information</h3>

          <div class="grid grid-cols-2 gap-4">
            <!-- Passport Number -->
            <ngx-signal-form-field-wrapper
              [formField]="travelerForm.passportNumber"
            >
              <label for="passportNumber">
                Passport Number <span class="text-red-500">*</span>
              </label>
              <input
                id="passportNumber"
                type="text"
                [formField]="travelerForm.passportNumber"
                class="form-input"
              />
            </ngx-signal-form-field-wrapper>

            <!-- Passport Expiry with cross-field validation -->
            <ngx-signal-form-field-wrapper
              [formField]="travelerForm.passportExpiry"
              [showErrors]="false"
            >
              <label for="passportExpiry">
                Expiry Date <span class="text-red-500">*</span>
              </label>
              <input
                id="passportExpiry"
                type="date"
                [formField]="travelerForm.passportExpiry"
                class="form-input"
                [attr.aria-invalid]="passportExpiryError() ? true : null"
              />
              <ngx-signal-form-error
                [formField]="travelerForm.passportExpiry"
                fieldName="passportExpiry"
              />
              <div
                class="passport-expiry-message"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
              >
                {{ passportExpiryMessage() ?? '' }}
              </div>
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

    .form-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 1rem;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .form-input[aria-invalid='true'] {
      border-color: #ef4444;
    }

    .passport-expiry-message {
      color: #ef4444;
      min-height: 1.25rem;
    }
  `,
})
export class TravelerStepComponent {
  readonly #store = inject(WizardStore);
  readonly #destroyRef = inject(DestroyRef);
  protected readonly stepHeading =
    viewChild<ElementRef<HTMLHeadingElement>>('stepHeading');

  // Compute latest departure date for passport cross-field validation
  readonly #lastDepartureDate = computed(() => {
    const destinations = this.#store.destinations();
    if (destinations.length === 0) return null;

    const departures = destinations
      .map((d) => d.departureDate)
      .filter(Boolean)
      .sort();

    return departures.length > 0 ? departures[departures.length - 1] : null;
  });

  // Create form using factory function
  readonly #travelerStepForm = createTravelerStepForm(
    this.#store,
    this.#lastDepartureDate,
  );

  // Expose form and computed signals to template
  readonly travelerForm = this.#travelerStepForm.form;
  readonly isValid = this.#travelerStepForm.isValid;
  protected readonly passportExpiryError =
    this.#travelerStepForm.passportExpiryError;
  protected readonly passportExpiryMessage = computed(() => {
    const message = this.passportExpiryError();
    const errors = this.travelerForm.passportExpiry().errors();

    if (!message || errors.length > 0) {
      return null;
    }

    return message;
  });

  constructor() {
    this.#destroyRef.onDestroy(() => {
      console.log('TravelerStepComponent destroyed');
    });
  }

  /**
   * Explicitly commit form data to store.
   * Called before navigation or final submission.
   * linkedSignal keeps form writable, but changes stay local until committed.
   */
  commitToStore(): void {
    const formData = this.travelerForm().value();
    this.#store.setTraveler(formData);
  }

  async validateAndFocus(): Promise<boolean> {
    await submitWithWarnings(this.travelerForm, async () => undefined);

    if (this.travelerForm().invalid() || this.passportExpiryError()) {
      focusFirstInvalid(this.travelerForm);
      return false;
    }

    return true;
  }

  focusHeading(): void {
    this.stepHeading()?.nativeElement.focus();
  }
}
