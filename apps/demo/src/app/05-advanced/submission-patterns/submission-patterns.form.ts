import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
  type ResolvedErrorDisplayStrategy,
  type FormFieldAppearance,
  type FormFieldOrientation,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';
import {
  canSubmitWithWarnings,
  createOnInvalidHandler,
  hasOnlyWarnings,
  injectFormContext,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldErrorSummary } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import type { SubmissionModel } from './submission-patterns.model';
import { submissionSchema } from './submission-patterns.validations';

/**
 * Submission state indicator.
 *
 * Rendered as a *child* of `<form ngxSignalForm>` (see the template below) so
 * that `injectFormContext()` actually resolves the `NgxSignalFormContext`
 * provided by the `ngxSignalForm` directive. Directive providers are only
 * visible within that element's own subtree — a class-level `inject()` on
 * the component that HOSTS the `<form>` in its own template never sees them,
 * because that host component is instantiated by ITS OWN parent, outside the
 * `<form>` element's injector chain. This mirrors the pattern demonstrated on
 * the error-display-modes page (`ErrorDisplayHelpersComponent`).
 *
 * `submittedStatus` is exposed publicly so the host page can also showcase
 * passing an explicit value into `ngx-form-field-error-summary`'s
 * `[submittedStatus]` input — this component is the only place in the page
 * actually rendered inside the `<form ngxSignalForm>` subtree, so it's the
 * only place `injectFormContext()` resolves a non-null context.
 */
