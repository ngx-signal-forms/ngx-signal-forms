import {
  booleanAttribute,
  Directive,
  inject,
  input,
  TemplateRef,
} from '@angular/core';

/**
 * Context provided to wizard step templates.
 */
export interface WizardStepContext {
  /** Zero-based index of this step. */
  $implicit: number;
  /** One-based step number for display. */
  stepNumber: number;
  /** Whether this step is currently active. */
  isActive: boolean;
  /** Whether this step has been completed. */
  isCompleted: boolean;
  /** Whether the user can navigate to this step. */
  canNavigate: boolean;
}

/**
 * Directive to define a wizard step using ng-template.
 * Only the active step's template is rendered, enabling lazy instantiation.
 *
 * @example
 * ```html
 * <ngx-wizard>
 *   <ng-template ngxWizardStep="traveler" label="Traveler Info">
 *     <!-- Content only instantiated when this step is active -->
 *     <ngx-traveler-form />
 *   </ng-template>
 *
 *   <ng-template ngxWizardStep="trip" label="Trip Details">
 *     @defer {
 *       <ngx-trip-form />
 *     }
 *   </ng-template>
 * </ngx-wizard>
 * ```
 */
@Directive({
  selector: '[ngxWizardStep]',
})
export class WizardStepDirective {
  readonly templateRef = inject<TemplateRef<WizardStepContext>>(TemplateRef);

  /** Unique identifier for this step. */
  readonly stepId = input.required<string>({ alias: 'ngxWizardStep' });

  /** Display label for the step indicator. */
  readonly label = input.required<string>();

  /** Whether this step can be skipped (optional step). */
  readonly optional = input(false, { transform: booleanAttribute });

  /** Icon to display instead of step number (optional). */
  readonly icon = input<string>();

  static ngTemplateContextGuard(
    _dir: WizardStepDirective,
    _ctx: unknown,
  ): _ctx is WizardStepContext {
    return true;
  }
}
