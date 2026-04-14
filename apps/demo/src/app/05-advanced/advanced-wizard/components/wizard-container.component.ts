import { DatePipe } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { type FormFieldAppearance } from '@ngx-signal-forms/toolkit';

import {
  WizardComponent,
  WizardNavigationEvent,
  WizardStepDirective,
} from '../../../shared/wizard';
import type { WizardStep } from '../stores/wizard.store';
import { WizardStore } from '../stores/wizard.store';
import { WizardStepInterface } from '../wizard-step.interface';
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
    WizardComponent,
    WizardStepDirective,
    TravelerStepComponent,
    TripStepComponent,
    ReviewStepComponent,
  ],
  templateUrl: './wizard-container.component.html',
  styleUrl: './wizard-container.component.scss',
})
export class WizardContainerComponent {
  readonly appearance = input<FormFieldAppearance>('outline');

  protected readonly store = inject(WizardStore);

  // Generic reference to the current step component
  protected readonly currentStepRef =
    viewChild<WizardStepInterface>('currentStepRef');

  /** Two-way bound current step - linked to store for automatic sync. */
  protected readonly currentStep = linkedSignal(() => this.store.currentStep());

  /** Computed list of completed steps for the wizard progress indicator. */
  protected readonly completedSteps = computed(() => {
    const validation = this.store.stepValidation();
    return Object.entries(validation)
      .filter(([, isValid]) => isValid)
      .map(([stepId]) => stepId);
  });

  /**
   * Debounced saving indicator signal.
   * Only shows after SHOW_SAVING_AFTER_MS and stays visible for MIN_DISPLAY_MS.
   */
  protected readonly showSavingIndicator = signal(false);

  #shownAt: number | null = null;

  /**
   * Tracks pending focus request for step heading.
   * Set to true on navigation, cleared when focus is applied.
   */
  readonly #pendingFocus = signal(false);

  // Named Angular effect fields are intentionally unread.
  // Angular registers and destroys the effect for the component lifecycle.
  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef is intentionally kept as a named field to document the side effect.
  readonly #focusHeadingEffect = afterRenderEffect(() => {
    const stepRef = this.currentStepRef();
    const shouldFocus = this.#pendingFocus();

    if (shouldFocus && stepRef) {
      stepRef.focusHeading();
      this.#pendingFocus.set(false);
    }
  });

  // Named Angular effect fields are intentionally unread.
  // Angular registers and destroys the effect for the component lifecycle.
  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef is intentionally kept as a named field to document the side effect.
  readonly #savingIndicatorEffect = effect((onCleanup) => {
    const isSaving = this.store.isSaving();

    if (isSaving) {
      // Show indicator after delay (prevents flicker on fast saves)
      if (!this.showSavingIndicator()) {
        const showTimeoutId = setTimeout(() => {
          this.showSavingIndicator.set(true);
          this.#shownAt = Date.now();
        }, SHOW_SAVING_AFTER_MS);

        onCleanup(() => {
          clearTimeout(showTimeoutId);
        });
      }
    } else if (this.showSavingIndicator() && this.#shownAt) {
      // Ensure minimum display time before hiding
      const elapsed = Date.now() - this.#shownAt;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

      const hideTimeoutId = setTimeout(() => {
        this.showSavingIndicator.set(false);
        this.#shownAt = null;
      }, remaining);

      onCleanup(() => {
        clearTimeout(hideTimeoutId);
      });
    }
  });

  /**
   * Handle step navigation events from the wizard progress indicator.
   * Validates before allowing forward navigation.
   */
  protected async onStepChange(event: WizardNavigationEvent): Promise<void> {
    const isForwardNavigation = event.toIndex > event.fromIndex;

    if (isForwardNavigation) {
      const isValid = await this.#validateCurrentStep();
      if (!isValid) {
        event.preventDefault();
        return;
      }
      this.#commitCurrentStep();
    }

    this.store.goToStep(event.toStep as WizardStep, isForwardNavigation);
  }

  protected previousStep(): void {
    this.#commitCurrentStep();
    if (this.store.goToPreviousStep()) {
      this.#pendingFocus.set(true);
    }
  }

  protected async nextStep(): Promise<void> {
    const isValid = await this.#validateCurrentStep();
    if (!isValid) {
      return;
    }

    this.#commitCurrentStep();
    if (this.store.goToNextStep(true)) {
      this.#pendingFocus.set(true);
    }
  }

  /**
   * Commit current step's form data to store.
   * Called before navigation to ensure store reflects latest form state.
   */
  #commitCurrentStep(): void {
    this.currentStepRef()?.commitToStore();
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
    return (await this.currentStepRef()?.validateAndFocus()) ?? false;
  }
}
