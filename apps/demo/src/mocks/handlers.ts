import { delay, http, HttpResponse } from 'msw';

import type {
  Destination,
  Traveler,
} from '../app/05-advanced/advanced-wizard/schemas/wizard.schemas';

// ══════════════════════════════════════════════════════════════════════════════
// IN-MEMORY STORAGE (simulates database)
// ══════════════════════════════════════════════════════════════════════════════

interface DraftData {
  traveler: Traveler;
  destinations: Destination[];
}

interface StoredDraft extends DraftData {
  draftId: string;
  savedAt: string;
}

interface StoredBooking {
  bookingId: string;
  confirmationNumber: string;
  status: 'confirmed' | 'pending';
  trip: DraftData;
  createdAt: string;
}

const drafts = new Map<string, StoredDraft>();
const bookings = new Map<string, StoredBooking>();

// ══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════════════════════

function generateId(): string {
  return crypto.randomUUID();
}

function generateConfirmationNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TRV-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// WIZARD API HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

export const wizardHandlers = [
  // Create new draft
  http.post('/api/wizard/draft', async ({ request }) => {
    await delay(300); // Simulate network latency

    const data = (await request.json()) as DraftData;
    const draftId = generateId();
    const savedAt = new Date().toISOString();

    const draft: StoredDraft = {
      ...data,
      draftId,
      savedAt,
    };

    drafts.set(draftId, draft);

    console.log('[MSW] Created draft:', draftId);

    return HttpResponse.json({
      draftId,
      savedAt,
    });
  }),

  // Update existing draft
  http.put('/api/wizard/draft/:draftId', async ({ params, request }) => {
    await delay(200);

    const { draftId } = params as { draftId: string };
    const data = (await request.json()) as DraftData;

    if (!drafts.has(draftId)) {
      return HttpResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const savedAt = new Date().toISOString();
    const draft: StoredDraft = {
      ...data,
      draftId,
      savedAt,
    };

    drafts.set(draftId, draft);

    console.log('[MSW] Updated draft:', draftId);

    return HttpResponse.json({
      draftId,
      savedAt,
    });
  }),

  // Load draft
  http.get('/api/wizard/draft/:draftId', async ({ params }) => {
    await delay(200);

    const { draftId } = params as { draftId: string };
    const draft = drafts.get(draftId);

    if (!draft) {
      return HttpResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    console.log('[MSW] Loaded draft:', draftId);

    return HttpResponse.json({
      traveler: draft.traveler,
      destinations: draft.destinations,
    });
  }),

  // Delete draft
  http.delete('/api/wizard/draft/:draftId', async ({ params }) => {
    await delay(100);

    const { draftId } = params as { draftId: string };

    if (!drafts.has(draftId)) {
      return HttpResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    drafts.delete(draftId);

    console.log('[MSW] Deleted draft:', draftId);

    return HttpResponse.json({ success: true });
  }),

  // Submit booking
  http.post('/api/wizard/booking', async ({ request }) => {
    await delay(500); // Simulate longer processing time

    const trip = (await request.json()) as DraftData;

    // Basic validation
    if (!trip.traveler?.firstName || !trip.destinations?.length) {
      return HttpResponse.json(
        { error: 'Invalid booking data' },
        { status: 400 },
      );
    }

    const bookingId = generateId();
    const confirmationNumber = generateConfirmationNumber();

    const booking: StoredBooking = {
      bookingId,
      confirmationNumber,
      status: 'confirmed',
      trip,
      createdAt: new Date().toISOString(),
    };

    bookings.set(bookingId, booking);

    console.log('[MSW] Created booking:', confirmationNumber);

    return HttpResponse.json({
      bookingId,
      confirmationNumber,
      status: 'confirmed',
    });
  }),

  // Get booking status
  http.get('/api/wizard/booking/:bookingId', async ({ params }) => {
    await delay(150);

    const { bookingId } = params as { bookingId: string };
    const booking = bookings.get(bookingId);

    if (!booking) {
      return HttpResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return HttpResponse.json(booking);
  }),

  // List user's drafts (for demo purposes)
  http.get('/api/wizard/drafts', async () => {
    await delay(200);

    const draftList = Array.from(drafts.values()).map((draft) => ({
      draftId: draft.draftId,
      savedAt: draft.savedAt,
      travelerName:
        `${draft.traveler.firstName} ${draft.traveler.lastName}`.trim() ||
        'Unnamed',
      destinationCount: draft.destinations.length,
    }));

    return HttpResponse.json(draftList);
  }),
];

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

export const handlers = [...wizardHandlers];
