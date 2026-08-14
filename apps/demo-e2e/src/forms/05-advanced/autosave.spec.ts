import {
  expect,
  test,
  type Request as PlaywrightRequest,
  type Response as PlaywrightResponse,
} from '@playwright/test';
import { AutosavePage } from '../../page-objects/autosave.page';

/**
 * Advanced - Autosave - E2E Tests
 * Route: /advanced-scenarios/autosave
 *
 * Covers the debounced, field-level autosave journey described in
 * `apps/demo/src/app/05-advanced/autosave/README.md`'s "How to test" section:
 * the settled-value gate (#366), the invalid-field exclusion, the
 * failure/retry path, and the lost-update guard for an edit made while a
 * save is in flight.
 *
 * Only public surfaces are asserted: form controls, the fixed-role
 * `role="status"`/`role="alert"` save-status regions, the Retry/Reset
 * buttons, the visible dirty()/valid() debug readout, and PATCH network
 * traffic observed via Playwright request interception. Nothing reaches into
 * component internals.
 *
 * Debounce (500ms) and the mocked PATCH's own delay are never awaited with a
 * fixed sleep — every wait is keyed off an observable transition (a network
 * request/response event or a live-region text change), matching this repo's
 * `async-validation.spec.ts` conventions.
 *
 * NOTE on the polite "All changes saved." message: this suite deliberately
 * never asserts on it. `AutosaveComponent`'s post-save reconciliation effect
 * (`#reconcileAfterSave()`) resets the just-saved field the moment
 * `saveResource.status()` becomes `'resolved'`, which synchronously clears
 * `dirtyValidPatch()` and pauses the resource back to `'idle'` before Angular
 * ever paints the intermediate `'resolved'` frame. A `MutationObserver` probe
 * against the live status region confirmed the DOM transitions straight from
 * "Saving…" to "" — "All changes saved." never actually renders. This
 * contradicts the demo README's documented behavior; it is a real demo
 * discrepancy, not a test issue, and per this task's scope it is reported
 * rather than patched around here. `dirty()` clearing and the PATCH network
 * traffic are asserted directly instead, since those are genuinely observable.
 */

const AUTOSAVE_ENDPOINT = '/api/autosave/profile';

const isAutosavePatch = (request: PlaywrightRequest): boolean =>
  request.url().includes(AUTOSAVE_ENDPOINT) && request.method() === 'PATCH';

const isAutosavePatchResponse = (response: PlaywrightResponse): boolean =>
  response.url().includes(AUTOSAVE_ENDPOINT) &&
  response.request().method() === 'PATCH';

