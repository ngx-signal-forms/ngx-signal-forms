import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import {
  createReviewStepForm,
  ReviewStepForm,
} from '../forms/review-step.form';
import { WizardStore } from '../stores/wizard.store';

@Component({
  selector: 'ngx-review-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="review-step">
      <h2 class="mb-4 text-xl font-semibold">Review Your Booking</h2>

      <!-- Traveler Summary -->
      <section class="review-section mb-6">
        <h3 class="mb-3 flex items-center gap-2 text-lg font-medium">
          <span class="section-icon">👤</span>
          Traveler Information
        </h3>
        <div class="review-card">
          <dl class="grid grid-cols-2 gap-3">
            <div>
              <dt class="text-sm text-gray-500">Full Name</dt>
              <dd class="font-medium">
                {{ reviewForm.travelerDisplay().fullName }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Email</dt>
              <dd class="font-medium">
                {{ reviewForm.travelerDisplay().email }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Age</dt>
              <dd class="font-medium">
                @if (reviewForm.travelerDisplay().age !== null) {
                  {{ reviewForm.travelerDisplay().age }} years old
                } @else {
                  Not provided
                }
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Passport Status</dt>
              <dd class="font-medium">
                @if (reviewForm.travelerDisplay().hasPassport) {
                  @if (reviewForm.travelerDisplay().passportValid) {
                    <span class="text-green-600">✓ Valid</span>
                  } @else {
                    <span class="text-red-600">✗ Expired</span>
                  }
                } @else {
                  <span class="text-gray-400">Not provided</span>
                }
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- Trip Summary -->
      <section class="review-section mb-6">
        <h3 class="mb-3 flex items-center gap-2 text-lg font-medium">
          <span class="section-icon">✈️</span>
          Trip Overview
        </h3>
        <div class="review-card">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <span class="text-sm text-gray-500">Travel Dates</span>
              <p class="font-medium">{{ reviewForm.dateRange() }}</p>
            </div>
            <div class="text-right">
              <span class="text-sm text-gray-500">Statistics</span>
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
          <span class="section-icon">📍</span>
          Destinations
        </h3>

        @if (reviewForm.destinationsDisplay().length === 0) {
          <div
            class="empty-state rounded border border-dashed p-4 text-center text-gray-400"
          >
            No destinations added
          </div>
        }

        @for (dest of reviewForm.destinationsDisplay(); track $index) {
          <div class="destination-review-card mb-4">
            <div class="mb-3 flex items-start justify-between">
              <div>
                <h4 class="text-lg font-medium">{{ dest.name }}</h4>
                <p class="text-sm text-gray-500">{{ dest.dates }}</p>
              </div>
              <span class="badge">{{ dest.activityCount }} activities</span>
            </div>

            @if (dest.accommodation) {
              <p class="mb-3 text-sm">
                <span class="text-gray-500">Accommodation:</span>
                {{ dest.accommodation }}
              </p>
            }

            @if (dest.activities.length > 0) {
              <div class="activities-list">
                <h5 class="mb-2 text-sm font-medium text-gray-600">
                  Activities:
                </h5>
                <ul class="space-y-2">
                  @for (activity of dest.activities; track $index) {
                    <li class="activity-item flex items-center justify-between">
                      <div>
                        <span class="font-medium">{{ activity.name }}</span>
                        <span class="ml-2 text-sm text-gray-500">{{
                          activity.date
                        }}</span>
                      </div>
                      <div class="text-right">
                        <span class="text-sm">{{ activity.cost }}</span>
                        @if (activity.requirementCount > 0) {
                          <span class="ml-2 text-xs text-gray-400">
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

    .section-icon {
      font-size: 1.25rem;
    }

    .review-card {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .destination-review-card {
      background-color: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .badge {
      background-color: #dbeafe;
      color: #1d4ed8;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .activity-item {
      padding: 0.5rem;
      background-color: #f9fafb;
      border-radius: 0.25rem;
    }

    dl dt {
      margin-bottom: 0.125rem;
    }
  `,
})
export class ReviewStepComponent {
  readonly #store = inject(WizardStore);

  protected readonly reviewForm: ReviewStepForm = createReviewStepForm(
    this.#store.traveler,
    this.#store.destinations,
  );

  // No effects needed - review step validation is computed from store data
}
