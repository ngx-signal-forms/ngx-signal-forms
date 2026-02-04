import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  input,
  model,
  output,
  signal,
} from '@angular/core';

import {
  WizardStepContext,
  WizardStepDirective,
} from './wizard-step.directive';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `
    <!-- Step Progress Indicator -->
    <nav class="wizard-progress" aria-label="Wizard progress">
      <ol class="wizard-steps">
        @for (step of steps(); track step.stepId(); let idx = $index) {
          <li class="wizard-step-item">
            <button
              type="button"
              class="wizard-step-button"
              [class.active]="currentStepIndex() === idx"
              [class.completed]="isStepCompleted(step.stepId())"
              [class.disabled]="!canNavigateToStep(step.stepId())"
              [attr.aria-current]="currentStepIndex() === idx ? 'step' : null"
              [disabled]="!canNavigateToStep(step.stepId())"
              (click)="goToStep(step.stepId())"
            >
              @if (isStepCompleted(step.stepId())) {
                <span class="sr-only">Completed: </span>
              }
              @if (currentStepIndex() === idx) {
                <span class="sr-only">Current: </span>
              }
              <span
                class="wizard-step-number"
                [class.bg-blue-600]="currentStepIndex() === idx"
                [class.text-white]="currentStepIndex() === idx"
              >
                @if (step.icon(); as icon) {
                  {{ icon }}
                } @else {
                  {{ idx + 1 }}
                }
              </span>
              <span class="wizard-step-label">{{ step.label() }}</span>
            </button>
          </li>
        }
      </ol>
      <div class="wizard-progress-bar">
        <div
          class="wizard-progress-fill"
          [style.width.%]="progress()"
          role="progressbar"
          [attr.aria-valuenow]="progress()"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Wizard progress"
        ></div>
      </div>
    </nav>

    <!-- Step Content (lazy rendered via NgTemplateOutlet) -->
    <div class="wizard-content">
      @if (activeStep(); as step) {
        <ng-container
          [ngTemplateOutlet]="step.templateRef"
          [ngTemplateOutletContext]="activeStepContext()"
        />
      }
    </div>

    <!-- Navigation Buttons -->
    @if (showNavigation()) {
      <div class="wizard-navigation">
        <button
          type="button"
          class="wizard-btn wizard-btn-secondary"
          [disabled]="isFirstStep()"
          (click)="previous()"
        >
          {{ previousLabel() }}
        </button>

        @if (!isLastStep()) {
          <button
            type="button"
            class="wizard-btn wizard-btn-primary"
            (click)="next()"
          >
            {{ nextLabel() }}
          </button>
        } @else {
          <button
            type="button"
            class="wizard-btn wizard-btn-success"
            (click)="submit()"
          >
            {{ submitLabel() }}
          </button>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .wizard-progress {
      margin-bottom: 1.5rem;
    }

    .wizard-steps {
      display: flex;
      justify-content: space-between;
      list-style: none;
      margin: 0 0 0.5rem;
      padding: 0;
    }

    .wizard-step-button {
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

    .wizard-step-button.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .wizard-step-button.active .wizard-step-number {
      background-color: var(--wizard-color-primary, #3b82f6);
      color: white;
    }

    .wizard-step-button.completed .wizard-step-number {
      background-color: var(--wizard-color-success, #22c55e);
      color: white;
    }

    .wizard-step-number {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background-color: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .wizard-step-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .wizard-progress-bar {
      height: 4px;
      background-color: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
    }

    .wizard-progress-fill {
      height: 100%;
      background-color: var(--wizard-color-primary, #3b82f6);
      transition: width 0.3s ease;
    }

    .wizard-content {
      min-height: 200px;
    }

    .wizard-navigation {
      display: flex;
      justify-content: space-between;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .wizard-btn {
      padding: 0.5rem 1.5rem;
      border-radius: 0.375rem;
      font-weight: 500;
      transition: background-color 0.2s;
      cursor: pointer;
    }

    .wizard-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .wizard-btn-primary {
      background-color: var(--wizard-color-primary, #3b82f6);
      color: white;
      border: none;
    }

    .wizard-btn-secondary {
      background-color: #e5e7eb;
      color: #374151;
      border: none;
    }

    .wizard-btn-success {
      background-color: var(--wizard-color-success, #22c55e);
      color: white;
      border: none;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `,
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
  readonly currentStep = model<string>('');

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

  readonly #visitedSteps = signal<Set<string>>(new Set());

  // ══════════════════════════════════════════════════════════════════════════
  // Computed Values
  // ══════════════════════════════════════════════════════════════════════════

  protected readonly currentStepIndex = computed(() => {
    const stepId = this.currentStep();
    const allSteps = this.steps();
    const idx = allSteps.findIndex((s) => s.stepId() === stepId);
    // Default to first step if not found
    return idx >= 0 ? idx : 0;
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
      isCompleted: step ? this.isStepCompleted(step.stepId()) : false,
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
