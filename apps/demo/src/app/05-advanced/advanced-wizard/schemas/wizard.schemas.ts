import { Temporal } from 'temporal-polyfill';
import { z } from 'zod';

// ══════════════════════════════════════════════════════════════════════════════
// BASE SCHEMAS
// ══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_REQUIREMENT_TYPE = 'other' as const;

export const RequirementSchema = z.object({
  id: z.uuid(),
  type: z.enum(['visa', 'vaccination', 'insurance', 'document', 'other']),
  description: z.string().min(3, 'Description required'),
  completed: z.boolean().default(false),
});

export const ActivitySchema = z.object({
  id: z.uuid(),
  name: z.string().min(2, 'Activity name required'),
  date: z.string().min(1, 'Date required'),
  duration: z.number().nonnegative('Duration must be non-negative').default(0),
  cost: z.number().nonnegative('Cost cannot be negative').optional(),
  notes: z.string().optional(),
  requirements: z.array(RequirementSchema),
});

/**
 * The calendar date of a date or date-time string. Only the `YYYY-MM-DD` part
 * counts, so a time or offset never moves the day.
 */
export function toPlainDate(value: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(value.slice(0, 10));
}

/**
 * Like {@link toPlainDate}, but returns null for an empty or malformed value.
 * The schemas use it so a half-typed date fails its rule instead of throwing.
 */
function tryPlainDate(value: string): Temporal.PlainDate | null {
  try {
    return toPlainDate(value);
  } catch {
    return null;
  }
}

/**
 * Compares two date strings by calendar date: negative, zero or positive.
 * Null when either side is not a valid date.
 */
function compareDateStrings(a: string, b: string): number | null {
  const first = tryPlainDate(a);
  const second = tryPlainDate(b);
  return first && second ? Temporal.PlainDate.compare(first, second) : null;
}

/** Today's calendar date in the local time zone. */
export function todayPlainDate(): Temporal.PlainDate {
  return Temporal.Now.plainDateISO();
}

/**
 * A passport that expires today or earlier counts as expired. A malformed
 * expiry counts as expired too.
 */
export function isPassportExpired(passportExpiry: string): boolean {
  const expiry = tryPlainDate(passportExpiry);
  return !expiry || Temporal.PlainDate.compare(expiry, todayPlainDate()) <= 0;
}

// Helper to check if date is today or in the future
function isFutureDate(dateStr: string): boolean {
  // Empty or malformed: not applicable yet. The required rule reports it.
  const date = tryPlainDate(dateStr);
  return !date || Temporal.PlainDate.compare(date, todayPlainDate()) >= 0;
}

// Empty is valid here: the required rule reports it.
function isEmptyOrValidDate(value: string): boolean {
  return value === '' || tryPlainDate(value) !== null;
}

export const DestinationSchema = z
  .object({
    id: z.uuid(),
    country: z.string().min(2, 'Country required'),
    city: z.string().min(2, 'City required'),
    arrivalDate: z
      .string()
      .min(1, 'Arrival date required')
      .refine(isEmptyOrValidDate, 'Enter a valid date'),
    departureDate: z
      .string()
      .min(1, 'Departure date required')
      .refine(isEmptyOrValidDate, 'Enter a valid date'),
    accommodation: z.string().default(''),
    activities: z
      .array(ActivitySchema)
      .min(1, 'At least one activity required'),
  })
  .refine((data) => isFutureDate(data.arrivalDate), {
    message: 'Arrival date cannot be in the past',
    path: ['arrivalDate'],
  })
  .refine(
    (data) => {
      // Not applicable until both dates parse.
      const order = compareDateStrings(data.departureDate, data.arrivalDate);
      return order === null || order > 0;
    },
    {
      message: 'Departure date must be after arrival date',
      path: ['departureDate'],
    },
  )
  // Nested cross-field rule. The issue lands on the activity's date field, so
  // the trip form (validateStandardSchema) and the wizard store share it.
  .superRefine((data, ctx) => {
    const { arrivalDate, departureDate } = data;
    if (!arrivalDate || !departureDate) return;

    const arrival = tryPlainDate(arrivalDate);
    const departure = tryPlainDate(departureDate);
    if (!arrival || !departure) return;

    data.activities.forEach((activity, index) => {
      if (!activity.date) return;

      const activityDate = tryPlainDate(activity.date);
      if (!activityDate) return;
      if (
        Temporal.PlainDate.compare(activityDate, arrival) < 0 ||
        Temporal.PlainDate.compare(activityDate, departure) > 0
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Activity date must be within destination date range',
          path: ['activities', index, 'date'],
        });
      }
    });
  });