@Component({
  selector: 'ngx-submission-state-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mb-6 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
    >
      <span class="text-2xl">📊</span>
      <div class="flex-1">
        <div class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Submission State
        </div>
        <div
          class="flex items-center gap-2"
          data-testid="submission-state-badge"
        >
          @switch (submittedStatus()) {
            @case ('unsubmitted') {
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              >
                <span class="h-2 w-2 rounded-full bg-gray-400"></span>
                Ready to Submit
              </span>
            }
            @case ('submitting') {
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200"
              >
                <span
                  class="h-2 w-2 animate-pulse rounded-full bg-purple-600"
                ></span>
                Submitting...
              </span>
            }
            @case ('submitted') {
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                <span class="h-2 w-2 rounded-full bg-green-600"></span>
                Submitted
              </span>
            }
            @default {
              <span class="text-xs text-red-700 dark:text-red-300">
                {{ unreachableSubmittedStatus(submittedStatus()) }}
              </span>
            }
          }
          <span class="text-xs text-gray-500 dark:text-gray-400">
            (Automatically tracked by toolkit)
          </span>
        </div>
      </div>
    </div>
  `,
})
export class SubmissionStateIndicatorComponent {
  readonly #formContext = injectFormContext();

  readonly submittedStatus = computed<SubmittedStatus>(
    () => this.#formContext?.submittedStatus() ?? 'unsubmitted',
  );

  protected unreachableSubmittedStatus(status: SubmittedStatus): string {
    return `Unhandled submittedStatus: ${status}`;
  }
}

/**
 * Submission Patterns Component
 *
 * Demonstrates advanced submission patterns:
 * - Automatic submission tracking via declarative submission
 * - Toolkit submission helpers (canSubmitWithWarnings, submitting())
 * - Server error handling and display
 * - WCAG 2.2 compliance for error announcements
 * - Visual feedback for submission states
 */
@Component({
  selector: 'ngx-submission-patterns',
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    NgxFormFieldErrorSummary,
    SubmissionStateIndicatorComponent,
  ],
  template: `
    <form
      [formRoot]="registrationForm"
      ngxSignalForm
      [errorStrategy]="errorDisplayMode()"
      class="form-container"
    >
      <!-- Submission state indicator: rendered inside the form so
           injectFormContext() resolves the real NgxSignalFormContext. -->
      <ngx-submission-state-indicator #stateIndicator />

      <!-- Success message (if submission succeeded) -->
      @if (submissionSuccess()) {
        <div
          role="status"
          class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950"
        >
          <div class="flex items-start gap-3">
            <span class="text-2xl">✅</span>
            <div>
              <h3 class="mb-1 font-semibold text-green-900 dark:text-green-100">
                Registration Successful!
              </h3>
              <p class="text-sm text-green-800 dark:text-green-200">
                Account created for <strong>{{ model().username }}</strong>
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Form-level error summary (GOV.UK pattern) -->
      <!-- Aggregates all field errors into a clickable list; each entry focuses the invalid control -->
      <!--
        [autoFocus]="false" opts this summary out of the default
        focus-on-first-appearance behaviour. This page already wires up
        createOnInvalidHandler() (onInvalid of the submission action),
        which focuses the first invalid FIELD on submit — letting both
        run creates a focus race (the summary host wins after the next
        render and steals focus from the field). Pick one focus target
        per page; here we keep the field-level focus the demo is
        showcasing.
      -->
      <ngx-form-field-error-summary
        [formTree]="registrationForm"
        [submittedStatus]="stateIndicator.submittedStatus()"
        summaryLabel="Please fix the following errors before submitting:"
        [autoFocus]="false"
      />

      <!-- Form fields -->
      <div class="space-y-6">
        <!-- Username field -->
        <ngx-form-field-wrapper
          [formField]="registrationForm.username"
          [appearance]="appearance()"
          [orientation]="orientation()"
        >
          <label for="username">Username</label>
          <input
            id="username"
            type="text"
            [formField]="registrationForm.username"
            placeholder="Enter username"
          />
          <ngx-form-field-hint>
            Letters, numbers, and underscores only
          </ngx-form-field-hint>
        </ngx-form-field-wrapper>

        <!-- Password field -->
        <ngx-form-field-wrapper
          [formField]="registrationForm.password"
          [appearance]="appearance()"
          [orientation]="orientation()"
        >
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            [formField]="registrationForm.password"
            placeholder="Enter password"
          />
          <ngx-form-field-hint> At least 8 characters </ngx-form-field-hint>
        </ngx-form-field-wrapper>

        <!-- Confirm Password field -->
        <ngx-form-field-wrapper
          [formField]="registrationForm.confirmPassword"
          [appearance]="appearance()"
          [orientation]="orientation()"
        >
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            [formField]="registrationForm.confirmPassword"
            placeholder="Re-enter password"
          />
        </ngx-form-field-wrapper>
      </div>

      <!-- Submission state info with helper values -->
      <div
        class="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
      >
        <h4 class="mb-2 font-semibold text-gray-900 dark:text-gray-100">
          Submission State (Using Toolkit Helpers)
        </h4>
        <dl class="space-y-2 text-sm">
          <div class="flex gap-2">
            <dt class="font-medium text-gray-700 dark:text-gray-300">
              Form Valid:
            </dt>
            <dd class="text-gray-600 dark:text-gray-400">
              {{ registrationForm().valid() ? 'Yes' : 'No' }}
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium text-gray-700 dark:text-gray-300">
              canSubmitWithWarnings():
            </dt>
            <dd class="text-gray-600 dark:text-gray-400">
              {{ canSubmitForm() ? 'Yes' : 'No' }}
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium text-gray-700 dark:text-gray-300">
              submitting():
            </dt>
            <dd class="text-gray-600 dark:text-gray-400">
              {{ isFormSubmitting() ? 'Yes' : 'No' }}
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium text-gray-700 dark:text-gray-300">
              Error Strategy:
            </dt>
            <dd class="text-gray-600 dark:text-gray-400">
              {{ errorDisplayMode() }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- Form actions using toolkit submission helpers -->
      <div class="mt-8 flex gap-4">
        <button
          type="submit"
          [disabled]="isFormSubmitting()"
          class="btn-primary"
        >
          @if (isFormSubmitting()) {
            <span>Submitting...</span>
          } @else {
            <span>Create Account</span>
          }
        </button>
        <button
          type="button"
          (click)="resetForm()"
          [disabled]="isFormSubmitting()"
          class="btn-secondary"
        >
          Reset
        </button>
      </div>

      <!-- Simulate server error toggle -->
      <div class="mt-6">
        <label
          class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
        >
          <input
            type="checkbox"
            [formField]="registrationForm.simulateServerError"
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span>Simulate server error (for testing)</span>
        </label>
      </div>
    </form>
  `,
})
export class SubmissionPatternsComponent {
  readonly errorDisplayMode = input<ResolvedErrorDisplayStrategy>('on-touch');
  readonly appearance = input<FormFieldAppearance>('outline');
  readonly orientation = input<FormFieldOrientation>('vertical');

  readonly #model = signal<SubmissionModel>({
    username: '',
    password: '',
    confirmPassword: '',
    simulateServerError: false,
  });

  protected readonly model = this.#model.asReadonly();

  readonly #onInvalid = createOnInvalidHandler();

  readonly registrationForm = form(this.#model, submissionSchema, {
    submission: {
      /// Angular's native submit() treats every ValidationError — including
      /// warn:* ones — as blocking, so `ignoreValidators: 'all'` hands that
      /// gate to `action` itself. This mirrors vest-validation.form.ts: the
      /// action always runs, and the code below decides whether the pending
      /// warn:weak-password on the password field should block submission
      /// (it shouldn't — see submission-patterns.validations.ts).
      ignoreValidators: 'all',
      action: async (formData) => {
        // Angular submit() does not distinguish warn:* messages from blocking
        // errors yet, so we gate the action after formRoot has revealed all
        // validation feedback — warnings alone never block submission.
        if (!hasOnlyWarnings(this.registrationForm().errorSummary())) {
          this.#onInvalid(this.registrationForm);
          return;
        }

        /// Clear previous state
        this.submissionSuccess.set(false);

        /// Simulate API delay (toolkit automatically shows 'submitting' state)
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 1500);
        });

        /// Simulate server error if checkbox is checked — return as a native
        /// TreeValidationResult so Signal Forms attaches it to the username field
        if (formData().value().simulateServerError) {
          const username = formData().value().username;
          return {
            kind: 'usernameTaken',
            message: `Username "${username}" is already taken. Please choose another.`,
            fieldTree: formData.username,
          };
        }

        /// Success - show success message and reset form
        this.submissionSuccess.set(true);
        this.#model.set({
          username: '',
          password: '',
          confirmPassword: '',
          simulateServerError: false,
        });
        formData().reset();
        return undefined;
      },
    },
  });

  /// `canSubmitWithWarnings()` is the toolkit helper: it returns false while the
  /// form is submitting or has pending async validators, and true once no
  /// blocking errors remain (warnings alone never block submission). This is
  /// a genuine gate here: the schema's warn:weak-password rule can leave the
  /// form warning-only, and this page's action (above) actually honors that
  /// via ignoreValidators: 'all' + hasOnlyWarnings(), unlike a plain
  /// [formRoot] whose native submit() would still block on any ValidationError.
  protected readonly canSubmitForm = canSubmitWithWarnings(
    this.registrationForm,
  );
  /// `submitting()` is the Signal Forms field-state signal for in-flight submits.
  protected readonly isFormSubmitting = computed(() =>
    this.registrationForm().submitting(),
  );

  protected readonly submissionSuccess = signal(false);

  protected resetForm(): void {
    /// Reset form state and data
    this.registrationForm().reset();
    this.#model.set({
      username: '',
      password: '',
      confirmPassword: '',
      simulateServerError: false,
    });

    /// Clear local state
    this.submissionSuccess.set(false);

    /// Note: the derived submittedStatus returns to 'unsubmitted' after
    /// submitting() is false and the form has been reset (touched cleared)
  }
}
