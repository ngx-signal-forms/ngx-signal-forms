import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';

import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

import { createTripStepForm } from '../forms/trip-step.form';
import { WizardStore } from '../stores/wizard.store';

@Component({
  selector: 'ngx-trip-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <div class="trip-step">
      <h2 class="mb-4 text-xl font-semibold">Trip Details</h2>

      @if (!hasDestinations()) {
        <div
          class="empty-state rounded-lg border-2 border-dashed p-8 text-center"
        >
          <p class="mb-4 text-gray-500">No destinations added yet.</p>
          <button
            type="button"
            class="btn btn-primary"
            (click)="store.addDestination()"
          >
            Add Your First Destination
          </button>
        </div>
      }

      @for (
        destination of store.destinations();
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
              aria-label="Remove destination"
            >
              Remove
            </button>
          </div>

          <div class="mb-4 grid grid-cols-2 gap-4">
            <!-- Country -->
            <ngx-signal-form-field-wrapper
              [formField]="tripForm.destinations[destIdx].country"
            >
              <label [for]="'dest-country-' + destIdx">
                Country <span class="text-red-500">*</span>
              </label>
              <input
                [id]="'dest-country-' + destIdx"
                type="text"
                class="form-input"
                [formField]="tripForm.destinations[destIdx].country"
              />
            </ngx-signal-form-field-wrapper>

            <!-- City -->
            <ngx-signal-form-field-wrapper
              [formField]="tripForm.destinations[destIdx].city"
            >
              <label [for]="'dest-city-' + destIdx">
                City <span class="text-red-500">*</span>
              </label>
              <input
                [id]="'dest-city-' + destIdx"
                type="text"
                class="form-input"
                [formField]="tripForm.destinations[destIdx].city"
              />
            </ngx-signal-form-field-wrapper>
          </div>

          <div class="mb-4 grid grid-cols-2 gap-4">
            <!-- Arrival Date -->
            <ngx-signal-form-field-wrapper
              [formField]="tripForm.destinations[destIdx].arrivalDate"
            >
              <label [for]="'dest-arrival-' + destIdx">
                Arrival Date <span class="text-red-500">*</span>
              </label>
              <input
                [id]="'dest-arrival-' + destIdx"
                type="date"
                class="form-input"
                [formField]="tripForm.destinations[destIdx].arrivalDate"
              />
            </ngx-signal-form-field-wrapper>

            <!-- Departure Date -->
            <ngx-signal-form-field-wrapper
              [formField]="tripForm.destinations[destIdx].departureDate"
            >
              <label [for]="'dest-departure-' + destIdx">
                Departure Date <span class="text-red-500">*</span>
              </label>
              <input
                [id]="'dest-departure-' + destIdx"
                type="date"
                class="form-input"
                [formField]="tripForm.destinations[destIdx].departureDate"
              />
              <ngx-signal-form-field-hint position="left">
                Must be after arrival date
              </ngx-signal-form-field-hint>
            </ngx-signal-form-field-wrapper>
          </div>

          <!-- Accommodation -->
          <ngx-signal-form-field-wrapper
            [formField]="tripForm.destinations[destIdx].accommodation"
            class="mb-4"
          >
            <label [for]="'dest-accommodation-' + destIdx">Accommodation</label>
            <input
              [id]="'dest-accommodation-' + destIdx"
              type="text"
              class="form-input"
              [formField]="tripForm.destinations[destIdx].accommodation"
            />
            <ngx-signal-form-field-hint position="left">
              Hotel name, Airbnb address, etc.
            </ngx-signal-form-field-hint>
          </ngx-signal-form-field-wrapper>

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
                  <span class="text-sm text-gray-600"
                    >Activity {{ actIdx + 1 }}</span
                  >
                  <button
                    type="button"
                    class="text-sm text-red-400 hover:text-red-600"
                    (click)="store.removeActivity(destIdx, actIdx)"
                    aria-label="Remove activity"
                  >
                    Remove
                  </button>
                </div>

                <div class="mb-2 grid grid-cols-3 gap-2">
                  <!-- Activity Name -->
                  <ngx-signal-form-field-wrapper
                    [formField]="
                      tripForm.destinations[destIdx].activities[actIdx].name
                    "
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
                      class="form-input-sm"
                      [formField]="
                        tripForm.destinations[destIdx].activities[actIdx].name
                      "
                    />
                  </ngx-signal-form-field-wrapper>

                  <!-- Activity Date -->
                  <ngx-signal-form-field-wrapper
                    [formField]="
                      tripForm.destinations[destIdx].activities[actIdx].date
                    "
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
                      class="form-input-sm"
                      [formField]="
                        tripForm.destinations[destIdx].activities[actIdx].date
                      "
                    />
                  </ngx-signal-form-field-wrapper>

                  <!-- Activity Duration -->
                  <ngx-signal-form-field-wrapper
                    [formField]="
                      tripForm.destinations[destIdx].activities[actIdx].duration
                    "
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
                      class="form-input-sm"
                      [formField]="
                        tripForm.destinations[destIdx].activities[actIdx]
                          .duration
                      "
                    />
                  </ngx-signal-form-field-wrapper>
                </div>

                <!-- Requirements Section -->
                <div
                  class="requirements-section mt-2 border-l border-gray-300 pl-3"
                >
                  <div class="mb-2 flex items-center justify-between">
                    <span class="text-xs text-gray-500">Requirements</span>
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
                      <input
                        type="text"
                        class="form-input-xs flex-1"
                        placeholder="Description"
                        [formField]="
                          tripForm.destinations[destIdx].activities[actIdx]
                            .requirements[reqIdx].description
                        "
                      />
                      <select
                        class="form-input-xs"
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
                        aria-label="Remove requirement"
                      >
                        ✕
                      </button>
                    </div>
                  }
                </div>
              </div>
            }

            @if (destination.activities.length === 0) {
              <p class="text-sm text-gray-400 italic">No activities added</p>
            }
          </div>
        </fieldset>
      }

      @if (hasDestinations()) {
        <button
          type="button"
          class="btn btn-secondary w-full"
          (click)="store.addDestination()"
        >
          + Add Another Destination
        </button>
      }
    </div>
  `,
  styles: `
    .trip-step {
      padding: 1rem;
    }

    .form-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 1rem;
    }

    .form-input-sm {
      width: 100%;
      padding: 0.375rem 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }

    .form-input-xs {
      padding: 0.25rem 0.375rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }

    .form-input:focus,
    .form-input-sm:focus,
    .form-input-xs:focus {
      outline: none;
      border-color: var(--color-primary, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .form-input[aria-invalid='true'],
    .form-input-sm[aria-invalid='true'],
    .form-input-xs[aria-invalid='true'] {
      border-color: #ef4444;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-primary {
      background-color: var(--color-primary, #3b82f6);
      color: white;
      border: none;
    }

    .btn-secondary {
      background-color: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background-color: #e5e7eb;
    }
  `,
})
export class TripStepComponent {
  protected readonly store = inject(WizardStore);
  readonly #destroyRef = inject(DestroyRef);

  // Create form using factory function
  readonly #tripStepForm = createTripStepForm(this.store);

  // Expose form and computed signals to template
  readonly tripForm = this.#tripStepForm.form;
  protected readonly hasDestinations = this.#tripStepForm.hasDestinations;
  readonly isValid = this.#tripStepForm.isValid;

  constructor() {
    this.#destroyRef.onDestroy(() => {
      console.log('TripStepComponent destroyed');
    });
  }

  /**
   * Explicitly commit form data to store.
   * Called before navigation or final submission.
   * linkedSignal keeps form writable, but changes stay local until committed.
   */
  commitToStore(): void {
    const destinations = this.tripForm().value().destinations;
    this.store.setDestinations(destinations);
  }
}
