import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import { dayAfter, todayPlainDate } from '../schemas/wizard.schemas';
import { WizardStore } from '../stores/wizard.store';
import { TripStepComponent } from './trip-step';

/**
 * Form-practice contract for the trip step (#682): required fields announce
 * themselves, the date pickers carry the same bounds the Zod schema enforces,
 * and the repeated cards are named groups. The schema stays the source of
 * truth, so none of these attributes may block typing a value.
 */
describe('TripStepComponent form practice', () => {
  async function setup() {
    const rendered = await render(TripStepComponent, {
      providers: [WizardStore],
    });
    // A fresh store holds one destination with one activity and one
    // requirement, so every field under test is already rendered.
    const store = TestBed.inject(WizardStore);
    return { ...rendered, store };
  }

  it('marks nested required fields so assistive tech announces them', async () => {
    await setup();

    // Why: the schema requires these, but only the destination fields were
    // wired for required-ness (WCAG 3.3.2).
    expect(screen.getByLabelText('Activity Name')).toHaveAttribute(
      'aria-required',
      'true',
    );
    expect(screen.getByLabelText('Date')).toHaveAttribute(
      'aria-required',
      'true',
    );
    expect(screen.getByLabelText('Requirement description')).toHaveAttribute(
      'aria-required',
      'true',
    );
  });

  it('bounds the date pickers by the same rules as the schema', async () => {
    const { store, fixture } = await setup();

    const today = todayPlainDate().toString();
    expect(screen.getByLabelText('Arrival Date')).toHaveAttribute('min', today);
    // Departure must be strictly after arrival, so there is no min until an
    // arrival date exists.
    expect(screen.getByLabelText('Departure Date')).not.toHaveAttribute('min');
    // The activity date is bound by the destination range only once both ends
    // are known.
    expect(screen.getByLabelText('Date')).not.toHaveAttribute('min');
    expect(screen.getByLabelText('Date')).not.toHaveAttribute('max');

    const [first] = store.destinationsDraft();
    store.setDestinations([
      { ...first, arrivalDate: '2099-03-10', departureDate: '2099-03-15' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByLabelText('Departure Date')).toHaveAttribute(
      'min',
      dayAfter('2099-03-10'),
    );
    expect(screen.getByLabelText('Date')).toHaveAttribute('min', '2099-03-10');
    expect(screen.getByLabelText('Date')).toHaveAttribute('max', '2099-03-15');
  });

  it('keeps the duration input from going negative in the picker', async () => {
    await setup();

    expect(screen.getByLabelText('Duration (hrs)')).toHaveAttribute('min', '0');
  });

  it('names each activity and its requirements as a group', async () => {
    await setup();

    expect(
      screen.getByRole('group', { name: 'Activity 1' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Requirements' }),
    ).toBeInTheDocument();
  });
});
