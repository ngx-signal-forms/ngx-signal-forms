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
 * Uses Angular Signal Forms with linkedSignal for store → form synchronization.
 * Form model is WRITABLE (via linkedSignal), but changes stay local until
 * explicitly committed to store via component's commitToStore() method.
 * This avoids effect-based continuous mirroring (signal→signal propagation).
 */
export type TripStepForm = FieldTree<TripStepData>;

/**
 * Creates trip step form with Zod validation via StandardSchema.
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
 *   - Required fields, min lengths, array minimums
 * - Same-object cross-field: Handled by Zod schema refine()
 *   - Arrival date must be in future
 *   - Departure date must be after arrival
 * - Nested cross-field: Handled by validate() with valueOf()
 *   - Activity date must be within destination date range
 *
 * @param store Wizard store instance
 * @returns Form FieldTree and computed helper signals
 */
export function createTripStepForm(store: InstanceType<typeof WizardStore>): {
  form: TripStepForm;
  hasDestinations: Signal<boolean>;
  isValid: Signal<boolean>;
} {
  // Local writable model linked to store (reads from store, writes stay local)
  const model = linkedSignal<TripStepData>(() => ({
    destinations: store.destinations(),
  }));

  // Form with nested array validation using StandardSchema
  const tripForm = form(model, (path) => {
    applyEach(path.destinations, (destPath) => {
      // Zod schema via StandardSchema handles:
      // - Required fields, min lengths
      // - Arrival date must be in future (via refine)
      // - Departure > arrival (via refine)
      validateStandardSchema(destPath, DestinationSchema);

      applyEach(destPath.activities, (actPath) => {
        // Zod schema via StandardSchema for activity fields
        validateStandardSchema(actPath, ActivitySchema);

        // Cross-field: activity date within destination date range
        // This cannot be in Zod schema because it needs parent destination dates
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
    hasDestinations: computed(() => model().destinations.length > 0),
    isValid: computed(
      () => !tripForm().invalid() && model().destinations.length > 0,
    ),
  };
}
