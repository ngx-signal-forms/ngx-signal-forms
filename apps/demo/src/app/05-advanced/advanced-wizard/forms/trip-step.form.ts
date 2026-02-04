import { computed, linkedSignal, type Signal } from '@angular/core';
import {
  applyEach,
  type FieldTree,
  form,
  validate,
  validateStandardSchema,
} from '@angular/forms/signals';

import {
  ActivitySchema,
  type Destination,
  DestinationSchema,
  RequirementSchema,
} from '../schemas/wizard.schemas';
import type { WizardStore } from '../stores/wizard.store';

/** Trip step data structure */
export type TripStepData = {
  destinations: Destination[];
};

/**
 * Trip step form type alias.
 *
 * Form uses local linkedSignal for writable binding to Angular Signal Forms.
 * Changes stay local until committed via store.setDestinations().
 */
export type TripStepForm = FieldTree<TripStepData>;

/**
 * Creates trip step form with Zod validation via StandardSchema.
 *
 * Architecture:
 * - Store owns committed state (destinations)
 * - Form uses local linkedSignal (reads from store, writes locally)
 * - Commit via store.setDestinations() transfers local changes to store
 *
 * Note: Angular Signal Forms requires WritableSignal, not DeepSignal from
 * withLinkedState. So we create a local linkedSignal for form binding.
 *
 * Validation strategy:
 * - Single-field: Zod schemas via validateStandardSchema()
 * - Same-object cross-field: Zod schema refine() for dates
 * - Nested cross-field: validate() for activity date within destination range
 *
 * @param store Wizard store instance
 */
export function createTripStepForm(store: InstanceType<typeof WizardStore>): {
  form: TripStepForm;
  model: Signal<TripStepData>;
  hasDestinations: Signal<boolean>;
  isValid: Signal<boolean>;
} {
  // Local linkedSignal: reads from store's draft, writes stay local
  // Note: We read from destinationsDraft since that's what the user edits
  const model = linkedSignal<TripStepData>(() => ({
    destinations: store.destinationsDraft(),
  }));

  // Form with nested array validation
  const tripForm = form(model, (path) => {
    applyEach(path.destinations, (destPath) => {
      validateStandardSchema(destPath, DestinationSchema);

      applyEach(destPath.activities, (actPath) => {
        validateStandardSchema(actPath, ActivitySchema);

        // Cross-field: activity date within destination date range
        validate(actPath.date, (ctx) => {
          const arrival = ctx.valueOf(destPath.arrivalDate);
          const departure = ctx.valueOf(destPath.departureDate);
          const activityDate = ctx.value();

          if (!arrival || !departure || !activityDate) return null;

          const arrDate = new Date(arrival);
          const depDate = new Date(departure);
          const actDate = new Date(activityDate);

          if (actDate < arrDate || actDate > depDate) {
            return {
              kind: 'activity_date_range',
              message: 'Activity date must be within destination date range',
            };
          }
          return null;
        });

        applyEach(actPath.requirements, (reqPath) => {
          validateStandardSchema(reqPath, RequirementSchema);
        });
      });
    });
  });

  return {
    form: tripForm,
    model,
    hasDestinations: computed(() => model().destinations.length > 0),
    isValid: computed(
      () => !tripForm().invalid() && model().destinations.length > 0,
    ),
  };
}
