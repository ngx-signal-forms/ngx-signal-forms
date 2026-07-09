import { Injectable } from '@angular/core';
import type { ProfileFormModel } from './server-integration.model';

/**
 * Fake "profile" API for the server-integration demo.
 *
 * Deliberately **not** real HTTP (no `HttpClient`, no MSW handler) — the
 * point of this demo is the Signal Forms submission contract, not a
 * networking layer. `loadProfile()` / `saveProfile()` resolve after an
 * in-memory `setTimeout` delay, which is enough to exercise `resource()`
 * loading state and `submitting()` without any test/CI networking concerns.
 */
const SIMULATED_LATENCY_MS = 400;

/** Email that the fake backend always rejects, to demonstrate server-side field errors. */
export const TAKEN_EMAIL = 'taken@example.com';

export interface SaveProfileSuccess {
  ok: true;
}

export interface SaveProfileFailure {
  ok: false;
  /** Field-level messages, keyed by model property. */
  fieldErrors: Partial<Record<keyof ProfileFormModel, string>>;
  /** General, not-tied-to-one-field message for the form-level banner. */
  formError: string;
}

export type SaveProfileResult = SaveProfileSuccess | SaveProfileFailure;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  /** In-memory "database" — the only persistent state this fake API has. */
  #record: ProfileFormModel = {
    name: 'Grace Hopper',
    email: 'grace@example.com',
  };

  /** Simulates `GET /profile/me`. */
  async loadProfile(): Promise<ProfileFormModel> {
    await delay(SIMULATED_LATENCY_MS);
    return { ...this.#record };
  }

  /**
   * Simulates `PUT /profile/me`. Rejects whenever the email is
   * {@link TAKEN_EMAIL}, returning both a field-level message (for the email
   * field) and a general message (for the form-level banner) — mirroring a
   * typical REST validation-error payload:
   * `{ fieldErrors: { email: '...' }, formError: '...' }`.
   */
  async saveProfile(model: ProfileFormModel): Promise<SaveProfileResult> {
    await delay(SIMULATED_LATENCY_MS);

    if (model.email.trim().toLowerCase() === TAKEN_EMAIL) {
      return {
        ok: false,
        fieldErrors: { email: 'This email is already taken.' },
        formError: 'Please fix the errors below.',
      };
    }

    this.#record = { ...model };
    return { ok: true };
  }
}
