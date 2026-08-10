/**
 * Autosave API constants
 *
 * The autosave demo routes through a **real** MSW handler (see
 * `apps/demo/src/mocks/handlers.ts`) via `httpResource`, unlike
 * `server-integration`'s in-memory fake service — this file only holds the
 * endpoint and the magic value that makes the fake backend reject a save, so
 * the client and the handler agree on both without duplicating literals.
 */

/** Endpoint the autosave `httpResource` PATCHes dirty, valid changes to. */
export const AUTOSAVE_ENDPOINT = '/api/autosave/profile';

/**
 * Substring that makes the fake backend reject the save with a 500, so the
 * demo's failure + retry path is reachable without waiting on a real error.
 */
export const AUTOSAVE_FAILURE_MARKER = 'FAIL_SAVE';
