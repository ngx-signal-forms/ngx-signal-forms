import {
  ApplicationRef,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import { TripStepComponent } from './trip-step';
import { WizardStore } from '../stores/wizard.store';

/**
 * `validateAndFocus()` unifies on the toolkit's `submitWithWarnings()`
 * helper, mirroring `TravelerStepComponent` (see traveler-step.spec.ts
 * pattern if one exists) instead of hand-rolling `markAsTouched()` +
 * `.invalid()`. These specs pin the same observable contract the old
 * hand-rolled implementation had: an invalid destination blocks advancement,
 * marks the invalid field(s), and moves focus to the first one; a valid
 * destination advances; no destinations at all blocks advancement and moves
 * focus to the "Add Your First Destination" button.
 *
 * `validateAndFocus()` is invoked by the real parent (`WizardContainerComponent`)
 * from its own "Next" button handler, not from a control inside
 * `TripStepComponent` itself — so this host mirrors that real call site: a
 * button click drives the transition, and the (boolean) outcome is rendered
 * to the DOM instead of being read off the component instance.
 */
@Component({
  template: `
    <ngx-trip-step />
    <button type="button" (click)="advance()">Continue</button>
    <p data-testid="advance-result">{{ resultLabel() }}</p>
  `,
  imports: [TripStepComponent],
})
class TripStepHostComponent {
  readonly stepRef = viewChild.required(TripStepComponent);
  readonly #result = signal<boolean | null>(null);
  readonly resultLabel = computed(() => {
    const result = this.#result();
    return result === null ? 'pending' : result ? 'advanced' : 'blocked';
  });

  async advance(): Promise<void> {
    this.#result.set(await this.stepRef().validateAndFocus());
  }
}

describe('TripStepComponent validate-and-advance transition', () => {
  async function setup() {
    const rendered = await render(TripStepHostComponent);
    // WizardStore is `providedIn: 'root'`, so its committed state can
    // outlive an individual `it()` unless explicitly cleared. `render()`
    // instantiates the TestBed module, so this can only run afterwards —
    // `TestBed.inject()` beforehand would lock the module before `render()`
    // gets a chance to configure it.
    TestBed.inject(WizardStore).setDestinations([]);
    return rendered;
  }

  async function clickContinue(fixture: { detectChanges: () => void }) {
    screen.getByRole('button', { name: 'Continue' }).click();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.detectChanges();
  }

  it('blocks advancement, marks the invalid field, and focuses it when the destination is invalid', async () => {
    const { fixture } = await setup();
    const store = TestBed.inject(WizardStore);
    store.addDestination(); // empty destination fails required-field validation
    fixture.detectChanges();

    await clickContinue(fixture);

    expect(screen.getByTestId('advance-result')).toHaveTextContent('blocked');

    const countryInput = screen.getByLabelText('Country');
    expect(countryInput).toHaveAttribute('aria-invalid', 'true');
    expect(countryInput).toHaveFocus();
  });

  it('advances when all destination fields are valid', async () => {
    const { fixture } = await setup();
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
    fixture.detectChanges();

    await clickContinue(fixture);

    expect(screen.getByTestId('advance-result')).toHaveTextContent('advanced');
    expect(
      screen.queryByRole('textbox', { name: 'Country' }),
    ).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('blocks advancement and focuses the add-destination button when there are no destinations', async () => {
    const { fixture } = await setup();
    await clickContinue(fixture);

    expect(screen.getByTestId('advance-result')).toHaveTextContent('blocked');
    expect(
      screen.getByRole('button', { name: 'Add Your First Destination' }),
    ).toHaveFocus();
  });
});
