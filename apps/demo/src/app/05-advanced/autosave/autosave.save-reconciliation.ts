import type { AutosaveProfileModel } from './autosave.model';

/**
 * Decides which fields a just-resolved save may mark pristine.
 *
 * `httpResource` is last-write-wins: a new PATCH cancels an in-flight one, so
 * two nearly-simultaneous saves can never both land. What can still happen
 * without this check is a **lost update**: if the user edits `bio` while a
 * `displayName`-only PATCH is in flight, a naive "reset the whole form on
 * success" would mark `bio` pristine too — even though the value the server
 * just confirmed never included that edit. The next keystroke wouldn't
 * re-trigger a save for it, because nothing would look dirty anymore.
 *
 * A field is safe to mark saved only when both hold:
 * 1. it was actually part of the resolved request (`snapshot`, captured at
 *    the moment the request was built — see `saveResource` in
 *    `autosave.form.ts`), and
 * 2. its value right now still equals what was sent — i.e. no further edit
 *    raced the in-flight request.
 *
 * A field that fails either check is left dirty, so the next debounce cycle
 * autosaves it for real instead of silently dropping it.
 */
export function fieldsSafeToMarkSaved(
  snapshot: Partial<AutosaveProfileModel> | undefined,
  current: AutosaveProfileModel,
): (keyof AutosaveProfileModel)[] {
  if (!snapshot) return [];

  const safe: (keyof AutosaveProfileModel)[] = [];

  if (
    snapshot.displayName !== undefined &&
    snapshot.displayName === current.displayName
  ) {
    safe.push('displayName');
  }
  if (snapshot.bio !== undefined && snapshot.bio === current.bio) {
    safe.push('bio');
  }

  return safe;
}
