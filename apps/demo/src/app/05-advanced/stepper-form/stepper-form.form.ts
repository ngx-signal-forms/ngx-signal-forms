import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { FormField, submit } from '@angular/forms/signals';
import {
  focusFirstInvalid,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

import {
  WizardComponent,
  WizardNavigationEvent,
  WizardStepDirective,
} from '../../shared/wizard';
import { createWizardForm } from './stepper-form.schema';
import {
  INITIAL_WIZARD_DATA,
  STEP_ORDER,
  type StepId,
} from './stepper-form.types';

@Component({
  selector: 'ngx-stepper-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    NgxSignalFormErrorComponent,
    WizardComponent,
    WizardStepDirective,
  ],
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-6 text-2xl font-bold">Multi-Step Registration</h2>

      <form (submit)="finishWizard($event)" class="max-w-lg">
        <ngx-wizard
          [(currentStep)]="currentStep"
          [completedSteps]="completedSteps()"
          [showNavigation]="false"
          (stepChange)="onStepChange($event)"
          (wizardSubmit)="onWizardSubmit()"
        >
          <!-- Step 1: Account -->
          <ng-template ngxWizardStep="account" label="Account">
            <div
              class="animate-in fade-in slide-in-from-right-4 space-y-4 rounded-lg border bg-white p-6 shadow-sm duration-300 dark:border-gray-700 dark:bg-gray-800"
            >
              <h3 #stepHeading class="text-lg font-semibold" tabindex="-1">
                Account Details
              </h3>

              <ngx-signal-form-field-wrapper
                [formField]="wizardForm.email"
                outline
              >
                <label for="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  [formField]="wizardForm.email"
                  class="form-input"
                />
              </ngx-signal-form-field-wrapper>

              <ngx-signal-form-field-wrapper
                [formField]="wizardForm.password"
                outline
              >
                <label for="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  [formField]="wizardForm.password"
                  class="form-input"
                />
              </ngx-signal-form-field-wrapper>
            </div>
          </ng-template>

          <!-- Step 2: Profile -->
          <ng-template ngxWizardStep="profile" label="Profile">
            <div
              class="animate-in fade-in slide-in-from-right-4 space-y-4 rounded-lg border bg-white p-6 shadow-sm duration-300 dark:border-gray-700 dark:bg-gray-800"
            >
              <h3 #stepHeading class="text-lg font-semibold" tabindex="-1">
                Personal Profile
              </h3>

              <ngx-signal-form-field-wrapper
                [formField]="wizardForm.fullName"
                outline
              >
                <label for="fullName">Full Name *</label>
                <input
                  id="fullName"
                  [formField]="wizardForm.fullName"
                  class="form-input"
                />
              </ngx-signal-form-field-wrapper>

              <ngx-signal-form-field-wrapper
                [formField]="wizardForm.phone"
                outline
              >
                <label for="phone">Phone Number *</label>
                <input
                  id="phone"
                  type="tel"
                  [formField]="wizardForm.phone"
                  class="form-input"
                />
              </ngx-signal-form-field-wrapper>
            </div>
          </ng-template>

          <!-- Step 3: Review -->
          <ng-template ngxWizardStep="review" label="Review">
            <div
              class="animate-in fade-in slide-in-from-right-4 space-y-4 rounded-lg border bg-white p-6 shadow-sm duration-300 dark:border-gray-700 dark:bg-gray-800"
            >
              <h3 #stepHeading class="text-lg font-semibold" tabindex="-1">
                Review & Terms
              </h3>

              <div
                class="space-y-2 rounded border bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <p>
                  <span class="font-medium">Email:</span> {{ model().email }}
                </p>
                <p>
                  <span class="font-medium">Name:</span> {{ model().fullName }}
                </p>
              </div>

              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <input
                    id="termsAccepted"
                    type="checkbox"
                    [formField]="wizardForm.termsAccepted"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label for="termsAccepted" class="text-sm">
                    I accept the terms and conditions *
                  </label>
                </div>
                <ngx-signal-form-error
                  [formField]="wizardForm.termsAccepted"
                  fieldName="termsAccepted"
                />
              </div>
            </div>
          </ng-template>
        </ngx-wizard>

        <!-- Custom Navigation -->
        <div class="mt-6 flex justify-between border-t pt-4">
          <button
            type="button"
            (click)="prevStep()"
            [disabled]="currentStep() === 'account'"
            class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          @if (currentStep() !== 'review') {
            <button type="button" (click)="nextStep()" class="btn-primary">
              Next Step
            </button>
          } @else {
            <button
              type="submit"
              class="btn-primary"
              [disabled]="wizardForm().pending()"
              [attr.aria-busy]="wizardForm().pending() ? 'true' : null"
            >
              @if (wizardForm().pending()) {
                Submitting...
              } @else {
                Complete Registration
              }
            </button>
          }
        </div>
      </form>
    </div>
  `,
})
/**
 * Multi-step registration form with validation gates and focus management.
 */
export class StepperFormComponent {
  readonly currentStep = signal<StepId>('account');
  protected readonly stepHeading =
    viewChild<ElementRef<HTMLHeadingElement>>('stepHeading');
  readonly #injector = inject(Injector);

  readonly #model = signal(INITIAL_WIZARD_DATA);

  readonly model = this.#model.asReadonly();
  readonly wizardForm = createWizardForm(this.#model);

  /** Computed list of completed steps for the wizard progress indicator. */
  protected readonly completedSteps = computed(() => {
    const completed: string[] = [];
    if (
      !this.wizardForm.email().invalid() &&
      !this.wizardForm.password().invalid()
    ) {
      completed.push('account');
    }
    if (
      completed.includes('account') &&
      !this.wizardForm.fullName().invalid() &&
      !this.wizardForm.phone().invalid()
    ) {
      completed.push('profile');
    }
    if (
      completed.includes('profile') &&
      !this.wizardForm.termsAccepted().invalid()
    ) {
      completed.push('review');
    }
    return completed;
  });

  /**
   * Handle step navigation events from the wizard.
   * Validate before allowing forward navigation.
   */
  protected onStepChange(event: WizardNavigationEvent): void {
    // Only validate when moving forward
    if (event.toIndex > event.fromIndex) {
      if (!this.#validateStep(event.fromStep)) {
        event.preventDefault();
      }
    }
  }

  /**
   * Handle wizard submit event.
   */
  protected onWizardSubmit(): void {
    // Handled by the form submit
  }

  /**
   * Validate the current step and advance when valid.
   */
  nextStep(): void {
    const step = this.currentStep();
    if (!this.#validateStep(step)) {
      return;
    }

    const currentIdx = STEP_ORDER.indexOf(step);
    if (currentIdx < STEP_ORDER.length - 1) {
      this.currentStep.set(STEP_ORDER[currentIdx + 1]);
      this.#focusStepHeading();
    }
  }

  /**
   * Navigate to the previous step without blocking validation.
   */
  prevStep(): void {
    const currentIdx = STEP_ORDER.indexOf(this.currentStep());
    if (currentIdx > 0) {
      this.currentStep.set(STEP_ORDER[currentIdx - 1]);
      this.#focusStepHeading();
    }
  }

  /**
   * Submit the wizard and focus the first invalid field when needed.
   */
  protected async finishWizard(event: Event): Promise<void> {
    event.preventDefault();
    if (this.wizardForm().invalid()) {
      focusFirstInvalid(this.wizardForm);
    }
    await submit(this.wizardForm, async (data) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('Wizard Completed:', data());
      alert('Registration Successful!');
      return null;
    });
  }

  /**
   * Validate a specific step's fields.
   */
  #validateStep(stepId: string): boolean {
    if (stepId === 'account') {
      this.wizardForm.email().markAsTouched();
      this.wizardForm.password().markAsTouched();
      if (
        this.wizardForm.email().invalid() ||
        this.wizardForm.password().invalid()
      ) {
        focusFirstInvalid(this.wizardForm);
        return false;
      }
    }
    if (stepId === 'profile') {
      this.wizardForm.fullName().markAsTouched();
      this.wizardForm.phone().markAsTouched();
      if (
        this.wizardForm.fullName().invalid() ||
        this.wizardForm.phone().invalid()
      ) {
        focusFirstInvalid(this.wizardForm);
        return false;
      }
    }
    return true;
  }

  /**
   * Move focus to the active step heading after the view updates.
   * Uses afterNextRender to ensure the heading exists in the DOM before focus.
   */
  #focusStepHeading(): void {
    afterNextRender(
      () => {
        this.stepHeading()?.nativeElement.focus();
      },
      { injector: this.#injector },
    );
  }
}
