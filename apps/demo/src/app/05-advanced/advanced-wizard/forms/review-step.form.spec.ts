import { signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createEmptyActivity,
  createEmptyDestination,
  createEmptyRequirement,
  createEmptyTraveler,
  type Destination,
  type Traveler,
} from '../schemas/wizard.schemas';
import { createReviewStepForm } from './review-step.form';

/**
 * The review step shows what the user entered. Empty data must read as a clear
 * fallback ("Not provided", "Dates not set", "No destinations"), never as
 * blank or broken text.
 * Dates use local noon so the formatted day does not depend on the time zone.
 */
describe('createReviewStepForm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-06-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(
    traveler: Traveler,
    destinations: readonly Destination[],
  ): ReturnType<typeof createReviewStepForm> {
    return createReviewStepForm(signal(traveler), signal(destinations));
  }

  function populatedDestination(): Destination {
    return {
      ...createEmptyDestination(),
      country: 'Japan',
      city: 'Tokyo',
      arrivalDate: '2031-03-10T12:00:00',
      departureDate: '2031-03-20T12:00:00',
      accommodation: 'Hotel Sakura',
      activities: [
        {
          ...createEmptyActivity(),
          name: 'Temple tour',
          date: '2031-03-12T12:00:00',
          duration: 3,
          cost: 25,
          requirements: [createEmptyRequirement(), createEmptyRequirement()],
        },
        { ...createEmptyActivity(), requirements: [] },
      ],
    };
  }

  describe('with empty data', () => {
    it('shows fallback text for the traveler', () => {
      const form = setup(createEmptyTraveler(), []);

      expect(form.travelerDisplay()).toEqual({
        fullName: 'Not provided',
        email: 'Not provided',
        nationality: 'Not provided',
        age: null,
        hasPassport: false,
        passportStatus: 'none',
        passportValid: false,
      });
    });

    it('shows fallback text and zero totals without destinations', () => {
      const form = setup(createEmptyTraveler(), []);

      expect(form.destinationsDisplay()).toEqual([]);
      expect(form.totalActivities()).toBe(0);
      expect(form.totalRequirements()).toBe(0);
      expect(form.dateRange()).toBe('No destinations');
    });

    it('shows fallback text for an empty destination and activity', () => {
      const form = setup(createEmptyTraveler(), [createEmptyDestination()]);

      expect(form.destinationsDisplay()).toEqual([
        {
          name: 'Unnamed destination',
          dates: 'Dates not set',
          accommodation: 'Not specified',
          activityCount: 1,
          activities: [
            {
              name: 'Unnamed activity',
              date: 'No date',
              duration: 'Not specified',
              cost: 'Free',
              requirementCount: 1,
            },
          ],
        },
      ]);
      expect(form.totalActivities()).toBe(1);
      expect(form.totalRequirements()).toBe(1);
      expect(form.dateRange()).toBe('Dates incomplete');
    });
  });

  describe('with populated data', () => {
    it('formats the traveler, with a birthday not yet reached this year', () => {
      const form = setup(
        {
          ...createEmptyTraveler(),
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@example.com',
          nationality: 'UK',
          dateOfBirth: '1990-12-01T12:00:00',
          passportNumber: 'X1234567',
          passportExpiry: '2099-01-01T12:00:00',
        },
        [],
      );

      expect(form.travelerDisplay()).toEqual({
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        nationality: 'UK',
        age: 39,
        hasPassport: true,
        passportStatus: 'valid',
        passportValid: true,
      });
    });

    it('counts a birthday that has passed and flags an expired passport', () => {
      const form = setup(
        {
          ...createEmptyTraveler(),
          dateOfBirth: '1990-01-01T12:00:00',
          passportNumber: 'X1234567',
          passportExpiry: '2020-01-01T12:00:00',
        },
        [],
      );

      expect(form.travelerDisplay()).toMatchObject({
        age: 40,
        hasPassport: true,
        passportStatus: 'expired',
        passportValid: false,
      });
    });

    it('flags a future passport that ends within six months of the last departure', () => {
      const traveler = {
        ...createEmptyTraveler(),
        passportNumber: 'X1234567',
        passportExpiry: '2031-08-01T12:00:00',
      };
      // Last departure 20 March 2031: the passport must outlast 20 September 2031.
      const tooClose = setup(traveler, [populatedDestination()]);
      expect(tooClose.travelerDisplay().passportStatus).toBe('too-close');
      expect(tooClose.travelerDisplay().passportValid).toBe(false);

      const enough = setup(
        { ...traveler, passportExpiry: '2031-10-01T12:00:00' },
        [populatedDestination()],
      );
      expect(enough.travelerDisplay().passportStatus).toBe('valid');
      expect(enough.travelerDisplay().passportValid).toBe(true);
    });

    it('formats destinations, activities and requirement counts', () => {
      const form = setup(createEmptyTraveler(), [populatedDestination()]);

      expect(form.destinationsDisplay()).toEqual([
        {
          name: 'Tokyo, Japan',
          dates: 'Mar 10 - Mar 20, 2031',
          accommodation: 'Hotel Sakura',
          activityCount: 2,
          activities: [
            {
              name: 'Temple tour',
              date: 'Mar 12',
              duration: '3 hours',
              cost: '$25',
              requirementCount: 2,
            },
            {
              name: 'Unnamed activity',
              date: 'No date',
              duration: 'Not specified',
              cost: 'Free',
              requirementCount: 0,
            },
          ],
        },
      ]);
      expect(form.totalActivities()).toBe(2);
      expect(form.totalRequirements()).toBe(2);
    });

    it('spans the earliest arrival to the latest departure', () => {
      const later: Destination = {
        ...populatedDestination(),
        arrivalDate: '2031-04-01T12:00:00',
        departureDate: '2031-04-09T12:00:00',
      };
      const form = setup(createEmptyTraveler(), [
        later,
        populatedDestination(),
      ]);

      expect(form.dateRange()).toBe('Mar 10 - Apr 9, 2031');
    });
  });
});
