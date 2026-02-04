import { type WritableSignal } from '@angular/core';
import {
  email,
  type FieldTree,
  form,
  required,
  schema,
  validate,
} from '@angular/forms/signals';

import { type WizardData } from './stepper-form.types';

/**
 * Validation schema for the wizard form.
 * Defines all validation rules across all steps.
 */
export const wizardSchema = schema<WizardData>((path) => {
  // Step 1: Account
  required(path.email, { message: 'Email required' });
  email(path.email, { message: 'Invalid email' });
  required(path.password, { message: 'Password required' });

  // Step 2: Profile
  required(path.fullName, { message: 'Full name required' });
  required(path.phone, { message: 'Phone required' });

  // Step 3: Review
  validate(path.termsAccepted, (ctx) => {
    if (!ctx.value()) {
      return {
        kind: 'terms_required',
        message: 'You must accept the terms and conditions',
      };
    }
    return null;
  });
});

/**
 * Type alias for the wizard form field tree.
 */
export type WizardForm = FieldTree<WizardData>;

/**
 * Creates the wizard form with all validation rules.
 *
 * @param model WritableSignal containing the wizard data
 * @returns The form field tree for the wizard
 */
export function createWizardForm(
  model: WritableSignal<WizardData>,
): WizardForm {
  return form(model, wizardSchema);
}
