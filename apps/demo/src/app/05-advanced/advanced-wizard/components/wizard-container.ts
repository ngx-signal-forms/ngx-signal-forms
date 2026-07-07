import { DatePipe } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import {
  type FormFieldAppearance,
  type FormFieldOrientation,
} from '@ngx-signal-forms/toolkit';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/debugger';

import {
  WizardCanNavigate,
  WizardComponent,
  WizardStepDirective,
} from '../../../shared/wizard';
import type { WizardStep } from '../stores/wizard.store';
import { WizardStore } from '../stores/wizard.store';
import { WizardStepInterface } from '../wizard-step.interface';
import { ReviewStepComponent } from './review-step';
import { TravelerStepComponent } from './traveler-step';
import { TripStepComponent } from './trip-step';

/**
 * Shows saving indicator only after delay, and ensures minimum display time.
 * Prevents flickering on fast saves and avoids layout shift.
 */
const SHOW_SAVING_AFTER_MS = 300;
const MIN_DISPLAY_MS = 500;

@Component({
  selector: 'ngx-wizard-container',

  imports: [
    DatePipe,
    WizardComponent,
    WizardStepDirective,
    TravelerStepComponent,
    TripStepComponent,
    ReviewStepComponent,
    NgxSignalFormDebugger,
  ],
  templateUrl: './wizard-container.html',
  styleUrl: './wizard-container.scss',
})
export class WizardContainerComponent {
  readonly appearance = input<FormFieldAppearance>('outline');
  readonly orientation = input<FormFieldOrientation>('vertical');

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
   * Async-aware guard for step navigation events from the wizard progress
   * header. Bound via `[canNavigate]` rather than `(stepChange)` — the
   * wizard `await`s this before ever writing its `currentStep`, so the
   * `await this.#validateCurrentStep()` below is guaranteed to run (and be
   * honored) BEFORE the UI moves, unlike the old `(stepChange)` +
   * synchronous `event.preventDefault()` combination, which raced: the
   * wizard checked `defaultPrevented` synchronously, right after emitting,
   * while this handler was still suspended on its first `await` — so the
   * step change always went through regardless of validation, and the
   * store's `currentStep` (only updated below, once truly allowed) could
   * desync from the wizard's own UI-level `currentStep`. Declared as an
   * arrow-function field (not a method) so it stays bound to `this` when
   * the wizard invokes it as a plain function reference.
   */
  protected readonly guardStepNavigation: WizardCanNavigate = async (event) => {
    if (this.store.hasConfirmedBooking()) {
      return false;
    }

    const isForwardNavigation = event.toIndex > event.fromIndex;

    if (isForwardNavigation) {
      const isValid = await this.#validateCurrentStep();
      if (!isValid) {
        return false;
      }
      this.#commitCurrentStep();
    }

    this.store.goToStep(event.toStep as WizardStep, isForwardNavigation);
    return true;
  };

  protected previousStep(): void {
    if (this.store.hasConfirmedBooking()) {
      return;
    }

    this.#commitCurrentStep();
    if (this.store.goToPreviousStep()) {
      this.#pendingFocus.set(true);
    }
  }

  protected async nextStep(): Promise<void> {
    if (this.store.hasConfirmedBooking()) {
      return;
    }

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
    if (this.store.hasConfirmedBooking()) {
      return;
    }

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

  protected startNewBooking(): void {
    this.store.reset();
    this.#pendingFocus.set(true);
  }

  async #validateCurrentStep(): Promise<boolean> {
    return (await this.currentStepRef()?.validateAndFocus()) ?? false;
  }
}
