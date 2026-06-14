import type { FieldTree } from '@angular/forms/signals';

export interface WizardStepInterface {
  /**
   * The step's Signal Forms field tree, surfaced so the wizard can render a
   * live form-state debugger for the active step. Optional because read-only
   * summary steps (e.g. the review step) have no editable form tree.
   */
  readonly formTree?: FieldTree<unknown>;

  /**
   * Validates the step and focuses the first invalid field.
   * @returns Promise<boolean> true if valid, false otherwise.
   */
  validateAndFocus(): Promise<boolean>;

  /**
   * Commits the form data to the store.
   */
  commitToStore(): void;

  /**
   * Focuses the main heading of the step for accessibility.
   */
  focusHeading(): void;
}
