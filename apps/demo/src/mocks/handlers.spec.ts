import { getResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `main.ts` awaits this module before it starts Angular. If reading the stored
 * drafts throws, the whole demo stays blank. A bad stored value must only cost
 * the stored drafts.
 */
describe('wizard mock drafts storage', () => {
  const DRAFTS_STORAGE_KEY = 'ngx-demo:mock-wizard-drafts';

  /** Loads the handlers the way a page load does, then sends one request. */
  async function send(path: string, init?: RequestInit): Promise<Response> {
    const { wizardHandlers } = await import('./handlers');
    const response = await getResponse(
      wizardHandlers,
      new Request(`${location.origin}${path}`, init),
    );
    if (!response) {
      throw new Error(`No mock handler for ${path}`);
    }
    return response;
  }

  beforeEach(() => {
    sessionStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it.each([
    ['text that is not JSON', 'not json'],
    ['JSON that is not a list of entries', '{"draftId":"legacy"}'],
  ])('starts with no drafts when storage holds %s', async (_, value) => {
    sessionStorage.setItem(DRAFTS_STORAGE_KEY, value);

    const response = await send('/api/wizard/draft/legacy');

    expect(response.status).toBe(404);
  });

  it('resumes drafts that an earlier page load stored', async () => {
    const created = await send('/api/wizard/draft', {
      method: 'POST',
      body: JSON.stringify({
        traveler: { firstName: 'Ada' },
        destinations: [],
      }),
    });
    const { draftId } = (await created.json()) as { draftId: string };

    // A reload runs the module again, with the same `sessionStorage`.
    vi.resetModules();
    const loaded = await send(`/api/wizard/draft/${draftId}`);

    expect(loaded.status).toBe(200);
    expect(await loaded.json()).toMatchObject({
      traveler: { firstName: 'Ada' },
    });
  });
});
