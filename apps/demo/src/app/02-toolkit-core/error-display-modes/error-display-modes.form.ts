import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { form, FormField, submit } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit/core';

import {
  productFeedbackSchema,
  type ProductFeedbackModel,
} from './error-display-modes.validations';

const INITIAL_MODEL: ProductFeedbackModel = {
  name: '',
  email: '',
  company: '',
  productUsed: '',
  overallRating: 0,
  improvementSuggestions: '',
  detailedFeedback: '',
  allowFollowUp: false,
  newsletter: false,
};

/**
 * Error Display Modes Demo using Angular Signal Forms + Toolkit
 *
 * Demonstrates different error display strategies with a realistic
 * product feedback form scenario.
 *
 * Note: Signal Forms doesn't support runtime error strategy changes,
 * so the strategy is set once via the form provider directive.
 */
@Component({
  selector: 'ngx-error-display-modes-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit],
  template: `
    <!-- Product Feedback Form -->
    <form
      [ngxSignalForm]="productForm"
      [errorStrategy]="errorDisplayMode()"
      (submit)="submitFeedback($event)"
      class="form-container"
      aria-labelledby="productFeedbackHeading"
    >
      <!-- Personal Information Section -->
      <fieldset class="mb-8">
        <legend
          class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          Personal Information
        </legend>

        <!-- Name Field -->
        <div class="form-field">
          <label class="form-label" for="name">Full Name *</label>
          <input
            class="form-input"
            id="name"
            type="text"
            autocomplete="name"
            [formField]="productForm.name"
            aria-describedby="name-hint"
            placeholder="Your full name"
          />
          <div class="form-hint" id="name-hint">
            We use this to personalize our response
          </div>
          <ngx-signal-form-error
            [formField]="productForm.name"
            fieldName="name"
          />
        </div>

        <!-- Email Field -->
        <div class="form-field">
          <label class="form-label" for="email">Email Address *</label>
          <input
            class="form-input"
            id="email"
            type="email"
            autocomplete="email"
            [formField]="productForm.email"
            placeholder="your.email@company.com"
            aria-describedby="email-hint"
          />
          <div class="form-hint" id="email-hint">
            For follow-up questions (we respect your privacy)
          </div>
          <ngx-signal-form-error
            [formField]="productForm.email"
            fieldName="email"
          />
        </div>

        <!-- Company Field -->
        <div class="form-field">
          <label class="form-label" for="company">Company</label>
          <input
            class="form-input"
            id="company"
            type="text"
            autocomplete="organization"
            [formField]="productForm.company"
            placeholder="Your company (optional)"
            aria-describedby="company-hint"
          />
          <div class="form-hint" id="company-hint">
            Helps us understand your use case
          </div>
          <ngx-signal-form-error
            [formField]="productForm.company"
            fieldName="company"
          />
        </div>
      </fieldset>

      <!-- Feedback Section -->
      <fieldset class="mb-8">
        <legend
          class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          Your Feedback
        </legend>

        <!-- Product Used -->
        <div class="form-field">
          <label class="form-label" for="productUsed"
            >Which product did you use? *</label
          >
          <select
            class="form-input"
            id="productUsed"
            [formField]="productForm.productUsed"
            aria-describedby="product-hint"
          >
            <option value="">Select a product...</option>
            <option value="Web App">Web Application</option>
            <option value="Mobile App">Mobile Application</option>
            <option value="API">API Documentation</option>
            <option value="Documentation">User Documentation</option>
            <option value="Other">Other</option>
          </select>
          <div class="form-hint" id="product-hint">
            Which product are you providing feedback about?
          </div>
          <ngx-signal-form-error
            [formField]="productForm.productUsed"
            fieldName="productUsed"
          />
        </div>

        <!-- Overall Rating -->
        <div class="form-field">
          <label class="form-label" for="overallRating">Overall Rating *</label>
          <input
            class="form-input"
            id="overallRating"
            type="number"
            [formField]="productForm.overallRating"
            placeholder="Rate 1-5 stars"
            aria-describedby="rating-hint"
            aria-valuemin="1"
            aria-valuemax="5"
          />
          <div class="form-hint" id="rating-hint">1 = Poor, 5 = Excellent</div>
          <ngx-signal-form-error
            [formField]="productForm.overallRating"
            fieldName="overallRating"
          />
        </div>

        <!-- Conditional Improvement Suggestions -->
        @if (showImprovementSuggestions()) {
          <div class="form-field">
            <label class="form-label" for="improvementSuggestions">
              What could we improve? *
            </label>
            <textarea
              class="form-input"
              id="improvementSuggestions"
              rows="4"
              [formField]="productForm.improvementSuggestions"
              placeholder="Please help us understand what went wrong..."
              aria-describedby="improvement-hint improvement-counter"
            ></textarea>
            <div class="mt-1 flex items-center justify-between">
              <div class="form-hint" id="improvement-hint">
                Please help us understand what went wrong
              </div>
              <span
                id="improvement-counter"
                class="text-xs text-gray-500 dark:text-gray-400"
                [class.text-red-600]="improvementLength() > 500"
                [class.dark:text-red-400]="improvementLength() > 500"
              >
                {{ improvementLength() }}/500
              </span>
            </div>
            <ngx-signal-form-error
              [formField]="productForm.improvementSuggestions"
              fieldName="improvementSuggestions"
            />
          </div>
        }

        <!-- Detailed Feedback -->
        <div class="form-field">
          <label class="form-label" for="detailedFeedback">
            Additional Comments
          </label>
          <textarea
            class="form-input"
            id="detailedFeedback"
            rows="4"
            [formField]="productForm.detailedFeedback"
            placeholder="Share your detailed experience..."
            aria-describedby="detailed-hint detailed-counter"
          ></textarea>
          <div class="mt-1 flex items-center justify-between">
            <div class="form-hint" id="detailed-hint">
              Any additional thoughts or suggestions
            </div>
            <span
              id="detailed-counter"
              class="text-xs text-gray-500 dark:text-gray-400"
              [class.text-red-600]="detailedLength() > 1000"
              [class.dark:text-red-400]="detailedLength() > 1000"
            >
              {{ detailedLength() }}/1000
            </span>
          </div>
          <ngx-signal-form-error
            [formField]="productForm.detailedFeedback"
            fieldName="detailedFeedback"
          />
        </div>
      </fieldset>

      <!-- Preferences Section -->
      <fieldset class="mb-8">
        <legend
          class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          ⚙️ Preferences
        </legend>

        <!-- Allow Follow Up -->
        <div class="form-field">
          <label class="form-checkbox-label">
            <input
              type="checkbox"
              id="allowFollowUp"
              class="form-checkbox"
              [formField]="productForm.allowFollowUp"
            />
            <span class="ml-2"
              >Allow us to contact you for follow-up questions</span
            >
          </label>
          <div class="form-hint ml-6">We promise not to spam you</div>
        </div>

        <!-- Newsletter -->
        <div class="form-field">
          <label class="form-checkbox-label">
            <input
              type="checkbox"
              id="newsletter"
              class="form-checkbox"
              [formField]="productForm.newsletter"
            />
            <span class="ml-2">Subscribe to product updates</span>
          </label>
          <div class="form-hint ml-6">
            Monthly digest of new features and improvements
          </div>
        </div>
      </fieldset>

      <!-- Submit Section -->
      <div class="form-actions">
        @if (showSubmissionError()) {
          <div
            id="submission-error"
            class="feedback-alert feedback-alert--error"
            role="alert"
          >
            <div class="text-sm font-medium text-red-800 dark:text-red-200">
              Please fix the errors above before submitting.
            </div>
          </div>
        }

        @if (showPendingMessage()) {
          <div
            class="feedback-alert feedback-alert--pending"
            role="status"
            aria-live="polite"
          >
            <div class="text-sm font-medium text-blue-800 dark:text-blue-200">
              Still validating... Please wait a moment.
            </div>
          </div>
        }

        <button
          type="submit"
          class="btn-primary"
          aria-live="polite"
          [disabled]="productForm().pending()"
          [attr.aria-describedby]="
            showSubmissionError() ? 'submission-error' : null
          "
        >
          @if (productForm().pending()) {
            Submitting...
          } @else {
            Submit Feedback
          }
        </button>
      </div>
    </form>
  `,
})
export class ErrorDisplayModesFormComponent {
  /** The error display strategy to use for form validation */
  readonly errorDisplayMode = input.required<ErrorDisplayStrategy>();

