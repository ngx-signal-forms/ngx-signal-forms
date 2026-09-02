/**
 * Autosave Model
 *
 * Model for the autosave example: a small profile form that persists valid,
 * dirty changes to the server as the user types — no submit button.
 */

export interface AutosaveProfileModel {
  displayName: string;
  bio: string;
}

export function createInitialAutosaveProfile(): AutosaveProfileModel {
  return {
    displayName: 'Ada Lovelace',
    bio: 'Mathematician and writer, first to publish an algorithm for a computing machine.',
  };
}
