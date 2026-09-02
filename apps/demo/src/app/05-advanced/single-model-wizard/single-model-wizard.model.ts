/**
 * Account details, gathered on step 1. Also feeds step 2's cross-step
 * validation (a work email unlocks express shipping).
 */
export interface SingleModelWizardAccount {
  fullName: string;
  email: string;
}

/**
 * Shipping details, gathered on step 2. `expressShipping` is only valid when
 * step 1's email is a work address — a cross-step rule that a single shared
 * `form()` model can express directly, with no synchronization between
 * per-step forms required.
 */
export interface SingleModelWizardShipping {
  street: string;
  city: string;
  postalCode: string;
  expressShipping: boolean;
}

/** The single `form()` model spanning every step of the wizard. */
export interface SingleModelWizardValue {
  account: SingleModelWizardAccount;
  shipping: SingleModelWizardShipping;
}

export const INITIAL_SINGLE_MODEL_WIZARD_VALUE: SingleModelWizardValue = {
  account: { fullName: '', email: '' },
  shipping: { street: '', city: '', postalCode: '', expressShipping: false },
};

/** Step identifiers, matching the `ngxWizardStep` values in the template. */
export type SingleModelWizardStepId = 'account' | 'shipping' | 'review';

export const SINGLE_MODEL_WIZARD_STEP_COUNT = 3;

/** Base shipping cost, in whole currency units. */
export const BASE_SHIPPING_COST = 25;
/** Extra cost for express shipping, in whole currency units. */
export const EXPRESS_SHIPPING_SURCHARGE = 15;
