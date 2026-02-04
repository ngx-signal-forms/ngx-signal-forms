export interface WizardStepInterface {
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
