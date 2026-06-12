import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  Component,
  computed,
  contentChildren,
  input,
  model,
  output,
  signal,
} from '@angular/core';

import { WizardStepContext, WizardStepDirective } from './wizard-step';

/**
 * Event emitted when attempting to navigate between steps.
 */
export interface WizardNavigationEvent {
  /** The step being navigated from. */
  fromStep: string;
  /** The step being navigated to. */
  toStep: string;
  /** The index of the step being navigated from. */
  fromIndex: number;
  /** The index of the step being navigated to. */
  toIndex: number;
  /** Call to prevent navigation (e.g., if validation fails). */
  preventDefault: () => void;
  /** Whether preventDefault was called. */
  defaultPrevented: boolean;
}

/**
 * Event emitted when the wizard is submitted.
 */
export interface WizardSubmitEvent {
  /** All step IDs in order. */
  steps: string[];
  /** Steps marked as completed. */
  completedSteps: string[];
}

/**
 * Reusable wizard component with template-based step projection.
 *
 * Uses `ng-template` with `NgTemplateOutlet` for lazy step rendering.
 * Only the active step's content is instantiated, reducing initial load
 * and enabling `@defer` within step templates.
 *
 * @example
 * ```html
 * <ngx-wizard
 *   [(currentStep)]="currentStep"
 *   [completedSteps]="completedSteps()"
 *   (stepChange)="onStepChange($event)"
 *   (wizardSubmit)="onSubmit($event)"
 * >
 *   <ng-template wizardStep="step1" label="Personal Info">
 *     <app-personal-info-form />
 *   </ng-template>
 *
 *   <ng-template wizardStep="step2" label="Address">
 *     @defer {
 *       <app-address-form />
 *     }
 *   </ng-template>
 *
 *   <ng-template wizardStep="review" label="Review">
 *     <app-review />
 *   </ng-template>
 * </ngx-wizard>
 * ```
 */
@Component({
  selector: 'ngx-wizard',

  imports: [NgTemplateOutlet],
  templateUrl: './wizard.html',
  styleUrl: './wizard.scss',
})
export class WizardComponent {
  // ══════════════════════════════════════════════════════════════════════════
  // Content Children
  // ══════════════════════════════════════════════════════════════════════════

  /** All wizard step directives projected via ng-template. */
  protected readonly steps = contentChildren(WizardStepDirective);

  // ══════════════════════════════════════════════════════════════════════════
  // Inputs
  // ══════════════════════════════════════════════════════════════════════════

  /** Current active step ID (two-way bindable). */
  readonly currentStep = model('');

  /** Array of step IDs that are marked as completed. */
  readonly completedSteps = input<string[]>([]);

  /** Whether to show the built-in navigation buttons. */
  readonly showNavigation = input(true, { transform: booleanAttribute });

  /** Label for the previous button. */
  readonly previousLabel = input('Previous');

  /** Label for the next button. */
  readonly nextLabel = input('Next');

  /** Label for the submit button. */
  readonly submitLabel = input('Submit');

  /** Whether users can navigate to any visited step by clicking. */
  readonly allowStepClick = input(true, { transform: booleanAttribute });

  // ══════════════════════════════════════════════════════════════════════════
  // Outputs
  // ══════════════════════════════════════════════════════════════════════════

  /** Emitted before navigating to a different step. Can be prevented. */
  readonly stepChange = output<WizardNavigationEvent>();

  /** Emitted when the submit button is clicked on the last step. */
  readonly wizardSubmit = output<WizardSubmitEvent>();

  // ══════════════════════════════════════════════════════════════════════════
  // Internal State
  // ══════════════════════════════════════════════════════════════════════════

  readonly #visitedSteps = signal(new Set());

  // ══════════════════════════════════════════════════════════════════════════
  // Computed Values
  // ══════════════════════════════════════════════════════════════════════════

  protected readonly currentStepIndex = computed(() => {
    const stepId = this.currentStep();
    const allSteps = this.steps();
    const idx = allSteps.findIndex((s) => s.stepId() === stepId);
    // Default to first step if not found
    return Math.max(idx, 0);
  });

  protected readonly activeStep = computed(() => {
    const allSteps = this.steps();
    const idx = this.currentStepIndex();
    return allSteps[idx];
  });

  protected readonly activeStepContext = computed<WizardStepContext>(() => {
    const idx = this.currentStepIndex();
    const step = this.activeStep();
    return {
      $implicit: idx,
      stepNumber: idx + 1,
      isActive: true,
      isCompleted: this.isStepCompleted(step.stepId()),
      canNavigate: true,
    };
  });

  protected readonly progress = computed(() => {
    const allSteps = this.steps();
    if (allSteps.length === 0) return 0;
    // Progress based on completed steps
    const completed = this.completedSteps().length;
    return Math.round((completed / allSteps.length) * 100);
  });

  protected readonly isFirstStep = computed(
    () => this.currentStepIndex() === 0,
  );

  protected readonly isLastStep = computed(() => {
    const allSteps = this.steps();
    return this.currentStepIndex() === allSteps.length - 1;
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Public Methods
  // ══════════════════════════════════════════════════════════════════════════

  /** Navigate to a specific step by ID. */
  goToStep(stepId: string): void {
    if (!this.canNavigateToStep(stepId)) {
      return;
    }

    const fromStep = this.currentStep();
    const fromIndex = this.currentStepIndex();
    const toIndex = this.steps().findIndex((s) => s.stepId() === stepId);

    if (toIndex < 0 || stepId === fromStep) {
      return;
    }

    const event = this.#createNavigationEvent(
      fromStep,
      stepId,
      fromIndex,
      toIndex,
    );
    this.stepChange.emit(event);

    if (!event.defaultPrevented) {
      this.#visitedSteps.update((visited) => new Set([...visited, stepId]));
      this.currentStep.set(stepId);
    }
  }

  /** Navigate to the next step. */
  next(): void {
    const allSteps = this.steps();
    const nextIndex = this.currentStepIndex() + 1;
    if (nextIndex < allSteps.length) {
      this.goToStep(allSteps[nextIndex].stepId());
    }
  }

  /** Navigate to the previous step. */
  previous(): void {
    const allSteps = this.steps();
    const prevIndex = this.currentStepIndex() - 1;
    if (prevIndex >= 0) {
      this.goToStep(allSteps[prevIndex].stepId());
    }
  }

  /** Submit the wizard. */
  submit(): void {
    const allSteps = this.steps();
    this.wizardSubmit.emit({
      steps: allSteps.map((s) => s.stepId()),
      completedSteps: this.completedSteps(),
    });
  }

  /** Check if a step is marked as completed. */
  isStepCompleted(stepId: string): boolean {
    return this.completedSteps().includes(stepId);
  }

  /** Check if user can navigate to a step (visited or current). */
  canNavigateToStep(stepId: string): boolean {
    if (!this.allowStepClick()) {
      return false;
    }

    return (
      this.currentStep() === stepId ||
      this.#visitedSteps().has(stepId) ||
      this.isStepCompleted(stepId)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private Methods
  // ══════════════════════════════════════════════════════════════════════════

  #createNavigationEvent(
    fromStep: string,
    toStep: string,
    fromIndex: number,
    toIndex: number,
  ): WizardNavigationEvent {
    let defaultPrevented = false;
    return {
      fromStep,
      toStep,
      fromIndex,
      toIndex,
      preventDefault: () => {
        defaultPrevented = true;
      },
      get defaultPrevented() {
        return defaultPrevented;
      },
    };
  }
}