  readonly #model = signal<ProductFeedbackModel>({ ...INITIAL_MODEL });

  /** Form instance using Signal Forms */
  readonly productForm = form(this.#model, productFeedbackSchema);

  /** Computed signal for showing improvement suggestions field */
  protected readonly showImprovementSuggestions = computed(() => {
    const rating = this.productForm.overallRating().value();
    return rating > 0 && rating <= 3;
  });

  protected readonly improvementLength = computed(() => {
    const current = this.productForm.improvementSuggestions().value();
    return (current ?? '').length;
  });

  protected readonly detailedLength = computed(() => {
    const current = this.productForm.detailedFeedback().value();
    return (current ?? '').length;
  });

  /** Track submission attempts manually */
  readonly #submissionAttempted = signal(false);

  /** Computed: show submission error when form invalid after submit attempt */
  protected readonly showSubmissionError = computed(
    () => this.#submissionAttempted() && this.productForm().invalid(),
  );

  /** Computed: show pending message during async validation */
  protected readonly showPendingMessage = computed(() =>
    this.productForm().pending(),
  );

  protected async submitFeedback(event: Event): Promise<void> {
    event.preventDefault();

    this.#submissionAttempted.set(true);

    await submit(this.productForm, async () => {
      // Simulate API call
      alert('Thank you for your feedback!');

      return null; // No server errors
    });
  }
}
