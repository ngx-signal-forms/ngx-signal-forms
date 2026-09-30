import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createEmptyDestination,
  createEmptyTraveler,
  type WizardDraft,
} from '../schemas/wizard.schemas';
import { WIZARD_DRAFT_STORAGE_KEY } from './features/saved-draft.feature';
import { WizardStore } from './wizard.store';

/**
 * The wizard resumes the last auto-saved draft of the tab. The store's own
 * `sessionStorage` key may hold only the draft id: the draft holds a passport
 * number, so it belongs to the server. (In the demo, the MSW mock server keeps
 * the drafts under its own key, in place of a server database.) The loaded
 * draft must seed the wizard once, and never overwrite what the user types
 * after the first save.
 */
describe('WizardStore draft resume', () => {
  const savedDraft: WizardDraft = {
    traveler: {
      ...createEmptyTraveler(),
      firstName: 'Ada',
      lastName: 'Lovelace',
      passportNumber: 'X1234567',
    },
    destinations: [{ ...createEmptyDestination(), city: 'Tokyo' }],
  };

  // Empty factories stamp a fresh random id, so compare everything but that.
  const emptyTraveler = { ...createEmptyTraveler(), id: expect.any(String) };

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
    // Runs the resource effect, which sends the GET when there is an id.
    TestBed.tick();
    return { store, httpMock };
  }

  async function settle(): Promise<void> {
    await TestBed.inject(ApplicationRef).whenStable();
  }

  function storedJson(): unknown {
    return JSON.parse(sessionStorage.getItem(WIZARD_DRAFT_STORAGE_KEY) ?? '');
  }

  it('loads nothing and starts empty when no draft id is stored', () => {
    const { store, httpMock } = setup();

    httpMock.expectNone((request) => request.method === 'GET');
    expect(store.isLoadingDraft()).toBe(false);
    expect(store.traveler()).toEqual(emptyTraveler);
    expect(store.destinations()).toHaveLength(1);
  });

  it('is loading until the stored draft arrives, then seeds committed and draft state', async () => {
    const { store, httpMock } = setup('draft-1');

    const request = httpMock.expectOne('/api/wizard/draft/draft-1');
    expect(request.request.method).toBe('GET');
    expect(store.isLoadingDraft()).toBe(true);
    expect(store.traveler().firstName).toBe('');

    request.flush(savedDraft);
    await settle();

    expect(store.isLoadingDraft()).toBe(false);
    expect(store.traveler()).toEqual(savedDraft.traveler);
    expect(store.travelerDraft()).toEqual(savedDraft.traveler);
    expect(store.destinations()).toEqual(savedDraft.destinations);
    expect(store.destinationsDraft()).toEqual(savedDraft.destinations);
  });

  it('keeps the resumed data writable through the existing methods', async () => {
    const { store, httpMock } = setup('draft-1');
    httpMock.expectOne('/api/wizard/draft/draft-1').flush(savedDraft);
    await settle();

    store.setTraveler({ ...store.traveler(), firstName: 'Grace' });
    store.updateDestination(0, { city: 'Osaka' });
    store.commitDestinations();

    expect(store.travelerDraft().firstName).toBe('Grace');
    expect(store.destinations()[0].city).toBe('Osaka');
  });

  it('shows an error and stays empty and usable when the load fails', async () => {
    const { store, httpMock } = setup('gone');

    httpMock
      .expectOne('/api/wizard/draft/gone')
      .flush(
        { error: 'Draft not found' },
        { status: 404, statusText: 'Not Found' },
      );
    await settle();

    expect(store.isLoadingDraft()).toBe(false);
    expect(store.savedDraftError()).toBeTruthy();
    expect(store.traveler()).toEqual(emptyTraveler);
    expect(store.destinations()).toHaveLength(1);

    // The failed draft may be gone on the server, so the next save starts a
    // new draft instead of writing to the old id.
    const save = store.saveDraft(savedDraft);
    const post = httpMock.expectOne('/api/wizard/draft');
    expect(post.request.method).toBe('POST');
    post.flush({ draftId: 'draft-2', savedAt: new Date().toISOString() });
    await save;
    expect(store.draftId()).toBe('draft-2');
  });

  it('does not reload the draft after the first successful save', async () => {
    const { store, httpMock } = setup();

    store.setTraveler({ ...store.traveler(), firstName: 'Ada' });
    const save = store.saveDraft(store.draftSummary());
    httpMock
      .expectOne('/api/wizard/draft')
      .flush({ draftId: 'draft-1', savedAt: new Date().toISOString() });
    await save;
    await settle();

    // The user keeps typing after the save; a reload would overwrite this.
    store.setTraveler({ ...store.traveler(), firstName: 'Grace' });
    TestBed.tick();
    await settle();

    expect(store.draftId()).toBe('draft-1');
    httpMock.expectNone((request) => request.method === 'GET');
    expect(store.isLoadingDraft()).toBe(false);
    expect(store.traveler().firstName).toBe('Grace');
  });

  it('stores only the draft id in sessionStorage', async () => {
    const { store, httpMock } = setup();

    store.setTraveler(savedDraft.traveler);
    const save = store.saveDraft(store.draftSummary());
    httpMock
      .expectOne('/api/wizard/draft')
      .flush({ draftId: 'draft-1', savedAt: new Date().toISOString() });
    await save;

    expect(storedJson()).toEqual({ draftId: 'draft-1' });
    expect(sessionStorage.getItem(WIZARD_DRAFT_STORAGE_KEY)).not.toContain(
      'X1234567',
    );
  });

  it('reset() clears the stored id, so the next store starts empty', async () => {
    const { store, httpMock } = setup('draft-1');
    httpMock.expectOne('/api/wizard/draft/draft-1').flush(savedDraft);
    await settle();

    store.reset();

    expect(storedJson()).toEqual({ draftId: null });

    // A reload builds a new store from what is stored.
    TestBed.resetTestingModule();
    const next = setup();
    next.httpMock.expectNone((request) => request.method === 'GET');
    expect(next.store.traveler()).toEqual(emptyTraveler);
  });

  describe('after the booking is confirmed', () => {
    const confirmed = {
      bookingId: 'booking-1',
      confirmationNumber: 'CONF-1',
      status: 'confirmed',
    };

    it('clears the stored id, so a reload does not resume the booked trip', async () => {
      const { store, httpMock } = setup('draft-1');
      httpMock.expectOne('/api/wizard/draft/draft-1').flush(savedDraft);
      await settle();

      const booking = store.submitBooking(store.tripData());
      httpMock.expectOne('/api/wizard/booking').flush(confirmed);
      await booking;

      expect(store.hasConfirmedBooking()).toBe(true);
      expect(store.draftId()).toBeNull();
      expect(storedJson()).toEqual({ draftId: null });

      // A reload builds a new store from what is stored.
      TestBed.resetTestingModule();
      const next = setup();
      next.httpMock.expectNone((request) => request.method === 'GET');
      expect(next.store.traveler()).toEqual(emptyTraveler);
    });

    it('keeps the stored id when the booking fails, so the draft stays resumable', async () => {
      const { store, httpMock } = setup('draft-1');
      httpMock.expectOne('/api/wizard/draft/draft-1').flush(savedDraft);
      await settle();

      const booking = store.submitBooking(store.tripData());
      httpMock
        .expectOne('/api/wizard/booking')
        .flush({}, { status: 500, statusText: 'Server Error' });
      await booking;

      expect(store.hasConfirmedBooking()).toBe(false);
      expect(store.draftId()).toBe('draft-1');
      expect(storedJson()).toEqual({ draftId: 'draft-1' });
    });

    it('ignores an autosave that lands after the confirmation', async () => {
      const { store, httpMock } = setup();
      store.setTraveler(savedDraft.traveler);

      // The save is in flight when the booking confirms.
      const save = store.saveDraft(store.draftSummary());
      const savePost = httpMock.expectOne('/api/wizard/draft');
      const booking = store.submitBooking(store.tripData());
      httpMock.expectOne('/api/wizard/booking').flush(confirmed);
      await booking;

      savePost.flush({
        draftId: 'draft-late',
        savedAt: new Date().toISOString(),
      });
      await save;

      expect(store.draftId()).toBeNull();
      expect(storedJson()).toEqual({ draftId: null });
    });

    it('ignores a save that lands after the confirmation and a new booking started', async () => {
      const { store, httpMock } = setup();
      store.setTraveler(savedDraft.traveler);

      const save = store.saveDraft(store.draftSummary());
      const savePost = httpMock.expectOne('/api/wizard/draft');
      const booking = store.submitBooking(store.tripData());
      httpMock.expectOne('/api/wizard/booking').flush(confirmed);
      await booking;

      // "Start New Booking" clears the confirmation, so the guard on
      // `hasConfirmedBooking()` no longer covers the old save.
      store.reset();
      expect(store.hasConfirmedBooking()).toBe(false);

      savePost.flush({
        draftId: 'draft-late',
        savedAt: new Date().toISOString(),
      });
      await save;

      expect(store.draftId()).toBeNull();
      expect(storedJson()).toEqual({ draftId: null });
    });

    it('shows no save error when a save fails after the confirmation and a new booking started', async () => {
      const { store, httpMock } = setup();
      store.setTraveler(savedDraft.traveler);
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      const save = store.saveDraft(store.draftSummary());
      const savePost = httpMock.expectOne('/api/wizard/draft');
      const booking = store.submitBooking(store.tripData());
      httpMock.expectOne('/api/wizard/booking').flush(confirmed);
      await booking;
      store.reset();

      savePost.flush({}, { status: 500, statusText: 'Server Error' });
      await save;

      expect(store.error()).toBeNull();
      consoleError.mockRestore();
    });

    it('still accepts a save that starts after the reset', async () => {
      const { store, httpMock } = setup();
      store.setTraveler(savedDraft.traveler);
      const booking = store.submitBooking(store.tripData());
      httpMock.expectOne('/api/wizard/booking').flush(confirmed);
      await booking;
      store.reset();

      store.setTraveler(savedDraft.traveler);
      const save = store.saveDraft(store.draftSummary());
      httpMock
        .expectOne('/api/wizard/draft')
        .flush({ draftId: 'draft-new', savedAt: new Date().toISOString() });
      await save;

      expect(store.draftId()).toBe('draft-new');
    });
  });
});
