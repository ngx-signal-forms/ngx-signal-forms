import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createEmptyDestination,
  createEmptyTraveler,
  type Destination,
  type Traveler,
  type WizardDraft,
} from '../schemas/wizard.schemas';
import { WIZARD_DRAFT_STORAGE_KEY } from './features/saved-draft.feature';
import { WizardStore } from './wizard.store';

/**
 * Autosave must keep what the user typed in the current step, but only Next
 * may mark a step as completed. The store keeps two kinds of data: committed
 * (`traveler`, `destinations`) and in progress (`travelerDraft`,
 * `destinationsDraft`). The saved draft carries both.
 */
describe('WizardStore live draft', () => {
  const validTraveler: Traveler = {
    ...createEmptyTraveler(),
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    passportNumber: 'X1234567',
    passportExpiry: '2099-01-01',
    nationality: 'UK',
  };

  const typedDestinations: Destination[] = [
    { ...createEmptyDestination(), city: 'Tokyo' },
  ];

  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  function setup(storedDraftId?: string) {
    if (storedDraftId) {
      sessionStorage.setItem(
        WIZARD_DRAFT_STORAGE_KEY,
        JSON.stringify({ draftId: storedDraftId }),
      );
    }
    TestBed.configureTestingModule({
      providers: [WizardStore, provideHttpClient(), provideHttpClientTesting()],
    });
    const store = TestBed.inject(WizardStore);
    const httpMock = TestBed.inject(HttpTestingController);
    TestBed.tick();
    return { store, httpMock };
  }

  async function settle(): Promise<void> {
    await TestBed.inject(ApplicationRef).whenStable();
  }

  describe('write-back from the step forms', () => {
    it('copies the typed traveler into the draft and leaves the committed traveler alone', () => {
      const { store } = setup();
      const typed = signal<Traveler>(store.travelerDraft());
      TestBed.runInInjectionContext(() => store.syncTravelerDraft(typed));

      typed.set(validTraveler);
      TestBed.tick();

      expect(store.travelerDraft()).toEqual(validTraveler);
      expect(store.traveler().firstName).toBe('');
      expect(store.draftSummary().inProgress?.traveler).toEqual(validTraveler);
      expect(store.draftSummary().traveler.firstName).toBe('');
    });

    it('copies the typed destinations into the draft and leaves the committed ones alone', () => {
      const { store } = setup();
      const typed = signal<Destination[]>(store.destinationsDraft());
      TestBed.runInInjectionContext(() => store.syncDestinationsDraft(typed));

      typed.set(typedDestinations);
      TestBed.tick();

      expect(store.destinationsDraft()).toEqual(typedDestinations);
      expect(store.destinations()[0].city).toBe('');
      expect(store.draftSummary().inProgress?.destinations).toEqual(
        typedDestinations,
      );
    });
  });

  describe('completion', () => {
    it('does not mark a step as completed when a valid traveler is only typed', () => {
      const { store } = setup();
      const typed = signal<Traveler>(store.travelerDraft());
      TestBed.runInInjectionContext(() => store.syncTravelerDraft(typed));

      typed.set(validTraveler);
      TestBed.tick();

      // The user may press Next ...
      expect(store.isTravelerDraftValid()).toBe(true);
      expect(store.canProceed()).toBe(true);
      // ... but the step is not finished until Next commits it.
      expect(store.stepValidation().traveler).toBe(false);

      store.commitTraveler();
      expect(store.stepValidation().traveler).toBe(true);
    });
  });

  describe('resume', () => {
    const committedTraveler: Traveler = {
      ...createEmptyTraveler(),
      firstName: 'Committed',
    };
    const saved: WizardDraft = {
      traveler: committedTraveler,
      destinations: [createEmptyDestination()],
      inProgress: {
        traveler: validTraveler,
        destinations: typedDestinations,
      },
    };

    it('fills the drafts from the in-progress part and the committed state from the committed part', async () => {
      const { store, httpMock } = setup('draft-1');
      httpMock.expectOne('/api/wizard/draft/draft-1').flush(saved);
      await settle();

      expect(store.traveler()).toEqual(committedTraveler);
      expect(store.travelerDraft()).toEqual(validTraveler);
      expect(store.destinationsDraft()).toEqual(typedDestinations);
      expect(store.destinations()).toEqual(saved.destinations);
    });

    it('does not mark a step with valid but uncommitted values as completed', async () => {
      const { store, httpMock } = setup('draft-1');
      httpMock.expectOne('/api/wizard/draft/draft-1').flush(saved);
      await settle();

      expect(store.isTravelerDraftValid()).toBe(true);
      expect(store.stepValidation().traveler).toBe(false);
    });

    it('falls back to the committed part for a draft without in-progress data', async () => {
      const { store, httpMock } = setup('draft-1');
      httpMock.expectOne('/api/wizard/draft/draft-1').flush({
        traveler: validTraveler,
        destinations: typedDestinations,
      });
      await settle();

      expect(store.travelerDraft()).toEqual(validTraveler);
      expect(store.destinationsDraft()).toEqual(typedDestinations);
    });

    it('takes the committed value again after a commit, not the stale in-progress one', async () => {
      const { store, httpMock } = setup('draft-1');
      httpMock.expectOne('/api/wizard/draft/draft-1').flush(saved);
      await settle();

      store.setTraveler({ ...validTraveler, firstName: 'Grace' });

      expect(store.travelerDraft().firstName).toBe('Grace');
    });
  });

  describe('autosave', () => {
    it('saves the in-progress part of a step that was never committed', async () => {
      const { store, httpMock } = setup();
      const typed = signal<Traveler>(store.travelerDraft());
      TestBed.runInInjectionContext(() => store.syncTravelerDraft(typed));
      typed.set(validTraveler);
      TestBed.tick();

      const save = store.saveDraft(store.draftSummary());
      const post = httpMock.expectOne('/api/wizard/draft');
      const body = post.request.body as WizardDraft;
      post.flush({ draftId: 'draft-1', savedAt: new Date().toISOString() });
      await save;

      expect(body.traveler.firstName).toBe('');
      expect(body.inProgress?.traveler).toEqual(validTraveler);
    });
  });

  describe('reset', () => {
    it('clears the committed and the in-progress parts', () => {
      const { store } = setup();
      const typed = signal<Traveler>(store.travelerDraft());
      TestBed.runInInjectionContext(() => store.syncTravelerDraft(typed));
      typed.set(validTraveler);
      TestBed.tick();
      store.commitTraveler();
      expect(store.draftSummary().traveler.firstName).toBe('Ada');
      expect(store.draftSummary().inProgress?.traveler.firstName).toBe('Ada');

      store.reset();
      TestBed.tick();

      const summary = store.draftSummary();
      expect(summary.traveler.firstName).toBe('');
      expect(summary.inProgress?.traveler.firstName).toBe('');
      expect(summary.inProgress?.destinations[0].city).toBe('');
      expect(store.draftId()).toBeNull();
    });
  });

  describe('booking', () => {
    const confirmed = {
      bookingId: 'booking-1',
      confirmationNumber: 'CONF-1',
      status: 'confirmed',
    };

    it('starts the next store empty in both parts after a typed and committed trip is booked', async () => {
      const { store, httpMock } = setup('draft-1');
      httpMock.expectOne('/api/wizard/draft/draft-1').flush({
        traveler: validTraveler,
        destinations: typedDestinations,
        inProgress: {
          traveler: validTraveler,
          destinations: typedDestinations,
        },
      });
      await settle();
      expect(store.draftSummary().inProgress?.traveler.firstName).toBe('Ada');

      const booking = store.submitBooking(store.tripData());
      httpMock.expectOne('/api/wizard/booking').flush(confirmed);
      await booking;

      // The booking spends the draft: its id is gone, so nothing resumes.
      expect(store.draftId()).toBeNull();

      TestBed.resetTestingModule();
      const next = setup();
      next.httpMock.expectNone((request) => request.method === 'GET');
      const summary = next.store.draftSummary();
      expect(summary.traveler.firstName).toBe('');
      expect(summary.inProgress?.traveler.firstName).toBe('');
      expect(summary.inProgress?.destinations[0].city).toBe('');
    });
  });

  describe('autoSaveDraft', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function typeTraveler(
      store: InstanceType<typeof WizardStore>,
      t: Traveler,
    ) {
      const typed = signal<Traveler>(store.travelerDraft());
      TestBed.runInInjectionContext(() => store.syncTravelerDraft(typed));
      typed.set(t);
      TestBed.tick();
    }

    function saves(httpMock: HttpTestingController) {
      return httpMock.match((request) => request.method !== 'GET');
    }

    it('sends no save for an untouched wizard', async () => {
      const { httpMock } = setup();
      await vi.advanceTimersByTimeAsync(5000);
      expect(saves(httpMock)).toHaveLength(0);
    });

    it('sends no save after reset and brings no draft id back', async () => {
      const { store, httpMock } = setup();
      store.reset();
      TestBed.tick();
      await vi.advanceTimersByTimeAsync(5000);
      expect(saves(httpMock)).toHaveLength(0);
      expect(store.draftId()).toBeNull();
    });

    it('saves once the user types one destination field', async () => {
      const { store, httpMock } = setup();
      const typed = signal<Destination[]>(store.destinationsDraft());
      TestBed.runInInjectionContext(() => store.syncDestinationsDraft(typed));
      typed.set(typedDestinations);
      TestBed.tick();
      await vi.advanceTimersByTimeAsync(2000);

      const [save] = saves(httpMock);
      expect(save.request.method).toBe('POST');
      save.flush({ draftId: 'draft-1', savedAt: new Date().toISOString() });
    });

    it('saves typed, uncommitted data after the debounce', () => {
      const { store, httpMock } = setup();
      typeTraveler(store, validTraveler);

      vi.advanceTimersByTime(1999);
      expect(saves(httpMock)).toHaveLength(0);

      vi.advanceTimersByTime(1);
      const [save] = saves(httpMock);
      expect((save.request.body as WizardDraft).inProgress?.traveler).toEqual(
        validTraveler,
      );
      save.flush({ draftId: 'draft-1', savedAt: new Date().toISOString() });
    });

    it('saves a cleared field once a draft exists, so the server drops stale data', async () => {
      const { store, httpMock } = setup('draft-1');
      httpMock.expectOne('/api/wizard/draft/draft-1').flush({
        traveler: validTraveler,
        destinations: typedDestinations,
      });
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(2000);
      // Drop the save that follows the load.
      for (const save of saves(httpMock)) {
        save.flush({ draftId: 'draft-1', savedAt: new Date().toISOString() });
      }

      store.setTraveler({ ...validTraveler, firstName: '' });
      TestBed.tick();
      await vi.advanceTimersByTimeAsync(2000);

      const [save] = saves(httpMock);
      expect(save.request.method).toBe('PUT');
      expect((save.request.body as WizardDraft).traveler.firstName).toBe('');
      save.flush({ draftId: 'draft-1', savedAt: new Date().toISOString() });
    });

    it('sends no save while the saved draft is loading, and the loaded draft wins over typing', async () => {
      const { store, httpMock } = setup('draft-1');
      const load = httpMock.expectOne('/api/wizard/draft/draft-1');
      expect(store.isLoadingDraft()).toBe(true);

      // The fields are disabled while loading, so a user cannot type. This
      // forces the write-back anyway, to prove the guard does not rely on it.
      typeTraveler(store, { ...validTraveler, firstName: 'Typed' });
      await vi.advanceTimersByTimeAsync(5000);
      expect(saves(httpMock)).toHaveLength(0);

      load.flush({
        traveler: { ...validTraveler, firstName: 'Saved' },
        destinations: typedDestinations,
      });
      await vi.advanceTimersByTimeAsync(0);
      expect(store.travelerDraft().firstName).toBe('Saved');

      await vi.advanceTimersByTimeAsync(2000);
      for (const save of saves(httpMock)) {
        expect(JSON.stringify(save.request.body)).not.toContain('Typed');
        save.flush({ draftId: 'draft-1', savedAt: new Date().toISOString() });
      }
    });
  });
});
