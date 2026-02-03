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

    withComputed((store) => ({
      isFirstStep: computed(() => store.currentStep() === 'traveler'),
      isLastStep: computed(() => store.currentStep() === 'review'),
      currentStepIndex: computed(() =>
        WIZARD_STEPS.indexOf(store.currentStep()),
      ),
      progress: computed(() => {
        const idx = WIZARD_STEPS.indexOf(store.currentStep());
        return ((idx + 1) / WIZARD_STEPS.length) * 100;
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

      setDraftSaved(draftId: string): void {
        patchState(store, {
          draftId,
          lastSavedAt: new Date(),
        });
      },
    })),
  );
}
