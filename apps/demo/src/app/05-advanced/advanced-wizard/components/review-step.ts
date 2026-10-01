import { Component, ElementRef, inject, viewChild } from '@angular/core';

import {
  createReviewStepForm,
  ReviewStepForm,
} from '../forms/review-step.form';
import { WizardStore } from '../stores/wizard.store';
import { WizardStepInterface } from '../wizard-step.interface';

@Component({
  selector: 'ngx-review-step',

  template: `
    <div class="review-step">
      <h2 #stepHeading class="mb-4 text-xl font-semibold" tabindex="-1">
        Review Your Booking
      </h2>

      <!-- Traveler Summary -->
      <section class="review-section mb-6">
        <h3 class="mb-3 flex items-center gap-2 text-lg font-medium">
          Traveler Information
        </h3>
        <div class="review-card">
          <dl class="grid grid-cols-2 gap-3">
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">
                Full Name
              </dt>
              <dd class="font-medium">
                {{ reviewForm.travelerDisplay().fullName }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">Email</dt>
              <dd class="font-medium">
                {{ reviewForm.travelerDisplay().email }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">Age</dt>
              <dd class="font-medium">
                @if (reviewForm.travelerDisplay().age !== null) {
                  {{ reviewForm.travelerDisplay().age }} years old
                } @else {
                  Not provided
                }
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">
                Passport Status
              </dt>
              <dd class="font-medium">
                @if (reviewForm.travelerDisplay().hasPassport) {
                  @if (reviewForm.travelerDisplay().passportValid) {
                    <span class="text-green-600">✓ Valid</span>
                  } @else {
                    <span class="text-red-600">✗ Not valid for this trip</span>
                  }
                } @else {
                  <span class="text-gray-500 dark:text-gray-400"
                    >Not provided</span
                  >
                }
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- Trip Summary -->
      <section class="review-section mb-6">
        <h3 class="mb-3 flex items-center gap-2 text-lg font-medium">
          Trip Overview
        </h3>
        <div class="review-card">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400"
                >Travel Dates</span
              >
              <p class="font-medium">{{ reviewForm.dateRange() }}</p>
            </div>
            <div class="text-right">
              <span class="text-sm text-gray-500 dark:text-gray-400"
                >Statistics</span
              >
              <p class="font-medium">
                {{ reviewForm.destinationsDisplay().length }} destinations,
                {{ reviewForm.totalActivities() }} activities,
                {{ reviewForm.totalRequirements() }} requirements
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Destinations Detail -->
      <section class="review-section">
        <h3 class="mb-3 flex items-center gap-2 text-lg font-medium">
          Destinations
        </h3>

        @for (dest of reviewForm.destinationsDisplay(); track $index) {
          <div class="destination-review-card mb-4">
            <div class="mb-3 flex items-start justify-between">
              <div>
                <h4 class="text-lg font-medium">{{ dest.name }}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ dest.dates }}
                </p>
              </div>
              <span class="badge">{{ dest.activityCount }} activities</span>
            </div>

            @if (dest.accommodation) {
              <p class="mb-3 text-sm">
                <span class="text-gray-500 dark:text-gray-400"
                  >Accommodation:</span
                >
                {{ dest.accommodation }}
              </p>
            }

            @if (dest.activities.length > 0) {
              <div class="activities-list">
                <h5
                  class="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300"
                >
                  Activities:
                </h5>
                <ul class="space-y-2">
                  @for (activity of dest.activities; track $index) {
                    <li class="activity-item flex items-center justify-between">
                      <div>
                        <span class="font-medium">{{ activity.name }}</span>
                        <span
                          class="ml-2 text-sm text-gray-500 dark:text-gray-400"
                          >{{ activity.date }}</span
                        >
                      </div>
                      <div class="text-right">
                        <span class="text-sm">{{ activity.cost }}</span>
                        @if (activity.requirementCount > 0) {
                          <span
                            class="ml-2 text-xs text-gray-500 dark:text-gray-400"
                          >
                            ({{ activity.requirementCount }} requirements)
                          </span>
                        }
                      </div>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
        } @empty {
          <div
            class="empty-state rounded border border-dashed p-4 text-center text-gray-500 dark:text-gray-400"
          >
            No destinations added
          </div>
        }
      </section>

      <!-- Confirmation Notice -->
      <div
        class="confirmation-notice mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4"
      >
        <p class="text-sm text-blue-800">
          Please review your booking details above. By clicking "Confirm
          Booking", you agree to our terms and conditions.
        </p>
      </div>
    </div>
  `,
  styles: `
    .review-step {
      padding: 1rem;
    }

    .review-card {
      background-color: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .destination-review-card {
      background-color: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .badge {
      background-color: #e0e7ff;
      color: #3730a3;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    :host-context(.dark) .badge {
      background-color: rgb(49 46 129 / 0.5);
      color: #c7d2fe;
    }

    .activity-item {
      padding: 0.5rem;
      background-color: var(--color-bg);
      border-radius: 0.25rem;
    }

    dl dt {
      margin-bottom: 0.125rem;
    }
  `,
})
export class ReviewStepComponent implements WizardStepInterface {
  readonly #store = inject(WizardStore);
  protected readonly stepHeading =
    viewChild<ElementRef<HTMLHeadingElement>>('stepHeading');

  protected readonly reviewForm: ReviewStepForm = createReviewStepForm(
    this.#store.traveler,
    this.#store.destinations,
  );

  // No effects needed - review step validation is computed from store data

  validateAndFocus(): Promise<boolean> {
    return Promise.resolve(true);
  }

  commitToStore(): void {
    // Read-only step, nothing to commit
  }

  focusHeading(): void {
    this.stepHeading()?.nativeElement.focus();
  }
}
