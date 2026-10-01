import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { WizardStore } from '../stores/wizard.store';
import { createTravelerStepForm } from './traveler-step.form';
import { createTripStepForm } from './trip-step.form';

/**
 * Typing writes the form model, the write-back copies it into the store draft,
 * and the draft is the model's source. The model must stay the same object
 * through that round trip. A new object would reset the field in focus.
 */
describe('step forms write back to the store draft', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [WizardStore] });
    return TestBed.inject(WizardStore);
  }

  it('traveler: typing reaches the draft and keeps the model object', () => {
    const store = setup();
    const { form, model } = TestBed.runInInjectionContext(() =>
      createTravelerStepForm(store, signal(null)),
    );

    form.firstName().value.set('Ada');
    TestBed.tick();

    expect(store.travelerDraft().firstName).toBe('Ada');
    expect(store.traveler().firstName).toBe('');

    const afterWriteBack = model();
    TestBed.tick();
    expect(model()).toBe(afterWriteBack);
    expect(model().firstName).toBe('Ada');
  });

  it('trip: typing reaches the draft and keeps the model object', () => {
    const store = setup();
    const { form, model } = TestBed.runInInjectionContext(() =>
      createTripStepForm(store),
    );

    form.destinations[0].city().value.set('Tokyo');
    TestBed.tick();

    expect(store.destinationsDraft()[0].city).toBe('Tokyo');
    expect(store.destinations()[0].city).toBe('');

    const afterWriteBack = model();
    TestBed.tick();
    expect(model()).toBe(afterWriteBack);
  });

  it('trip: a structural edit through the store still reaches the form', () => {
    const store = setup();
    const { model } = TestBed.runInInjectionContext(() =>
      createTripStepForm(store),
    );

    store.addDestination();

    expect(model().destinations).toHaveLength(2);
  });
});
