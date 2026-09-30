import { httpResource } from '@angular/common/http';
import {
  withResource,
  withSessionStorage,
  withStorageSync,
} from '@ngrx-toolkit/core';
import {
  patchState,
  signalStoreFeature,
  type,
  withComputed,
  withHooks,
  withState,
} from '@ngrx/signals';
import {
  extendResource,
  withPreviousValueOnLoading,
  withValueOnError,
} from '@ngrx/signals/resource';

import type { WizardDraft } from '../../schemas/wizard.schemas';

/**
 * `sessionStorage` key that holds the id of the auto-saved draft, and nothing
 * else. The draft itself (names, passport number, dates) stays on the server.
 */
export const WIZARD_DRAFT_STORAGE_KEY = 'ngx-demo:advanced-wizard-draft';

/**
 * Resumes the last auto-saved draft of this browser tab.
 *
 * Keeps `draftId` in `sessionStorage` and loads that draft as the `savedDraft`
 * resource (`savedDraftValue`, `savedDraftIsLoading`, `savedDraftError`, ...).
 * The route-scoped store is new on every visit, so every visit resumes.
 */
export function withSavedDraft() {
  return signalStoreFeature(
    { state: type<{ draftId: string | null }>() },

    withState({
      /** The stored draft id when the store started. Set once, in `onInit`. */
      resumeDraftId: null as string | null,
    }),

    // Hydrates `draftId` in its own `onInit`, before the hook below runs.
    withStorageSync(
      {
        key: WIZARD_DRAFT_STORAGE_KEY,
        select: ({ draftId }) => ({ draftId }),
      },
      withSessionStorage(),
    ),

    // The extensions own the loading and error policy, so `withResource`
    // keeps the native behavior instead of adding its own.
    withResource(
      ({ resumeDraftId }) => ({
        savedDraft: extendResource(
          // The request reads `resumeDraftId`, not `draftId`. The first
          // successful save sets `draftId`; if the request read it, the
          // resource would reload and overwrite what the user is editing.
          httpResource<WizardDraft>(() => {
            const draftId = resumeDraftId();
            return draftId === null
              ? undefined
              : `/api/wizard/draft/${draftId}`;
          }),
          withPreviousValueOnLoading(),
          withValueOnError(undefined),
        ),
      }),
      { errorHandling: 'native' },
    ),

    withComputed((store) => ({
      /**
       * The stored draft failed to load and no new draft has saved since. The
       * one-shot resource stays in `error`, so the id check tells the two apart.
       */
      resumeFailed: () =>
        store.savedDraftStatus() === 'error' &&
        store.draftId() === store.resumeDraftId(),
    })),

    withHooks({
      onInit(store) {
        patchState(store, { resumeDraftId: store.draftId() });
      },
    }),
  );
}
