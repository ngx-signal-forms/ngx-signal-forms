import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createEmptyDestination,
  createEmptyTraveler,
  type WizardDraft,
} from '../schemas/wizard.schemas';
import { WIZARD_DRAFT_STORAGE_KEY } from './features/saved-draft.feature';
import { WizardStore } from './wizard.store';

/**
 * The wizard resumes the last auto-saved draft of the tab. Only the draft id
 * may reach `sessionStorage`: the draft holds a passport number, so it must
 * stay on the server. The loaded draft must seed the wizard once, and never
 * overwrite what the user types after the first save.
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
});
