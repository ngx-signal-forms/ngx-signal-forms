import { z } from 'zod';

// ══════════════════════════════════════════════════════════════════════════════
// BASE SCHEMAS
// ══════════════════════════════════════════════════════════════════════════════

export const RequirementSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['visa', 'vaccination', 'insurance', 'document', 'other']),
  description: z.string().min(3, 'Description required'),
  completed: z.boolean().default(false),
});

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Activity name required'),
  date: z.string().min(1, 'Date required'),
  duration: z.number().nonnegative('Duration must be non-negative').default(0),
  cost: z.number().nonnegative('Cost cannot be negative').optional(),
  notes: z.string().optional(),
  requirements: z.array(RequirementSchema),
});

// Helper to check if date is today or in the future
function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return true; // Let required() handle empty
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

// Helper to check if passport expiry is in the future (not today)
function isPassportNotExpired(dateStr: string): boolean {
  if (!dateStr) return true;
  const expiry = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry > today;
}

export const DestinationSchema = z
  .object({
    id: z.string().uuid(),
    country: z.string().min(2, 'Country required'),
    city: z.string().min(2, 'City required'),
    arrivalDate: z.string().min(1, 'Arrival date required'),
    departureDate: z.string().min(1, 'Departure date required'),
    accommodation: z.string().default(''),
    activities: z
      .array(ActivitySchema)
      .min(1, 'At least one activity required'),
  })
  .refine((data) => isFutureDate(data.arrivalDate), {
    message: 'Arrival date cannot be in the past',
    path: ['arrivalDate'],
  })
  .refine((data) => new Date(data.departureDate) > new Date(data.arrivalDate), {
    message: 'Departure date must be after arrival date',
    path: ['departureDate'],
  });

export const TravelerSchema = z
  .object({
    id: z.string().uuid(),
    firstName: z.string().min(1, 'First name required'),
    lastName: z.string().min(1, 'Last name required'),
    email: z.string().email('Valid email required'),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    passportNumber: z.string().min(6, 'Passport number required'),
    passportExpiry: z.string().min(1, 'Passport expiry required'),
    nationality: z.string().min(2, 'Nationality required'),
  })
  .refine((data) => isPassportNotExpired(data.passportExpiry), {
    message: 'Passport has expired',
    path: ['passportExpiry'],
  });

export const TripSchema = z.object({
  traveler: TravelerSchema,
  destinations: z.array(DestinationSchema).min(1, 'At least one destination'),
  confirmed: z.boolean().default(false),
});

// ══════════════════════════════════════════════════════════════════════════════
// CROSS-STEP VALIDATION HELPERS
// These require runtime data from other steps, so cannot be in Zod schemas
// ══════════════════════════════════════════════════════════════════════════════

// Activity Date Within Destination Range - used in form via validate()
export function validateActivityDates(destination: Destination): string[] {
  const errors: string[] = [];
  const arrival = new Date(destination.arrivalDate);
  const departure = new Date(destination.departureDate);

  destination.activities.forEach((activity, index) => {
    const activityDate = new Date(activity.date);
    if (activityDate < arrival || activityDate > departure) {
      errors.push(
        `Activity ${index + 1} date must be between arrival and departure`,
      );
    }
  });

  return errors;
}

// Passport 6-Month Validity Rule - requires trip data from store
// This is used in traveler-step.form.ts via validate() because
// lastDepartureDate comes from a different step (trip step)
export function TravelerWithPassportValidation(lastDepartureDate: string) {
  return TravelerSchema.refine(
    (data) => {
      const expiry = new Date(data.passportExpiry);
      const lastDeparture = new Date(lastDepartureDate);
      const sixMonthsAfter = new Date(lastDeparture);
      sixMonthsAfter.setMonth(sixMonthsAfter.getMonth() + 6);
      return expiry > sixMonthsAfter;
    },
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

// ══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

export function createEmptyRequirement(): Requirement {
  return {
    id: crypto.randomUUID(),
    type: 'other',
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
