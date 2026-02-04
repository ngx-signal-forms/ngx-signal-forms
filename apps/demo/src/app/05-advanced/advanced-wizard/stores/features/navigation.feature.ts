import { computed } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

export type WizardStep = 'traveler' | 'trip' | 'review';

type NavigationState = {
  currentStep: WizardStep;
  visitedSteps: WizardStep[];
  draftId: string | null;
  lastSavedAt: Date | null;
};

export const WIZARD_STEPS: WizardStep[] = ['traveler', 'trip', 'review'];

/**
 * Navigation feature for wizard step management.
 * Does NOT handle validation - that's computed in the main store
 * from actual form/data state (avoiding effects entirely).
 */
export function withWizardNavigation() {
  return signalStoreFeature(
    withState<NavigationState>({
      currentStep: 'traveler',
      visitedSteps: ['traveler'],
      draftId: null,
      lastSavedAt: null,
    }),

    // First computed block: base signals from state
    withComputed((store) => ({
      currentStepIndex: computed(() =>
        WIZARD_STEPS.indexOf(store.currentStep()),
      ),
      isFirstStep: computed(() => store.currentStep() === WIZARD_STEPS[0]),
      isLastStep: computed(
        () => store.currentStep() === WIZARD_STEPS[WIZARD_STEPS.length - 1],
      ),
    })),

    // Second computed block: derived from currentStepIndex
    withComputed((store) => ({
      progress: computed(
        () => ((store.currentStepIndex() + 1) / WIZARD_STEPS.length) * 100,
      ),
      previousStepId: computed(() => {
        const idx = store.currentStepIndex();
        return idx > 0 ? WIZARD_STEPS[idx - 1] : null;
      }),
      nextStepId: computed(() => {
        const idx = store.currentStepIndex();
        return idx < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[idx + 1] : null;
      }),
    })),

    withMethods((store) => ({
      /**
       * Navigate to a step.
       * Always allows navigation to previously visited steps.
       * For new steps, requires explicit permission via canNavigateToNew param.
       */
      goToStep(step: WizardStep, canNavigateToNew = false): void {
        if (store.visitedSteps().includes(step) || canNavigateToNew) {
          patchState(store, {
            currentStep: step,
            visitedSteps: [...new Set([...store.visitedSteps(), step])],
          });
        }
      },

      /**
       * Navigate to previous step. Always allowed if not on first step.
       */
      goToPreviousStep(): boolean {
        const prev = store.previousStepId();
        if (prev) {
          patchState(store, { currentStep: prev });
          return true;
        }
        return false;
      },

      /**
       * Navigate to next step. Requires canNavigateToNew for unvisited steps.
       */
      goToNextStep(canNavigateToNew = false): boolean {
        const next = store.nextStepId();
        if (next && (store.visitedSteps().includes(next) || canNavigateToNew)) {
          patchState(store, {
            currentStep: next,
            visitedSteps: [...new Set([...store.visitedSteps(), next])],
          });
          return true;
        }
        return false;
      },

      setDraftSaved(draftId: string): void {
        patchState(store, {
          draftId,
          lastSavedAt: new Date(),
        });
      },
    })),
  );
}
