import { computed, Signal } from '@angular/core';

import {
  Destination,
  isPassportValidForDeparture,
  lastDepartureDate,
  Traveler,
} from '../schemas/wizard.schemas';

type ReadonlyRequirement = Readonly<
  Destination['activities'][number]['requirements'][number]
>;
type ReadonlyActivity = Readonly<
  Omit<Destination['activities'][number], 'requirements'>
> & {
  readonly requirements: readonly ReadonlyRequirement[];
};
type ReadonlyDestination = Readonly<Omit<Destination, 'activities'>> & {
  readonly activities: readonly ReadonlyActivity[];
};
type ReadonlyTraveler = Readonly<Traveler>;

// ══════════════════════════════════════════════════════════════════════════════
// DISPLAY DATA TYPES
// ══════════════════════════════════════════════════════════════════════════════

export type ActivityDisplayData = {
  name: string;
  date: string;
  duration: string;
  cost: string;
  requirementCount: number;
};

export type DestinationDisplayData = {
  name: string;
  dates: string;
  accommodation: string;
  activityCount: number;
  activities: ActivityDisplayData[];
};

export type TravelerDisplayData = {
  fullName: string;
  email: string;
  nationality: string;
  age: number | null;
  hasPassport: boolean;
  passportValid: boolean;
};

export type ReviewStepForm = {
  travelerDisplay: Signal<TravelerDisplayData>;
  destinationsDisplay: Signal<DestinationDisplayData[]>;
  totalActivities: Signal<number>;
  totalRequirements: Signal<number>;
  dateRange: Signal<string>;
};

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
/* oxlint-disable @typescript-eslint/prefer-readonly-parameter-types -- Angular Signal inputs are callable reactive handles rather than readonly data containers. */
export function createReviewStepForm(
  traveler: Signal<ReadonlyTraveler>,
  destinations: Signal<readonly ReadonlyDestination[]>,
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
      passportValid:
        Boolean(t.passportExpiry) &&
        new Date(t.passportExpiry) > new Date() &&
        isPassportValidForDeparture(
          t.passportExpiry,
          lastDepartureDate(destinations()),
        ),
    };
  });

  const destinationsDisplay = computed<DestinationDisplayData[]>(() =>
    destinations().map((d: ReadonlyDestination) => ({
      name:
        d.city && d.country ? `${d.city}, ${d.country}` : 'Unnamed destination',
      dates: formatDateRange(d.arrivalDate, d.departureDate),
      accommodation: d.accommodation || 'Not specified',
      activityCount: d.activities.length,
      activities: d.activities.map((a: ReadonlyActivity) => ({
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
    destinations().reduce(
      (sum, d: ReadonlyDestination) => sum + d.activities.length,
      0,
    ),
  );

  const totalRequirements = computed(() =>
    destinations().reduce(
      (sum, d: ReadonlyDestination) =>
        sum +
        d.activities.reduce(
          (aSum, a: ReadonlyActivity) => aSum + a.requirements.length,
          0,
        ),
      0,
    ),
  );

  const dateRange = computed(() => {
    const dests = destinations();
    if (dests.length === 0) return 'No destinations';

    const arrivals = dests
      .map((d: ReadonlyDestination) => d.arrivalDate)
      .filter(Boolean)
      .slice();
    const departures = dests
      .map((d: ReadonlyDestination) => d.departureDate)
      .filter(Boolean)
      .slice();

    // oxlint-disable-next-line unicorn/no-array-sort -- The workspace targets ES2022, so toSorted() is not available in the demo build.
    arrivals.sort();
    // oxlint-disable-next-line unicorn/no-array-sort -- The workspace targets ES2022, so toSorted() is not available in the demo build.
    departures.sort();

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
/* oxlint-enable @typescript-eslint/prefer-readonly-parameter-types */
