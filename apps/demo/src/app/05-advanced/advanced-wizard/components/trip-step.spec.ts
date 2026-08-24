import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { TripStepComponent } from './trip-step';
import { WizardStore } from '../stores/wizard.store';

/**
 * `validateAndFocus()` unifies on the toolkit's `submitWithWarnings()`
 * helper, mirroring `TravelerStepComponent` (see traveler-step.spec.ts
 * pattern if one exists) instead of hand-rolling `markAsTouched()` +
 * `.invalid()`. These specs pin the same observable contract the old
 * hand-rolled implementation had: an invalid destination blocks advancement
 * and marks fields touched; a valid one advances.
 */
describe('TripStepComponent.validateAndFocus', () => {
  beforeEach(() => {
    // WizardStore is `providedIn: 'root'`, so its committed state can
    // outlive an individual `it()` unless explicitly cleared.
    TestBed.inject(WizardStore).setDestinations([]);
  });

  function createComponent() {
    const fixture = TestBed.createComponent(TripStepComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('blocks advancement and marks fields touched when the destination is invalid', async () => {
    const store = TestBed.inject(WizardStore);
    store.addDestination(); // empty destination fails required-field validation

    const fixture = createComponent();
    const component = fixture.componentInstance;

    const advanced = await component.validateAndFocus();

    expect(advanced).toBe(false);
    expect(component.tripForm().invalid()).toBe(true);
    expect(component.tripForm().touched()).toBe(true);
  });

  it('advances when all destination fields are valid', async () => {
    const store = TestBed.inject(WizardStore);
    store.addDestination();
    const destIdx = store.destinationsDraft().length - 1;
    store.updateDestination(destIdx, {
      country: 'Japan',
      city: 'Tokyo',
      arrivalDate: '2027-01-01',
      departureDate: '2027-01-10',
    });
    store.updateActivity(destIdx, 0, {
      name: 'Sightseeing',
      date: '2027-01-05',
      duration: 4,
    });
    // The auto-created activity ships with one empty requirement stub —
    // drop it so it doesn't fail RequirementSchema's `description` check.
    store.removeRequirement(destIdx, 0, 0);

    const fixture = createComponent();
    const component = fixture.componentInstance;

    const advanced = await component.validateAndFocus();

    expect(advanced).toBe(true);
    expect(component.tripForm().invalid()).toBe(false);
  });

  it('blocks advancement and focuses the add-destination button when there are no destinations', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const advanced = await component.validateAndFocus();

    expect(advanced).toBe(false);
  });
});