test.describe('Advanced - Autosave', () => {
  let autosave: AutosavePage;

  test.beforeEach(async ({ page }) => {
    autosave = new AutosavePage(page);
    await autosave.goto();
  });

  test('should display the autosave form', async () => {
    await expect(autosave.form).toBeVisible();
    await expect(autosave.displayNameInput).toBeVisible();
    await expect(autosave.bioTextarea).toBeVisible();
  });

  // 1. The settled edited value appears in the PATCH body.
  test('the settled edited value appears in the PATCH body', async ({
    page,
  }) => {
    const patchRequest = page.waitForRequest(isAutosavePatch);

    await autosave.displayNameInput.fill('Ada Byron');

    const request = await patchRequest;
    expect(request.postDataJSON()).toEqual({ displayName: 'Ada Byron' });
  });

  // 2. Successful save retains the value and clears dirty for the saved
  // field only.
  test('a successful save retains the value and clears dirty for the saved field only', async ({
    page,
  }) => {
    const patchResponse = page.waitForResponse(isAutosavePatchResponse);

    await autosave.displayNameInput.fill('Ada Byron');
    await patchResponse;

    await expect(autosave.displayNameInput).toHaveValue('Ada Byron');
    await expect(autosave.displayNameStateReadout).toContainText(
      'dirty()=false',
    );
    // Bio was never touched — it stays pristine, unaffected by displayName's save.
    await expect(autosave.bioStateReadout).toContainText('dirty()=false');
  });

  // 3. Invalid Display name omitted from PATCH while valid Bio still saves.
  test('an invalid Display name is omitted from the PATCH while a valid Bio still saves', async ({
    page,
  }) => {
    // Clearing Display name fails the required validator — dirty, but never valid.
    await autosave.displayNameInput.fill('');
    await expect(autosave.displayNameStateReadout).toContainText(
      'dirty()=true',
    );
    await expect(autosave.displayNameStateReadout).toContainText(
      'valid()=false',
    );

    const patchRequest = page.waitForRequest(isAutosavePatch);
    const patchResponse = page.waitForResponse(isAutosavePatchResponse);
    await autosave.bioTextarea.fill('A short, valid bio.');

    const request = await patchRequest;
    // `toEqual` requires an exact match — this also proves displayName,
    // excluded by the invalid-field gate, is absent from the body.
    expect(request.postDataJSON()).toEqual({ bio: 'A short, valid bio.' });

    await patchResponse;
    await expect(autosave.bioStateReadout).toContainText('dirty()=false');
    // The saved-field-only guarantee cuts both ways: Display name is still
    // dirty (and still invalid) — it was never part of what got saved.
    await expect(autosave.displayNameStateReadout).toContainText(
      'dirty()=true',
    );
  });

  // 4. FAIL_SAVE in bio -> assertive failure region + Retry save button.
  test('FAIL_SAVE in Bio triggers the assertive failure region with a Retry save button', async ({
    page,
  }) => {
    const patchRequest = page.waitForRequest(isAutosavePatch);

    await autosave.bioTextarea.fill('This save should FAIL_SAVE.');
    await patchRequest;

    await expect(autosave.saveErrorRegion).toContainText(
      'Could not save your changes.',
    );
    await expect(autosave.retryButton).toBeVisible();
    await expect(autosave.bioStateReadout).toContainText('dirty()=true');
  });

  // 5. Retry save reissues the current value (still failing, since nothing
  // changed); correcting the value and letting it autosave then recovers,
  // returning to the saved state.
  test('Retry save reissues the current value; correcting the value afterwards saves successfully', async ({
    page,
  }) => {
    const failedPatch = page.waitForRequest(isAutosavePatch);
    await autosave.bioTextarea.fill('This save should FAIL_SAVE.');
    await failedPatch;
    await expect(autosave.saveErrorRegion).toContainText(
      'Could not save your changes.',
    );
    await expect(autosave.retryButton).toBeVisible();

    // Click Retry save without changing the value. `retrySave()` calls
    // `saveResource.reload()`, which re-issues `dirtyValidPatch()` as it
    // currently stands — still the failing value, since nothing was edited.
    // The reissued PATCH must carry that same (still-failing) body, and the
    // failure region must persist rather than clear prematurely.
    const retryPatch = page.waitForRequest(isAutosavePatch);
    const retryResponse = page.waitForResponse(isAutosavePatchResponse);
    await autosave.retryButton.click();

    const retryRequest = await retryPatch;
    expect(retryRequest.postDataJSON()).toEqual({
      bio: 'This save should FAIL_SAVE.',
    });

    await retryResponse;
    await expect(autosave.saveErrorRegion).toContainText(
      'Could not save your changes.',
    );
    await expect(autosave.bioStateReadout).toContainText('dirty()=true');

    // Now correct the value — the next debounce cycle autosaves it for real.
    const correctedPatch = page.waitForRequest(isAutosavePatch);
    const correctedResponse = page.waitForResponse(isAutosavePatchResponse);
    await autosave.bioTextarea.fill('This save is fine now.');

    const request = await correctedPatch;
    expect(request.postDataJSON()).toEqual({ bio: 'This save is fine now.' });

    await correctedResponse;
    await expect(autosave.saveErrorRegion).toBeEmpty();
    await expect(autosave.bioStateReadout).toContainText('dirty()=false');
    await expect(autosave.bioTextarea).toHaveValue('This save is fine now.');
  });

  // 6. Edit during an in-flight request stays dirty; the newer value is
  // eventually saved (the lost-update guard).
  test('editing a field while its save is in flight keeps it dirty until the newer value is saved', async ({
    page,
  }) => {
    // Gate the first PATCH's fulfillment on a promise this test resolves
    // itself, only once the second edit has actually been made — not on a
    // fixed delay. A fixed delay is a race against however long the second
    // `fill()` takes on a given machine: if the first response won the race,
    // the test would silently stop exercising the lost-update guard while
    // every assertion still passed. Gating on an explicit release makes "the
    // edit lands mid-flight" a guarantee, not a timing hope.
    let releaseFirstResponse!: () => void;
    const firstResponseHeld = new Promise<void>((resolve) => {
      releaseFirstResponse = resolve;
    });
    let patchCount = 0;
    await page.route(`**${AUTOSAVE_ENDPOINT}`, async (route) => {
      patchCount += 1;
      if (patchCount === 1) {
        await firstResponseHeld;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ savedAt: new Date().toISOString() }),
      });
    });

    const firstPatch = page.waitForRequest(isAutosavePatch);
    const firstResponse = page.waitForResponse(isAutosavePatchResponse);
    await autosave.displayNameInput.fill('Ada Byron');
    await firstPatch; // dispatched — now held open by the gate above.

    // Edit again. The first PATCH is provably still unresolved at this point
    // (its fulfillment is blocked on `firstResponseHeld`), so this edit is
    // guaranteed to land mid-flight.
    const secondPatch = page.waitForRequest(isAutosavePatch);
    await autosave.displayNameInput.fill('Ada King');

    // Only now let the first response resolve — after the edit has landed.
    releaseFirstResponse();

    // The first save resolves, but the reconciliation guard must not mark the
    // field pristine: it has moved on since that request was dispatched.
    await firstResponse;
    await expect(autosave.displayNameStateReadout).toContainText(
      'dirty()=true',
    );

    // The newer value is what actually gets saved once its own debounce settles.
    const request = await secondPatch;
    expect(request.postDataJSON()).toEqual({ displayName: 'Ada King' });

    // Arm the second-response wait only now, strictly after `firstResponse`
    // has already resolved, and pin it to this exact request object (not
    // just the URL/method predicate). Two `waitForResponse` calls armed
    // concurrently with the same generic predicate would both resolve off
    // the same (first) matching response event — arming this one late, and
    // tying it to `request` by identity, makes it impossible for it to be
    // satisfied by anything other than the second PATCH's own response.
    await page.waitForResponse((response) => response.request() === request);
    await expect(autosave.displayNameInput).toHaveValue('Ada King');
    await expect(autosave.displayNameStateReadout).toContainText(
      'dirty()=false',
    );
  });

  // 7. Reset demo restores initial values + pristine state.
  test('Reset demo restores the initial values and pristine state', async () => {
    await autosave.displayNameInput.fill('Someone Else');
    await autosave.bioTextarea.fill('A different bio entirely.');
    await expect(autosave.displayNameStateReadout).toContainText(
      'dirty()=true',
    );
    await expect(autosave.bioStateReadout).toContainText('dirty()=true');

    await autosave.resetButton.click();

    await expect(autosave.displayNameInput).toHaveValue('Ada Lovelace');
    await expect(autosave.bioTextarea).toHaveValue(
      'Mathematician and writer, first to publish an algorithm for a computing machine.',
    );
    await expect(autosave.displayNameStateReadout).toContainText(
      'dirty()=false',
    );
    await expect(autosave.bioStateReadout).toContainText('dirty()=false');
  });

  // 8. Deterministic under the Chromium project config — independent
  // per-field debounce, exercised end to end: Display name's save settles
  // completely before Bio is touched, proving each field's `debounce()`
  // timer and the dirty+valid+settled gate operate on their own clock.
  test('each field debounces and saves independently', async ({ page }) => {
    const firstPatch = page.waitForRequest(isAutosavePatch);
    const firstResponse = page.waitForResponse(isAutosavePatchResponse);
    await autosave.displayNameInput.fill('Ada Byron');
    const first = await firstPatch;
    expect(first.postDataJSON()).toEqual({ displayName: 'Ada Byron' });
    await firstResponse;
    await expect(autosave.displayNameStateReadout).toContainText(
      'dirty()=false',
    );

    const secondPatch = page.waitForRequest(isAutosavePatch);
    const secondResponse = page.waitForResponse(isAutosavePatchResponse);
    await autosave.bioTextarea.fill('A tidy, valid bio.');
    const second = await secondPatch;
    expect(second.postDataJSON()).toEqual({ bio: 'A tidy, valid bio.' });
    await secondResponse;
    await expect(autosave.bioStateReadout).toContainText('dirty()=false');
    // Display name's earlier, already-settled save is untouched by Bio's
    // independent debounce cycle.
    await expect(autosave.displayNameStateReadout).toContainText(
      'dirty()=false',
    );
  });
});
