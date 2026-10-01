import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DeferBlockState, TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { createEmptyTraveler } from '../schemas/wizard.schemas';
import { WizardStore } from '../stores/wizard.store';
import { WizardContainerComponent } from './wizard-container';

/**
 * Only Next marks a step as completed (#645). Previous leaves the typed values
 * in the draft and commits nothing, so the step marker must not turn on.
 */
describe('WizardContainerComponent Previous', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('keeps a valid typed trip uncommitted, so the trip step is not completed', async () => {
    const { fixture } = await render(WizardContainerComponent, {
      providers: [WizardStore, provideHttpClient(), provideHttpClientTesting()],
    });
    const store = TestBed.inject(WizardStore);
    store.setTraveler({
      ...createEmptyTraveler(),
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      passportNumber: 'X1234567',
      passportExpiry: '2099-01-01',
      nationality: 'UK',
    });
    store.goToStep('trip', true);
    fixture.detectChanges();
    // Render the deferred trip step, so a Previous that commits through the
    // step ref would fail this test.
    for (const block of await fixture.getDeferBlocks()) {
      await block.render(DeferBlockState.Complete);
    }
    store.updateDestination(0, {
      country: 'Japan',
      city: 'Tokyo',
      arrivalDate: '2099-01-01',
      departureDate: '2099-01-10',
    });
    store.updateActivity(0, 0, { name: 'Sightseeing', date: '2099-01-05' });
    store.removeRequirement(0, 0, 0);
    expect(store.isTripDraftValid()).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));

    expect(store.currentStep()).toBe('traveler');
    expect(store.stepValidation().trip).toBe(false);
    // The typed trip survives for the way back.
    expect(store.destinationsDraft()[0].city).toBe('Tokyo');
  });

  it('checks the passport against the typed trip, not the committed one, after Previous', async () => {
    const { fixture } = await render(WizardContainerComponent, {
      providers: [WizardStore, provideHttpClient(), provideHttpClientTesting()],
    });
    const store = TestBed.inject(WizardStore);
    // Valid for the committed trip (no departure yet), so the field is clean.
    store.setTraveler({
      ...createEmptyTraveler(),
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      passportNumber: 'X1234567',
      passportExpiry: '2099-03-01',
      nationality: 'UK',
    });
    store.goToStep('trip', true);
    fixture.detectChanges();
    for (const block of await fixture.getDeferBlocks()) {
      await block.render(DeferBlockState.Complete);
    }
    // The user edits the departure date and goes back without pressing Next.
    store.updateDestination(0, { departureDate: '2099-01-10' });
    expect(store.destinations()[0].departureDate).toBe('');

    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(store.currentStep()).toBe('traveler');
    fixture.detectChanges();
    for (const block of await fixture.getDeferBlocks()) {
      await block.render(DeferBlockState.Complete);
    }

    const expiry = screen.getByLabelText(/Expiry Date/i);
    await userEvent.click(expiry);
    await userEvent.tab();
    expect(
      await screen.findByText(
        'Passport must be valid 6 months after trip ends',
      ),
    ).toBeTruthy();
  });
});
