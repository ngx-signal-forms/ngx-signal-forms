import { describe, expect, it } from 'vitest';

import type { AutosaveProfileModel } from './autosave.model';
import { fieldsSafeToMarkSaved } from './autosave.save-reconciliation';

describe('fieldsSafeToMarkSaved', () => {
  it('marks nothing saved when there is no snapshot (nothing was ever sent)', () => {
    const current: AutosaveProfileModel = { displayName: 'Ada', bio: 'Bio' };

    expect(fieldsSafeToMarkSaved(undefined, current)).toEqual([]);
  });

  it('marks a field saved when its current value still matches what was sent', () => {
    const current: AutosaveProfileModel = { displayName: 'Ada', bio: 'Bio' };

    expect(fieldsSafeToMarkSaved({ displayName: 'Ada' }, current)).toEqual([
      'displayName',
    ]);
  });

  it('does not mark a field saved when it changed again while the request was in flight (lost-update guard)', () => {
    // Snapshot reflects what was actually PATCHed; the user kept typing
    // after the request was already sent, so the current value has moved on.
    const current: AutosaveProfileModel = {
      displayName: 'Ada Lovelace',
      bio: 'Bio',
    };

    expect(fieldsSafeToMarkSaved({ displayName: 'Ada' }, current)).toEqual([]);
  });

  it('only reports fields that were actually part of the resolved request', () => {
    // bio changed concurrently and was never included in this snapshot/PATCH.
    const current: AutosaveProfileModel = {
      displayName: 'Ada',
      bio: 'Updated bio',
    };

    expect(fieldsSafeToMarkSaved({ displayName: 'Ada' }, current)).toEqual([
      'displayName',
    ]);
  });

  it('marks multiple fields saved when both still match the snapshot', () => {
    const current: AutosaveProfileModel = { displayName: 'Ada', bio: 'Bio' };

    expect(
      fieldsSafeToMarkSaved({ displayName: 'Ada', bio: 'Bio' }, current),
    ).toEqual(['displayName', 'bio']);
  });
});
