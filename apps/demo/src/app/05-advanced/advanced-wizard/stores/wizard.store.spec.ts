import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { TravelerSchema, TripSchema } from '../schemas/wizard.schemas';
import { WizardStore } from './wizard.store';

/**
 * The store must not carry its own copy of the wizard rules. The Zod schemas
 * decide whether a step is valid, so a draft that fails a schema-only rule
 * (minimum length, date order, required activity) must block the step even
 * when every field is non-empty.
 */
describe('WizardStore step validity', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [WizardStore] });
    return TestBed.inject(WizardStore);
  }

  function fillValidTraveler(store: InstanceType<typeof WizardStore>) {
    store.setTraveler({
      ...store.traveler(),
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      passportNumber: 'X1234567',
      passportExpiry: '2099-01-01',
      nationality: 'UK',
    });
  }

  function fillValidTrip(store: InstanceType<typeof WizardStore>) {
    store.updateDestination(0, {
      country: 'Japan',
      city: 'Tokyo',
      arrivalDate: '2099-01-01',
      departureDate: '2099-01-10',
    });
    store.updateActivity(0, 0, { name: 'Sightseeing', date: '2099-01-05' });
    // The empty requirement stub fails RequirementSchema's description rule.
    store.removeRequirement(0, 0, 0);
  }

  it('starts with every step invalid and blocks proceeding', () => {
    const store = setup();

    expect(store.isTravelerStepValid()).toBe(false);
    expect(store.isTripStepValid()).toBe(false);
    expect(store.isReviewStepValid()).toBe(false);
    expect(store.stepValidation()).toEqual({
      traveler: false,
      trip: false,
      review: false,
    });
    expect(store.canProceed()).toBe(false);
  });

  describe('traveler step', () => {
    it('is valid and lets the user proceed when the traveler passes the schema', () => {
      const store = setup();
      fillValidTraveler(store);

      expect(store.isTravelerStepValid()).toBe(true);
      expect(store.stepValidation().traveler).toBe(true);
      expect(store.canProceed()).toBe(true);
    });

    it('is invalid when the passport number is shorter than the schema minimum', () => {
      const store = setup();
      fillValidTraveler(store);
      store.setTraveler({ ...store.traveler(), passportNumber: 'X1' });

      expect(store.isTravelerStepValid()).toBe(false);
      expect(store.canProceed()).toBe(false);
    });

    it('is invalid when the email is not an email address', () => {
      const store = setup();
      fillValidTraveler(store);
      store.setTraveler({ ...store.traveler(), email: 'not-an-email' });

      expect(store.isTravelerStepValid()).toBe(false);
    });

    it('is invalid when the passport has expired', () => {
      const store = setup();
      fillValidTraveler(store);
      store.setTraveler({ ...store.traveler(), passportExpiry: '2000-01-01' });

      expect(store.isTravelerStepValid()).toBe(false);
    });
  });

  describe('trip step', () => {
    it('is valid and lets the user proceed when the destinations pass the schema', () => {
      const store = setup();
      fillValidTrip(store);
      store.goToStep('trip', true);

      expect(store.isTripDraftValid()).toBe(true);
      expect(store.canProceed()).toBe(true);

      // The step is completed once Next commits it, not before.
      expect(store.stepValidation().trip).toBe(false);
      store.commitDestinations();
      expect(store.isTripStepValid()).toBe(true);
      expect(store.stepValidation().trip).toBe(true);
    });

    it('is invalid when the departure date is before the arrival date', () => {
      const store = setup();
      fillValidTrip(store);
      store.updateDestination(0, { departureDate: '2098-12-01' });
      store.goToStep('trip', true);

      expect(store.isTripDraftValid()).toBe(false);
      expect(store.canProceed()).toBe(false);
    });

    it.each([
      ['after departure', '2099-01-11'],
      ['before arrival', '2098-12-31'],
    ])(
      'is invalid when an activity is dated %s of its destination',
      (_label, activityDate) => {
        const store = setup();
        fillValidTrip(store);
        store.updateActivity(0, 0, { date: activityDate });
        store.goToStep('trip', true);

        expect(store.isTripDraftValid()).toBe(false);
        store.commitDestinations();
        expect(store.stepValidation().trip).toBe(false);
        expect(store.canProceed()).toBe(false);
      },
    );

    it('is invalid when a destination has no activity', () => {
      const store = setup();
      fillValidTrip(store);
      store.removeActivity(0, 0);
      store.goToStep('trip', true);

      expect(store.isTripDraftValid()).toBe(false);
      expect(store.canProceed()).toBe(false);
    });

    it('is invalid when there are no destinations', () => {
      const store = setup();
      store.setDestinations([]);

      expect(store.isTripStepValid()).toBe(false);
    });
  });

  describe('review step and submission', () => {
    it('is valid only when both committed steps pass their schemas', () => {
      const store = setup();
      fillValidTraveler(store);
      expect(store.isReviewStepValid()).toBe(false);

      fillValidTrip(store);
      expect(store.isReviewStepValid()).toBe(false);

      store.commitDestinations();
      expect(store.isReviewStepValid()).toBe(true);
      expect(store.stepValidation().review).toBe(true);
    });

    it('is ready to submit only when the committed data passes the trip schema', () => {
      const store = setup();
      fillValidTraveler(store);
      fillValidTrip(store);
      expect(store.isReadyToSubmit()).toBe(false);

      store.commitDestinations();
      expect(store.isReadyToSubmit()).toBe(true);

      store.setTraveler({ ...store.traveler(), passportNumber: 'X1' });
      expect(store.isReadyToSubmit()).toBe(false);
    });
  });

  it('never disagrees with the schemas about the drafts or the committed data', () => {
    const store = setup();
    const changes: Array<() => void> = [
      () => undefined,
      () => {
        fillValidTraveler(store);
      },
      () => {
        store.setTraveler({ ...store.traveler(), passportNumber: 'X1' });
      },
      () => {
        fillValidTrip(store);
      },
      () => {
        store.updateDestination(0, { departureDate: '2098-12-01' });
      },
      () => {
        store.removeActivity(0, 0);
      },
    ];

    for (const change of changes) {
      change();
      expect(store.isTravelerDraftValid()).toBe(
        TravelerSchema.safeParse(store.travelerDraft()).success,
      );
      expect(store.isTripDraftValid()).toBe(
        TripSchema.shape.destinations.safeParse(store.destinationsDraft())
          .success,
      );
      expect(store.isTravelerStepValid()).toBe(
        TravelerSchema.safeParse(store.traveler()).success,
      );
      expect(store.isTripStepValid()).toBe(
        TripSchema.shape.destinations.safeParse(store.destinations()).success,
      );
    }
  });
});