export const TravelerSchema = z
  .object({
    id: z.uuid(),
    firstName: z.string().min(1, 'First name required'),
    lastName: z.string().min(1, 'Last name required'),
    email: z.email('Enter a valid email address'),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    passportNumber: z.string().min(6, 'Passport number required'),
    passportExpiry: z.string().min(1, 'Passport expiry required'),
    nationality: z.string().min(2, 'Nationality required'),
  })
  .refine(
    (data) => !data.passportExpiry || !isPassportExpired(data.passportExpiry),
    {
      message: 'Passport has expired',
      path: ['passportExpiry'],
    },
  );

export const TripSchema = z.object({
  traveler: TravelerSchema,
  destinations: z.array(DestinationSchema).min(1, 'At least one destination'),
  confirmed: z.boolean().default(false),
});

// ══════════════════════════════════════════════════════════════════════════════
// CROSS-STEP VALIDATION HELPERS
// These require runtime data from other steps, so cannot be in Zod schemas
// ══════════════════════════════════════════════════════════════════════════════

/** The latest non-empty departure date of the trips, or null when none is set. */
export function lastDepartureDate(
  destinations: readonly Pick<Destination, 'departureDate'>[],
): string | null {
  const departures = destinations
    .map((d) => d.departureDate)
    .filter(Boolean)
    .map(tryPlainDate)
    .filter((date) => date !== null);
  if (departures.length === 0) return null;
  const latest = departures.reduce((a, b) =>
    Temporal.PlainDate.compare(a, b) >= 0 ? a : b,
  );
  return latest.toString();
}

/**
 * The passport must stay valid for six months after the last departure. True
 * when the rule does not apply yet (no expiry or no departure). Temporal
 * clamps the day to the last day of the target month, so 31 August plus six
 * months is 28 February, not 3 March.
 */
export function isPassportValidForDeparture(
  passportExpiry: string,
  departure: string | null,
): boolean {
  if (!departure || !passportExpiry) return true;
  const departureDate = tryPlainDate(departure);
  const expiry = tryPlainDate(passportExpiry);
  if (!departureDate || !expiry) return false;
  return (
    Temporal.PlainDate.compare(expiry, departureDate.add({ months: 6 })) > 0
  );
}

// Passport 6-Month Validity Rule - requires trip data from store
// This is used in traveler-step.form.ts via validate() because
// lastDepartureDate comes from a different step (trip step)
export function TravelerWithPassportValidation(lastDepartureDate: string) {
  return TravelerSchema.refine(
    (data) =>
      isPassportValidForDeparture(data.passportExpiry, lastDepartureDate),
    {
      message: 'Passport must be valid for 6 months after your trip ends',
      path: ['passportExpiry'],
    },
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TYPE INFERENCE
// ══════════════════════════════════════════════════════════════════════════════

export type Requirement = z.infer<typeof RequirementSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type Destination = z.infer<typeof DestinationSchema>;
export type Traveler = z.infer<typeof TravelerSchema>;
export type Trip = z.infer<typeof TripSchema>;

/** The traveler and destinations of a wizard. */
export type WizardStepData = Pick<Trip, 'traveler' | 'destinations'>;

/**
 * The auto-saved draft, as the draft API stores it.
 *
 * `traveler` and `destinations` hold the steps finished with Next.
 * `inProgress` holds what the user has typed so far, finished or not. It is
 * optional, so a draft saved without it still loads.
 */
export type WizardDraft = WizardStepData & {
  inProgress?: WizardStepData;
};

// ══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

export function createEmptyRequirement(): Requirement {
  return {
    id: crypto.randomUUID(),
    type: DEFAULT_REQUIREMENT_TYPE,
    description: '',
    completed: false,
  };
}

export function createEmptyActivity(): Activity {
  return {
    id: crypto.randomUUID(),
    name: '',
    date: '',
    duration: 0,
    cost: undefined,
    requirements: [createEmptyRequirement()],
  };
}

export function createEmptyDestination(): Destination {
  return {
    id: crypto.randomUUID(),
    country: '',
    city: '',
    arrivalDate: '',
    departureDate: '',
    accommodation: '',
    activities: [createEmptyActivity()],
  };
}

export function createEmptyTraveler(): Traveler {
  return {
    id: crypto.randomUUID(),
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    passportNumber: '',
    passportExpiry: '',
    nationality: '',
  };
}
