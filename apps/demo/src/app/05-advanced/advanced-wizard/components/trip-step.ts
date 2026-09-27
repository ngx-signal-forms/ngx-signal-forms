import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';

import {
  focusFirstInvalid,
  type FormFieldAppearance,
  type FormFieldOrientation,
  NgxSignalFormToolkit,
  submitWithWarnings,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

import { createTripStepForm } from '../forms/trip-step.form';
import { WizardStore } from '../stores/wizard.store';
import { WizardStepInterface } from '../wizard-step.interface';

@Component({
  selector: 'ngx-trip-step',
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [formRoot]="tripForm" class="trip-step">
      <h2 #stepHeading class="mb-4 text-xl font-semibold" tabindex="-1">
        Trip Details
      </h2>

      @if (!hasDestinations()) {
        <div
          class="empty-state rounded-lg border-2 border-dashed p-8 text-center"
        >
          <p class="mb-4 text-gray-500 dark:text-gray-400">
            No destinations added yet.
          </p>
          <button
            type="button"
            class="btn-primary"
            (click)="store.addDestination()"
            #addDestinationButton
          >
            Add Your First Destination
          </button>
        </div>
      }

      @for (
        destination of store.destinationsDraft();
        track destination.id;
        let destIdx = $index
      ) {
        <fieldset class="destination-card mb-4 rounded-lg border p-4">
          <legend class="px-2 text-lg font-medium">
            Destination {{ destIdx + 1 }}
          </legend>

          <div class="mb-4 flex items-center justify-end">
            <button
              type="button"
              class="text-red-500 hover:text-red-700"
              (click)="store.removeDestination(destIdx)"
              [attr.aria-label]="'Remove destination ' + (destIdx + 1)"
            >
              Remove
            </button>
          </div>

          <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <!-- Country -->
            <ngx-form-field-wrapper
              [formField]="tripForm.destinations[destIdx].country"
              [appearance]="appearance()"
              [orientation]="orientation()"
            >
              <label [for]="'dest-country-' + destIdx">Country</label>
              <input
                [id]="'dest-country-' + destIdx"
                type="text"
                [formField]="tripForm.destinations[destIdx].country"
              />
            </ngx-form-field-wrapper>

            <!-- City -->
            <ngx-form-field-wrapper
              [formField]="tripForm.destinations[destIdx].city"
              [appearance]="appearance()"
              [orientation]="orientation()"
            >
              <label [for]="'dest-city-' + destIdx">City</label>
              <input
                [id]="'dest-city-' + destIdx"
                type="text"
                [formField]="tripForm.destinations[destIdx].city"
              />
            </ngx-form-field-wrapper>
          </div>

          <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <!-- Arrival Date -->
            <ngx-form-field-wrapper
              [formField]="tripForm.destinations[destIdx].arrivalDate"
              [appearance]="appearance()"
              [orientation]="orientation()"
            >
              <label [for]="'dest-arrival-' + destIdx">Arrival Date</label>
              <input
                [id]="'dest-arrival-' + destIdx"
                type="date"
                [formField]="tripForm.destinations[destIdx].arrivalDate"
              />
            </ngx-form-field-wrapper>

            <!-- Departure Date -->
            <ngx-form-field-wrapper
              [formField]="tripForm.destinations[destIdx].departureDate"
              [appearance]="appearance()"
              [orientation]="orientation()"
            >
              <label [for]="'dest-departure-' + destIdx">
                Departure Date
              </label>
              <input
                [id]="'dest-departure-' + destIdx"
                type="date"
                [formField]="tripForm.destinations[destIdx].departureDate"
              />
              <ngx-form-field-hint>
                Must be after arrival date
              </ngx-form-field-hint>
            </ngx-form-field-wrapper>
          </div>

          <!-- Accommodation -->
          <ngx-form-field-wrapper
            [formField]="tripForm.destinations[destIdx].accommodation"
            [appearance]="appearance()"
            [orientation]="orientation()"
            class="mb-4"
          >
            <label [for]="'dest-accommodation-' + destIdx">Accommodation</label>
            <input
              [id]="'dest-accommodation-' + destIdx"
              type="text"
              [formField]="tripForm.destinations[destIdx].accommodation"
            />
            <ngx-form-field-hint>
              Hotel name, Airbnb address, etc.
            </ngx-form-field-hint>
          </ngx-form-field-wrapper>

          <!-- Activities Section -->
          <div class="activities-section mt-4 border-l-2 border-gray-200 pl-4">
            <div class="mb-3 flex items-center justify-between">
              <h4 class="font-medium">Activities</h4>
              <button
                type="button"
                class="text-sm text-blue-500 hover:text-blue-700"
                (click)="store.addActivity(destIdx)"
              >
                + Add Activity
              </button>
            </div>

            @for (
              activity of destination.activities;
              track activity.id;
              let actIdx = $index
            ) {
              <div class="activity-card mb-3 rounded bg-gray-50 p-3">
                <div class="mb-2 flex items-start justify-between">
                  <span class="text-sm text-gray-600 dark:text-gray-300"
                    >Activity {{ actIdx + 1 }}</span
                  >
                  <button
                    type="button"
                    class="text-sm text-red-400 hover:text-red-600"
                    (click)="store.removeActivity(destIdx, actIdx)"
                    [attr.aria-label]="
                      'Remove activity ' +
                      (actIdx + 1) +
                      ' for destination ' +
                      (destIdx + 1)
                    "
                  >
                    Remove
                  </button>
                </div>

                <div class="mb-2 grid grid-cols-3 gap-2">
                  <!-- Activity Name -->
                  <ngx-form-field-wrapper
                    [formField]="
                      tripForm.destinations[destIdx].activities[actIdx].name
                    "
                    [appearance]="appearance()"
                    [orientation]="orientation()"
                  >
                    <label
                      [for]="'act-name-' + destIdx + '-' + actIdx"
                      class="text-xs"
                    >
                      Activity Name
                    </label>
                    <input
                      [id]="'act-name-' + destIdx + '-' + actIdx"
                      type="text"
                      [formField]="
                        tripForm.destinations[destIdx].activities[actIdx].name
                      "
                    />
                  </ngx-form-field-wrapper>

                  <!-- Activity Date -->
                  <ngx-form-field-wrapper
                    [formField]="
                      tripForm.destinations[destIdx].activities[actIdx].date
                    "
                    [appearance]="appearance()"
                    [orientation]="orientation()"
                  >
                    <label
                      [for]="'act-date-' + destIdx + '-' + actIdx"
                      class="text-xs"
                    >
                      Date
                    </label>
                    <input
                      [id]="'act-date-' + destIdx + '-' + actIdx"
                      type="date"
                      [formField]="
                        tripForm.destinations[destIdx].activities[actIdx].date
                      "
                    />
                  </ngx-form-field-wrapper>

                  <!-- Activity Duration -->
                  <ngx-form-field-wrapper
                    [formField]="
                      tripForm.destinations[destIdx].activities[actIdx].duration
                    "
                    [appearance]="appearance()"
                    [orientation]="orientation()"
                  >
                    <label
                      [for]="'act-duration-' + destIdx + '-' + actIdx"
                      class="text-xs"
                    >
                      Duration (hrs)
                    </label>
                    <input
                      [id]="'act-duration-' + destIdx + '-' + actIdx"
                      type="number"
                      [formField]="
                        tripForm.destinations[destIdx].activities[actIdx]
                          .duration
                      "
                    />
                  </ngx-form-field-wrapper>
                </div>

                <!-- Requirements Section -->
                <div
                  class="requirements-section mt-2 border-l border-gray-300 pl-3"
                >
                  <div class="mb-2 flex items-center justify-between">
                    <span class="text-xs text-gray-500 dark:text-gray-400"
                      >Requirements</span
                    >
                    <button
                      type="button"
                      class="text-xs text-blue-400 hover:text-blue-600"
                      (click)="store.addRequirement(destIdx, actIdx)"
                    >
                      + Add
                    </button>
                  </div>

                  @for (
                    req of activity.requirements;
                    track req.id;
                    let reqIdx = $index
                  ) {
                    <div class="requirement-item mb-1 flex gap-2">
                      <label
                        class="sr-only"
                        [for]="
                          'req-description-' +
                          destIdx +
                          '-' +
                          actIdx +
                          '-' +
                          reqIdx
                        "
                      >
                        Requirement description
                      </label>
                      <input
                        type="text"
                        class="form-input-xs flex-1"
                        placeholder="Description"
                        [id]="
                          'req-description-' +
                          destIdx +
                          '-' +
                          actIdx +
                          '-' +
                          reqIdx
                        "
                        [formField]="
                          tripForm.destinations[destIdx].activities[actIdx]
                            .requirements[reqIdx].description
                        "
                      />
                      <label
                        class="sr-only"
                        [for]="
                          'req-type-' + destIdx + '-' + actIdx + '-' + reqIdx
                        "
                      >
                        Requirement type
                      </label>
                      <select
                        class="form-input-xs"
                        [id]="
                          'req-type-' + destIdx + '-' + actIdx + '-' + reqIdx
                        "
                        [formField]="
                          tripForm.destinations[destIdx].activities[actIdx]
                            .requirements[reqIdx].type
                        "
                      >
                        <option value="visa">Visa</option>
                        <option value="vaccination">Vaccination</option>
                        <option value="insurance">Insurance</option>
                        <option value="document">Document</option>
                        <option value="other">Other</option>
                      </select>
                      <button
                        type="button"
                        class="text-xs text-red-400 hover:text-red-600"
                        (click)="
                          store.removeRequirement(destIdx, actIdx, reqIdx)
                        "
                        [attr.aria-label]="
                          'Remove requirement ' +
                          (reqIdx + 1) +
                          ' for activity ' +
                          (actIdx + 1)
                        "
                      >
                        ✕
                      </button>
                    </div>
                  }
                </div>
              </div>
            } @empty {
              <p class="text-sm text-gray-500 italic dark:text-gray-400">
                No activities added
              </p>
            }
          </div>
        </fieldset>
      }

      @if (hasDestinations()) {
        <button
          type="button"
          class="btn-secondary w-full"
          (click)="store.addDestination()"
        >
          + Add Another Destination
        </button>
      }
    </form>
  `,
  styles: `
    .trip-step {
      padding: 1rem;
    }

    .form-input-xs {
      padding: 0.25rem 0.375rem;
      border: 1px solid var(--color-border);
      border-radius: 0.25rem;
      background: var(--color-bg-elevated);
      color: var(--color-text);
      font-size: 0.75rem;
    }

    .form-input-xs:focus-visible {
      outline: 2px solid var(--color-border-focus);
      outline-offset: 1px;
    }

    .form-input-xs[aria-invalid='true'] {
      border-color: var(--color-error);
    }
  `,
})
export class TripStepComponent implements WizardStepInterface {
  readonly appearance = input<FormFieldAppearance>('outline');
  readonly orientation = input<FormFieldOrientation>('vertical');

  protected readonly store = inject(WizardStore);
  protected readonly stepHeading =
    viewChild<ElementRef<HTMLHeadingElement>>('stepHeading');
  protected readonly addDestinationButton = viewChild<
    ElementRef<HTMLButtonElement>
  >('addDestinationButton');

  // Create form using factory function
  readonly #tripStepForm = createTripStepForm(this.store);

  // Expose form and computed signals to template
  readonly tripForm = this.#tripStepForm.form;
  /** Surfaced for the wizard's live form-state debugger. */
  readonly formTree = this.tripForm;
  readonly #model = this.#tripStepForm.model;
  protected readonly hasDestinations = this.#tripStepForm.hasDestinations;
  readonly isValid = this.#tripStepForm.isValid;

  /**
   * Commit form data to store.
   * Transfers local linkedSignal data to store's committed state.
   */
  commitToStore(): void {
    this.store.setDestinations(this.#model().destinations);
  }

  async validateAndFocus(): Promise<boolean> {
    await submitWithWarnings(this.tripForm, () => Promise.resolve());

    if (this.tripForm().invalid() || !this.hasDestinations()) {
      const focused = focusFirstInvalid(this.tripForm);
      if (!focused && !this.hasDestinations()) {
        this.addDestinationButton()?.nativeElement.focus();
      }
      return false;
    }

    return true;
  }

  focusHeading(): void {
    this.stepHeading()?.nativeElement.focus();
  }
}
