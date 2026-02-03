import { computed, linkedSignal, type Signal } from '@angular/core';
import {
  type FieldTree,
  form,
  validate,
  validateStandardSchema,
} from '@angular/forms/signals';

import { type Traveler, TravelerSchema } from '../schemas/wizard.schemas';
import type { WizardStore } from '../stores/wizard.store';

/**
 * Traveler step form type alias.
 *
 * Uses Angular Signal Forms with linkedSignal for store → form synchronization.
 * Form model is WRITABLE (via linkedSignal), but changes stay local until
 * explicitly committed to store via component's commitToStore() method.
 * This avoids effect-based continuous mirroring (signal→signal propagation).
 */
export type TravelerStepForm = FieldTree<Traveler>;

/**
 * Creates traveler step form with Zod validation via StandardSchema.
 *
 * Architecture:
 * - Store is the source of truth (owns the data)
 * - Form uses linkedSignal for reactive store → form updates
 * - Form model is writable locally but doesn't auto-sync back to store
 * - Explicit commit via component's commitToStore() before navigation/submit
 * - This avoids effect-based mirroring (per Angular best practices)
 *
 * Validation strategy:
 * - Single-field validation: Handled by Zod schema via validateStandardSchema()
 *   - Required fields, email format, passport expiry in future
 * - Cross-step validation: Handled by validate() with valueOf()
 *   - Passport 6-month rule (needs trip end date from store)
 *
 * @param store Wizard store instance
 * @param lastDepartureDate Signal returning the last trip departure date (for passport validation)
 * @returns Form FieldTree and computed helper signals
 */
export function createTravelerStepForm(
  store: InstanceType<typeof WizardStore>,
  lastDepartureDate: Signal<string | null>,
): {
  form: TravelerStepForm;
  isValid: Signal<boolean>;
  passportExpiryError: Signal<string | null>;
} {
  // Local writable model linked to store (reads from store, writes stay local)
  const model = linkedSignal<Traveler>(() => store.traveler());

  // Form with Zod validation via StandardSchema + cross-step passport validation
  const travelerForm = form(model, (path) => {
    // Zod schema via StandardSchema handles:
    // - Required fields, email format, min lengths
    // - Passport expiry must be in the future (via refine)
    validateStandardSchema(path, TravelerSchema);

    // Cross-step: Passport must be valid 6 months after last departure
    // Note: This validate() call may not propagate to errors() for external signals.
    // The passportExpiryError computed handles the display logic directly.
    validate(path.passportExpiry, (ctx) => {
      const departure = lastDepartureDate();
      if (!departure || !ctx.value()) return null;

      const expiry = new Date(ctx.value());
      const lastDep = new Date(departure);
      const sixMonthsAfter = new Date(lastDep);
      sixMonthsAfter.setMonth(sixMonthsAfter.getMonth() + 6);

      if (expiry <= sixMonthsAfter) {
        return {
          kind: 'passport_expiry',
          message: 'Passport must be valid 6 months after trip ends',
        };
      }
      return null;
    });
  });

  // Computed passport validation error for custom display
  // Note: We compute the 6-month rule directly because Angular Signal Forms
  // may not propagate external signal changes to field errors immediately
  const passportExpiryError = computed<string | null>(() => {
    const errors = travelerForm.passportExpiry().errors();

    // Check for Zod schema errors (expired passport)
    const zodError = errors.find((e) => e.message?.includes('expired'));
    if (zodError) {
      return zodError.message ?? null;
    }

    // Compute 6-month rule directly (cross-step validation)
    const departure = lastDepartureDate();
    const passportValue = model().passportExpiry;

    if (!departure || !passportValue) return null;

    const expiry = new Date(passportValue);
    const lastDep = new Date(departure);
    const sixMonthsAfter = new Date(lastDep);
    sixMonthsAfter.setMonth(sixMonthsAfter.getMonth() + 6);

    if (expiry <= sixMonthsAfter) {
      return 'Passport must be valid 6 months after trip ends';
    }

    return null;
  });

  return {
    form: travelerForm,
    isValid: computed(() => !travelerForm().invalid()),
    passportExpiryError,
  };
}
