import { computed, linkedSignal, type Signal } from '@angular/core';
import {
  applyEach,
  type FieldTree,
  form,
  validateStandardSchema,
} from '@angular/forms/signals';
import { requiredFromStandardSchema } from '@ngx-signal-forms/toolkit';

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
 * Typed values reach the store's draft (so autosave sees them) and are
 * committed with the step on Next.
 */
export type TripStepForm = FieldTree<TripStepData>;

/**
 * Creates trip step form with Zod validation via StandardSchema.
 *
 * Architecture:
 * - Store owns committed state (destinations) and the typed draft
 *   (destinationsDraft)
 * - Form uses local linkedSignal (reads the draft, writes locally)
 * - store.syncDestinationsDraft() copies typed values into the draft
 * - Commit via store.setDestinations() marks the step as finished
 *
 * Note: Angular Signal Forms requires WritableSignal, not DeepSignal from
 * withLinkedState. So we create a local linkedSignal for form binding.
 *
 * Validation strategy:
 * - Single-field: Zod schemas via validateStandardSchema()
 * - Same-object cross-field: Zod schema refine() for dates
 * - Nested cross-field: Zod schema superRefine() for activity date within
 *   destination range (shared with the wizard store)
 *
 * @param store Wizard store instance
 */
export function createTripStepForm(store: InstanceType<typeof WizardStore>): {
  form: TripStepForm;
  model: Signal<TripStepData>;
  hasDestinations: Signal<boolean>;
  isValid: Signal<boolean>;
} {
  // Local linkedSignal: reads the store's draft, writes stay local until the
  // store method below copies them back. The write-back changes the draft, which
  // is the source. When the draft is the array the model already holds, keep the
  // model: a new wrapper would reset the fields the user types in.
  // The traveler form needs no such check: its model IS the draft object.
  // This model wraps the array in `{ destinations }`, so it needs a reference check.
  const model = linkedSignal<Destination[], TripStepData>({
    source: store.destinationsDraft,
    computation: (destinations, previous) =>
      previous?.value.destinations === destinations
        ? previous.value
        : { destinations },
  });
  store.syncDestinationsDraft(() => model().destinations);

  // Form with nested array validation
  const tripForm = form(model, (path) => {
    applyEach(path.destinations, (destPath) => {
      validateStandardSchema(destPath, DestinationSchema);

      // See traveler-step.form.ts / issue #118: `validateStandardSchema`
      // never surfaces required-ness on its own, so wire it explicitly for
      // the fields that carry a required marker in the destination card.
      requiredFromStandardSchema(destPath.country, DestinationSchema);
      requiredFromStandardSchema(destPath.city, DestinationSchema);
      requiredFromStandardSchema(destPath.arrivalDate, DestinationSchema);
      requiredFromStandardSchema(destPath.departureDate, DestinationSchema);

      applyEach(destPath.activities, (actPath) => {
        validateStandardSchema(actPath, ActivitySchema);

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
