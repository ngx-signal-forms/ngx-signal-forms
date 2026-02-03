import { DatePipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';

import { WizardStep, WizardStore } from '../stores/wizard.store';
import { ReviewStepComponent } from './review-step.component';
import { TravelerStepComponent } from './traveler-step.component';
import { TripStepComponent } from './trip-step.component';

/**
 * Shows saving indicator only after delay, and ensures minimum display time.
 * Prevents flickering on fast saves and avoids layout shift.
 */
const SHOW_SAVING_AFTER_MS = 300;
const MIN_DISPLAY_MS = 500;

@Component({
  selector: 'ngx-wizard-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    TravelerStepComponent,
    TripStepComponent,
    ReviewStepComponent,
  ],
  template: `
    <div class="wizard-container">
      <nav class="wizard-progress mb-6" aria-label="Wizard progress">
        <ol class="mb-2 flex justify-between">
          @for (step of steps; track step.id) {
            <li>
              <button
                type="button"
                class="step-indicator"
                [class.active]="store.currentStep() === step.id"
                [class.completed]="isStepCompleted(step.id)"
                [class.disabled]="!canNavigateTo(step.id)"
                [attr.aria-current]="
                  store.currentStep() === step.id ? 'step' : null
                "
                [disabled]="!canNavigateTo(step.id)"
                (click)="store.goToStep(step.id)"
              >
                @if (isStepCompleted(step.id)) {
                  <span class="sr-only">Completed: </span>
                }
                @if (store.currentStep() === step.id) {
                  <span class="sr-only">Current: </span>
                }
                <span class="step-number">{{ step.number }}</span>
                <span class="step-label">{{ step.label }}</span>
              </button>
            </li>
          }
        </ol>
        <div class="progress-bar">
          <div
            class="progress-fill"
            [style.width.%]="store.progress()"
            role="progressbar"
            [attr.aria-valuenow]="store.progress()"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Booking progress"
          ></div>
        </div>
      </nav>

      <!-- Status indicator with reserved space (no layout shift) -->
      <div class="status-row" aria-live="polite">
        @if (showSavingIndicator()) {
          <span class="saving-indicator">Saving draft...</span>
        } @else if (store.lastSavedAt()) {
          <span class="saved-indicator">
            Last saved: {{ store.lastSavedAt() | date: 'shortTime' }}
          </span>
        }
      </div>

      <!-- Step Content -->
      <div class="wizard-content">
        @switch (store.currentStep()) {
          @case ('traveler') {
            <ngx-traveler-step #travelerStep />
          }
          @case ('trip') {
            <ngx-trip-step #tripStep />
          }
          @case ('review') {
            <ngx-review-step />
          }
        }
      </div>

      <!-- Navigation Buttons -->
      <div class="wizard-navigation mt-6 flex justify-between">
        <button
          type="button"
          class="btn btn-secondary"
          [disabled]="store.isFirstStep() || store.isLoading()"
          (click)="previousStep()"
        >
          Previous
        </button>

        @if (!store.isLastStep()) {
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="store.isLoading()"
            (click)="nextStep()"
          >
            Next
          </button>
        } @else {
          <button
            type="button"
            class="btn btn-success"
            [disabled]="store.isLoading()"
            (click)="submit()"
          >
            @if (store.isLoading()) {
              Submitting...
            } @else {
              Confirm Booking
            }
          </button>
        }
      </div>

      <div
        class="error-message mt-4"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {{ store.error() ?? '' }}
      </div>
    </div>
  `,
  styles: `
    .wizard-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .step-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .step-indicator.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .step-indicator.active .step-number {
      background-color: var(--color-primary, #3b82f6);
      color: white;
    }

    .step-indicator.completed .step-number {
      background-color: var(--color-success, #22c55e);
      color: white;
    }

    .step-number {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background-color: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .step-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .progress-bar {
      height: 4px;
      background-color: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background-color: var(--color-primary, #3b82f6);
      transition: width 0.3s ease;
    }

    .saving-indicator {
      color: #f59e0b;
      font-size: 0.875rem;
    }

    .saved-indicator {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Reserved height prevents layout shift */
    .status-row {
      height: 1.5rem;
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .error-message {
      padding: 1rem;
      background-color: #fee2e2;
      border: 1px solid #fca5a5;
      border-radius: 0.375rem;
      color: #dc2626;
    }

    .error-message:empty {
      display: none;
    }

    .btn {
      padding: 0.5rem 1.5rem;
      border-radius: 0.375rem;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: var(--color-primary, #3b82f6);
      color: white;
      border: none;
    }

    .btn-secondary {
      background-color: #e5e7eb;
      color: #374151;
      border: none;
    }

    .btn-success {
      background-color: var(--color-success, #22c55e);
      color: white;
      border: none;
    }
  `,
})
export class WizardContainerComponent {
  readonly #injector = inject(Injector);
  protected readonly store = inject(WizardStore);

  // Step component references for manual commit before navigation (using viewChild signals)
  protected readonly travelerStep = viewChild(TravelerStepComponent);
  protected readonly tripStep = viewChild(TripStepComponent);
  protected readonly reviewStep = viewChild(ReviewStepComponent);

