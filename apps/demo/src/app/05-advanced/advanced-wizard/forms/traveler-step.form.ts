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
 * Form uses local linkedSignal for writable binding to Angular Signal Forms.
 * Changes stay local until committed via store.commitTraveler().
 */
export type TravelerStepForm = FieldTree<Traveler>;

/**
 * Creates traveler step form with Zod validation via StandardSchema.
 *
 * Architecture:
 * - Store owns committed state (traveler)
 * - Form uses local linkedSignal (reads from store, writes locally)
 * - Commit via store.setTraveler() transfers local changes to store
 *
 * Note: Angular Signal Forms requires WritableSignal, not DeepSignal from
 * withLinkedState. So we create a local linkedSignal for form binding.
 *
 * Validation strategy:
 * - Single-field: Zod schema via validateStandardSchema()
 * - Cross-step: validate() for passport 6-month rule
 *
 * @param store Wizard store instance
 * @param lastDepartureDate Signal for cross-step passport validation
 */
export function createTravelerStepForm(
  store: InstanceType<typeof WizardStore>,
  lastDepartureDate: Signal<string | null>,
): {
  form: TravelerStepForm;
  model: Signal<Traveler>;
  isValid: Signal<boolean>;
  passportExpiryError: Signal<string | null>;
} {
  // Local linkedSignal: reads from store's committed state, writes stay local
  const model = linkedSignal<Traveler>(() => store.traveler());

  // Form with Zod + cross-step passport validation
  const travelerForm = form(model, (path) => {
    validateStandardSchema(path, TravelerSchema);

    // Cross-step: Passport must be valid 6 months after last departure
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

  // Computed passport validation error for display
  const passportExpiryError = computed<string | null>(() => {
    const errors = travelerForm.passportExpiry().errors();
    const zodError = errors.find((e) => e.message?.includes('expired'));
    if (zodError) return zodError.message ?? null;

    // Compute 6-month rule directly
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
    model,
    isValid: computed(
      () => !travelerForm().invalid() && passportExpiryError() === null,
    ),
    passportExpiryError,
  };
}
