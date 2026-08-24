import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import type { FieldState, FieldTree } from '@angular/forms/signals';
import { form, FormField } from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  injectFormContext,
  NgxSignalFormToolkit,
  type ErrorDisplayStrategy,
  type ResolvedErrorDisplayStrategy,
  createShowErrorsComputed,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

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

@Component({
  selector: 'ngx-error-display-helpers',
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <div
      class="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-100"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <span class="font-semibold">Toolkit helpers</span>
          <span
            class="rounded-full bg-white px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
          >
            Strategy: {{ resolvedStrategy() }}
          </span>
          <span
            class="rounded-full bg-white px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
          >
            Submitted: {{ submittedStatus() }}
          </span>
        </div>
        <span class="text-xs text-indigo-700 dark:text-indigo-300">
          Powered by injectFormContext + createShowErrorsComputed
        </span>
      </div>

      <div class="mt-3 grid gap-2 sm:grid-cols-2">
        <div
          class="rounded-md bg-white/80 px-3 py-2 text-xs text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200"
        >
          Name errors visible:
          <strong>{{ showNameErrors() ? 'yes' : 'no' }}</strong>
        </div>
        <div
          class="rounded-md bg-white/80 px-3 py-2 text-xs text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200"
        >
          Email errors visible:
          <strong>{{ showEmailErrors() ? 'yes' : 'no' }}</strong>
        </div>
      </div>

      <!--
        [hidden] (not @if) on purpose: see the matching note above the
        submission-error banner in ErrorDisplayModesFormComponent's own
        template. In specs, a structural directive here — gated on a signal
        that changes as part of the same render pass as a real submit,
        combined with this page's ngx-form-field-wrapper fields — did not
        let zoneless change detection reach stability. The root cause inside
        the toolkit wrapper has not been isolated; [hidden] avoids the
        symptom.
      -->
      <div
        class="mt-3 rounded-md border border-indigo-300 bg-white px-3 py-2 text-xs font-medium text-indigo-800 dark:border-indigo-700 dark:bg-indigo-900 dark:text-indigo-100"
        role="status"
        aria-live="polite"
        [hidden]="!showPersonalInfoErrors()"
      >
        Personal info has visible errors (aggregated with a computed signal)
      </div>
    </div>
  `,
})
export class ErrorDisplayHelpersComponent {
  readonly nameField = input.required<FieldTree<string>>();
  readonly emailField = input.required<FieldTree<string>>();

  readonly #formContext = injectFormContext();
  readonly #nameFieldState = computed<FieldState<string>>(() =>
    this.nameField()(),
  );
  readonly #emailFieldState = computed<FieldState<string>>(() =>
    this.emailField()(),
  );

  protected readonly resolvedStrategy = computed<ErrorDisplayStrategy>(
    () => this.#formContext?.errorStrategy() ?? 'on-touch',
  );

  /**
   * Public (not `protected`) so the page-level template can read it through
   * a template reference variable (`#helpers`) — the submission-error banner
   * and submit button live outside this component's own subtree but still
   * need the submitted status. See `injectFormContext()`'s doc comment:
   * directive providers are only visible within the `<form ngxSignalForm>`
   * subtree, and this component is the one actually rendered inside it.
   */
  readonly submittedStatus = computed<SubmittedStatus>(
    () => this.#formContext?.submittedStatus() ?? 'unsubmitted',
  );

  protected readonly showNameErrors = createShowErrorsComputed(
    this.#nameFieldState,
    this.resolvedStrategy,
    this.submittedStatus,
  );

  protected readonly showEmailErrors = createShowErrorsComputed(
    this.#emailFieldState,
    this.resolvedStrategy,
    this.submittedStatus,
  );

  protected readonly showPersonalInfoErrors = computed(
    () => this.showNameErrors() || this.showEmailErrors(),
  );
}

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

  imports: [
    ErrorDisplayHelpersComponent,
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    NgxFormFieldHint,
  ],
  template: `
    <!-- Product Feedback Form -->
    <form
      [formRoot]="productForm"
      ngxSignalForm
      [errorStrategy]="errorDisplayMode()"
      class="form-container"
      aria-label="Product feedback"
    >
      <ngx-error-display-helpers
        #helpers
        [nameField]="productForm.name"
        [emailField]="productForm.email"
        class="mb-6 block"
      />
      <!-- Personal Information Section -->
      <fieldset class="mb-8">
        <legend
          class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          Personal Information
        </legend>

        <!-- Name Field -->
        <ngx-form-field-wrapper
          class="form-field"
          appearance="plain"
          [formField]="productForm.name"
        >
          <label class="form-label" for="name">Full Name *</label>
          <input
            class="form-input"
            id="name"
            type="text"
            autocomplete="name"
            [formField]="productForm.name"
            placeholder="Your full name"
          />
          <ngx-form-field-hint id="name-hint">
            We use this to personalize our response
          </ngx-form-field-hint>
        </ngx-form-field-wrapper>

        <!-- Email Field -->
        <ngx-form-field-wrapper
          class="form-field"
          appearance="plain"
          [formField]="productForm.email"
        >
          <label class="form-label" for="email">Email Address *</label>
          <input
            class="form-input"
            id="email"
            type="email"
            autocomplete="email"
            [formField]="productForm.email"
            placeholder="your.email@company.com"
          />
          <ngx-form-field-hint id="email-hint">
            For follow-up questions (we respect your privacy)
          </ngx-form-field-hint>
        </ngx-form-field-wrapper>

        <!-- Company Field -->
        <ngx-form-field-wrapper
          class="form-field"
          appearance="plain"
          [formField]="productForm.company"
        >
          <label class="form-label" for="company">Company</label>
          <input
            class="form-input"
            id="company"
            type="text"
            autocomplete="organization"
            [formField]="productForm.company"
            placeholder="Your company (optional)"
          />
          <ngx-form-field-hint id="company-hint">
            Helps us understand your use case
          </ngx-form-field-hint>
        </ngx-form-field-wrapper>
      </fieldset>

      <!-- Feedback Section -->
      <fieldset class="mb-8">
        <legend
          class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          Your Feedback
        </legend>

        <!-- Product Used -->
        <ngx-form-field-wrapper
          class="form-field"
          appearance="plain"
          [formField]="productForm.productUsed"
        >
          <label class="form-label" for="productUsed"
            >Which product did you use? *</label
          >
          <select
            class="form-input"
            id="productUsed"
            [formField]="productForm.productUsed"
          >
            <option value="">Select a product...</option>
            <option value="Web App">Web Application</option>
            <option value="Mobile App">Mobile Application</option>
            <option value="API">API Documentation</option>
            <option value="Documentation">User Documentation</option>
            <option value="Other">Other</option>
          </select>
          <ngx-form-field-hint id="product-hint">
            Which product are you providing feedback about?
          </ngx-form-field-hint>
        </ngx-form-field-wrapper>

        <!-- Overall Rating -->
        <ngx-form-field-wrapper
          class="form-field"
          appearance="plain"
          [formField]="productForm.overallRating"
        >
          <label class="form-label" for="overallRating">Overall Rating *</label>
          <input
            class="form-input"
            id="overallRating"
            type="number"
            [formField]="productForm.overallRating"
            placeholder="Rate 1-5"
          />
          <ngx-form-field-hint id="rating-hint">
            1 = Poor, 5 = Excellent
          </ngx-form-field-hint>
        </ngx-form-field-wrapper>

        <!-- Conditional Improvement Suggestions -->
        @if (showImprovementSuggestions()) {
          <ngx-form-field-wrapper
            class="form-field"
            appearance="plain"
            [formField]="productForm.improvementSuggestions"
          >
            <label class="form-label" for="improvementSuggestions">
              What could we improve? *
            </label>
            <textarea
              class="form-input"
              id="improvementSuggestions"
              rows="4"
              [formField]="productForm.improvementSuggestions"
              placeholder="Please help us understand what went wrong..."
            ></textarea>
            <ngx-form-field-hint id="improvement-hint">
              Please help us understand what went wrong
            </ngx-form-field-hint>
            <span
              characterCount
              id="improvement-counter"
              class="text-xs text-gray-500 dark:text-gray-400"
              [class.text-red-600]="improvementLength() > 500"
              [class.dark:text-red-400]="improvementLength() > 500"
            >
              {{ improvementLength() }}/500
            </span>
          </ngx-form-field-wrapper>
        }

        <!-- Detailed Feedback -->
        <ngx-form-field-wrapper
          class="form-field"
          appearance="plain"
          [formField]="productForm.detailedFeedback"
        >
          <label class="form-label" for="detailedFeedback">
            Additional Comments
          </label>
          <textarea
            class="form-input"
            id="detailedFeedback"
            rows="4"
            [formField]="productForm.detailedFeedback"
            placeholder="Share your detailed experience..."
          ></textarea>
          <ngx-form-field-hint id="detailed-hint">
            Any additional thoughts or suggestions
          </ngx-form-field-hint>
          <span
            characterCount
            id="detailed-counter"
            class="text-xs text-gray-500 dark:text-gray-400"
            [class.text-red-600]="detailedLength() > 1000"
            [class.dark:text-red-400]="detailedLength() > 1000"
          >
            {{ detailedLength() }}/1000
          </span>
        </ngx-form-field-wrapper>
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

      @if (successMessage()) {
        <div
          class="mb-4 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-200"
          role="status"
          aria-live="polite"
        >
          {{ successMessage() }}
        </div>
      }

      <!-- Submit Section -->
      <!--
        Submission-error visibility comes from the toolkit's own tracking:
        helpers.submittedStatus() reads NgxSignalForm's submittedStatus()
        (via ErrorDisplayHelpersComponent, the only element in this template
        actually rendered inside the form[ngxSignalForm] subtree — see its
        submittedStatus doc comment) combined with the form's own invalid().
        No hand-rolled "submission attempted" signal needed.

        [hidden] (not @if) on purpose: in specs, gating this element's
        creation with a structural directive tied to
        helpers.submittedStatus() — a signal that changes as part of the
        same render pass triggered by a real submit — combined with the
        ngx-form-field-wrapper fields above did not let zoneless change
        detection reach stability. The root cause inside the toolkit
        wrapper has not been isolated. Keeping the element always mounted
        and only toggling its hidden attribute avoids the symptom entirely;
        the element is already inert to assistive tech while hidden,
        matching the previous @if's effect.
      -->
      <div class="form-actions">
        <div
          id="submission-error"
          class="feedback-alert feedback-alert--error"
          role="alert"
          [hidden]="
            !(
              helpers.submittedStatus() === 'submitted' &&
              productForm().invalid()
            )
          "
        >
          <div class="text-sm font-medium">
            Please fix the errors above before submitting.
          </div>
        </div>

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
          [disabled]="productForm().submitting()"
          [attr.aria-describedby]="
            helpers.submittedStatus() === 'submitted' && productForm().invalid()
              ? 'submission-error'
              : null
          "
        >
          @if (productForm().submitting()) {
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
  readonly errorDisplayMode = input.required<ResolvedErrorDisplayStrategy>();

  readonly #model = signal({ ...INITIAL_MODEL });
  protected readonly successMessage = signal('');

  /** Form instance using Signal Forms */
  readonly productForm = form(this.#model, productFeedbackSchema, {
    submission: {
      action: async () => {
        this.successMessage.set('Thank you for your feedback!');
      },
      onInvalid: createOnInvalidHandler(),
    },
  });

  /** Computed signal for showing improvement suggestions field */
  protected readonly showImprovementSuggestions = computed(() => {
    const rating = this.productForm.overallRating().value();
    return rating > 0 && rating <= 3;
  });

  protected readonly improvementLength = computed(() => {
    const current = this.productForm.improvementSuggestions().value();
    return current.length;
  });

  protected readonly detailedLength = computed(() => {
    const current = this.productForm.detailedFeedback().value();
    return current.length;
  });

  /** Computed: show pending message during async validation */
  protected readonly showPendingMessage = computed(() =>
    this.productForm().submitting(),
  );
}
