/**
 * Data model for the stepper form.
 */
export interface WizardData {
  // Step 1: Account
  email: string;
  password: string;
  // Step 2: Profile
  fullName: string;
  phone: string;
  // Step 3: Review
  termsAccepted: boolean;
}

export const STEP_ORDER = ['account', 'profile', 'review'] as const;
export type StepId = (typeof STEP_ORDER)[number];

export const INITIAL_WIZARD_DATA: WizardData = {
  email: '',
  password: '',
  fullName: '',
  phone: '',
  termsAccepted: false,
};
