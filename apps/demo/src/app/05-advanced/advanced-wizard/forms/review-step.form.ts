import { computed, Signal } from '@angular/core';
import { z } from 'zod';

import { Destination, Traveler } from '../schemas/wizard.schemas';

// ══════════════════════════════════════════════════════════════════════════════
// DISPLAY DATA SCHEMAS (Zod-first approach for type inference)
// ══════════════════════════════════════════════════════════════════════════════

const ActivityDisplaySchema = z.object({
  name: z.string(),
  date: z.string(),
  duration: z.string(),
  cost: z.string(),
  requirementCount: z.number(),
});

/* eslint-disable @typescript-eslint/no-unused-vars */
const DestinationDisplaySchema = z.object({
  name: z.string(),
  dates: z.string(),
  accommodation: z.string(),
  activityCount: z.number(),
  activities: z.array(ActivityDisplaySchema),
});

const TravelerDisplaySchema = z.object({
  fullName: z.string(),
  email: z.string(),
  nationality: z.string(),
  age: z.number().nullable(),
  hasPassport: z.boolean(),
  passportValid: z.boolean(),
});

const ReviewStepFormSchema = z.object({
  travelerDisplay: z.custom<Signal<TravelerDisplayData>>(),
  destinationsDisplay: z.custom<Signal<DestinationDisplayData[]>>(),
  totalActivities: z.custom<Signal<number>>(),
  totalRequirements: z.custom<Signal<number>>(),
  dateRange: z.custom<Signal<string>>(),
});
/* eslint-enable @typescript-eslint/no-unused-vars */

// ══════════════════════════════════════════════════════════════════════════════
// TYPE INFERENCE FROM SCHEMAS
// ══════════════════════════════════════════════════════════════════════════════

export type ActivityDisplayData = z.infer<typeof ActivityDisplaySchema>;
export type DestinationDisplayData = z.infer<typeof DestinationDisplaySchema>;
export type TravelerDisplayData = z.infer<typeof TravelerDisplaySchema>;
export type ReviewStepForm = z.infer<typeof ReviewStepFormSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════════════════════

function formatDateRange(start: string, end: string): string {
  if (!start || !end) return 'Dates not set';
  const startDate = new Date(start).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const endDate = new Date(end).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startDate} - ${endDate}`;
}

/**
 * Creates a read-only review form that computes display data from trip summary.
 */
export function createReviewStepForm(
  traveler: Signal<Traveler>,
  destinations: Signal<Destination[]>,
): ReviewStepForm {
  const travelerDisplay = computed<TravelerDisplayData>(() => {
    const t = traveler();
    // Calculate age from dateOfBirth if available
    let age: number | null = null;
    if (t.dateOfBirth) {
      const birthDate = new Date(t.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
    }

    return {
      fullName: `${t.firstName} ${t.lastName}`.trim() || 'Not provided',
      email: t.email || 'Not provided',
      nationality: t.nationality || 'Not provided',
      age,
      hasPassport: Boolean(t.passportNumber),
      passportValid: t.passportExpiry
        ? new Date(t.passportExpiry) > new Date()
        : false,
    };
  });

  const destinationsDisplay = computed<DestinationDisplayData[]>(() =>
    destinations().map((d) => ({
      name:
        d.city && d.country ? `${d.city}, ${d.country}` : 'Unnamed destination',
      dates: formatDateRange(d.arrivalDate, d.departureDate),
      accommodation: d.accommodation || 'Not specified',
      activityCount: d.activities.length,
      activities: d.activities.map((a) => ({
        name: a.name || 'Unnamed activity',
        date: a.date
          ? new Date(a.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : 'No date',
        duration: a.duration ? `${a.duration} hours` : 'Not specified',
        cost: a.cost ? `$${a.cost}` : 'Free',
        requirementCount: a.requirements.length,
      })),
    })),
  );

  const totalActivities = computed(() =>
    destinations().reduce((sum, d) => sum + d.activities.length, 0),
  );

  const totalRequirements = computed(() =>
    destinations().reduce(
      (sum, d) =>
        sum + d.activities.reduce((aSum, a) => aSum + a.requirements.length, 0),
      0,
    ),
  );

  const dateRange = computed(() => {
    const dests = destinations();
    if (dests.length === 0) return 'No destinations';

    const arrivals = dests
      .map((d) => d.arrivalDate)
      .filter(Boolean)
      .sort();
    const departures = dests
      .map((d) => d.departureDate)
      .filter(Boolean)
      .sort();

    if (arrivals.length === 0 || departures.length === 0) {
      return 'Dates incomplete';
    }

    return formatDateRange(arrivals[0], departures[departures.length - 1]);
  });

  return {
    travelerDisplay,
    destinationsDisplay,
    totalActivities,
    totalRequirements,
    dateRange,
  };
}