  /**
   * Determine if the current step is valid by checking the child component directly.
   * This is necessary because form changes are local and not yet committed to the store.
   */
  protected readonly isCurrentStepValid = computed(() => {
    const step = this.store.currentStep();
    if (step === 'traveler') {
      return this.travelerStep()?.isValid() ?? false;
    }
    if (step === 'trip') {
      return this.tripStep()?.isValid() ?? false;
    }
    return true; // Review step is always valid for navigation purposes
  });

  /**
   * Debounced saving indicator signal.
   * Only shows after SHOW_SAVING_AFTER_MS and stays visible for MIN_DISPLAY_MS.
   */
  protected readonly showSavingIndicator = signal(false);

  #showTimeoutId: ReturnType<typeof setTimeout> | null = null;
  #hideTimeoutId: ReturnType<typeof setTimeout> | null = null;
  #shownAt: number | null = null;

  protected readonly steps: {
    id: WizardStep;
    number: number;
    label: string;
  }[] = [
    { id: 'traveler', number: 1, label: 'Traveler Info' },
    { id: 'trip', number: 2, label: 'Trip Details' },
    { id: 'review', number: 3, label: 'Review' },
  ];

  constructor() {
    // Watch isSaving and apply debounce/minimum display logic
    effect(() => {
      const isSaving = this.store.isSaving();

      if (isSaving) {
        // Clear any pending hide
        if (this.#hideTimeoutId) {
          clearTimeout(this.#hideTimeoutId);
          this.#hideTimeoutId = null;
        }

        // Only show after delay (prevents flicker on fast saves)
        if (!this.#showTimeoutId && !this.showSavingIndicator()) {
          this.#showTimeoutId = setTimeout(() => {
            this.showSavingIndicator.set(true);
            this.#shownAt = Date.now();
            this.#showTimeoutId = null;
          }, SHOW_SAVING_AFTER_MS);
        }
      } else {
        // Clear pending show if save finished quickly
        if (this.#showTimeoutId) {
          clearTimeout(this.#showTimeoutId);
          this.#showTimeoutId = null;
        }

        // Ensure minimum display time before hiding
        if (this.showSavingIndicator() && this.#shownAt) {
          const elapsed = Date.now() - this.#shownAt;
          const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

          this.#hideTimeoutId = setTimeout(() => {
            this.showSavingIndicator.set(false);
            this.#shownAt = null;
            this.#hideTimeoutId = null;
          }, remaining);
        }
      }
    });
  }

  protected isStepCompleted(stepId: WizardStep): boolean {
    return this.store.stepValidation()[stepId];
  }

  protected canNavigateTo(stepId: WizardStep): boolean {
    return (
      this.store.visitedSteps().includes(stepId) ||
      this.store.currentStep() === stepId
    );
  }

  protected previousStep(): void {
    // Commit current step's form data before navigating
    this.#commitCurrentStep();

    const currentIdx = this.steps.findIndex(
      (s) => s.id === this.store.currentStep(),
    );
    if (currentIdx > 0) {
      this.store.goToStep(this.steps[currentIdx - 1].id);
      this.#focusCurrentStepHeading();
    }
  }

  protected async nextStep(): Promise<void> {
    const isValid = await this.#validateCurrentStep();
    if (!isValid) {
      return;
    }

    // Commit current step's form data before navigating
    this.#commitCurrentStep();

    const currentIdx = this.steps.findIndex(
      (s) => s.id === this.store.currentStep(),
    );
    if (currentIdx < this.steps.length - 1) {
      this.store.goToStep(this.steps[currentIdx + 1].id, true);
      this.#focusCurrentStepHeading();
    }
  }

  /**
   * Commit current step's form data to store.
   * Called before navigation to ensure store reflects latest form state.
   * This avoids effect-based continuous mirroring (signal→signal propagation).
   */
  #commitCurrentStep(): void {
    const currentStep = this.store.currentStep();

    // Commit based on current step using viewChild signals
    if (currentStep === 'traveler') {
      this.travelerStep()?.commitToStore();
    } else if (currentStep === 'trip') {
      this.tripStep()?.commitToStore();
    }
  }

  protected async submit(): Promise<void> {
    const isValid = await this.#validateCurrentStep();
    if (!isValid) {
      return;
    }

    // Commit any uncommitted changes before final submission
    this.#commitCurrentStep();

    this.store.submit();
    // The store's submitBooking mutation will handle success/error state
    // UI will update reactively via isSubmitting and error signals
  }

  async #validateCurrentStep(): Promise<boolean> {
    const step = this.store.currentStep();
    if (step === 'traveler') {
      return (await this.travelerStep()?.validateAndFocus()) ?? false;
    }
    if (step === 'trip') {
      return (await this.tripStep()?.validateAndFocus()) ?? false;
    }
    return true;
  }

  #focusCurrentStepHeading(): void {
    afterNextRender(
      () => {
        const step = this.store.currentStep();
        if (step === 'traveler') {
          this.travelerStep()?.focusHeading();
        } else if (step === 'trip') {
          this.tripStep()?.focusHeading();
        } else if (step === 'review') {
          this.reviewStep()?.focusHeading();
        }
      },
      { injector: this.#injector },
    );
  }
}
