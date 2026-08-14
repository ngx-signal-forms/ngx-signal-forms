import { expect, test } from '@playwright/test';
import { ServerIntegrationPage } from '../../page-objects/server-integration.page';

/**
 * Advanced Scenarios - Server Integration - E2E Tests
 * Route: /advanced-scenarios/server-integration
 *
 * Covers the "edit record" flow: `resource()` prefill, a Save that can be
 * rejected by the fake server (a `taken@example.com` email trips both a
 * form-level banner and a field error via a native `TreeValidationResult`),
 * editing to clear the server error, a successful save that re-baselines the
 * form as pristine, and a reload that restores the last-saved record.
 *
 * Determinism note: `ProfileApiService` (server-integration.api.ts) is a
 * plain in-memory fake gated by a real `setTimeout(400ms)` — it does not go
 * through `HttpClient`/MSW, so there is no request to gate with `page.route`.
 * Racing that real 400ms window against page-load/bootstrap time is exactly
 * the kind of flake this suite avoids elsewhere with `page.route` gating: a
 * contended dev server can push Angular's bootstrap itself past 400ms, so the
 * loading state can resolve — and vanish — before it is ever observed.
 *
 * Playwright's Clock API cannot fix this: pausing time from before
 * navigation (the only way to guarantee the 400ms `setTimeout` never fires
 * early) also freezes the timers Angular's own zoneless change-detection
 * scheduler needs, so the page never renders past the app shell at all —
 * verified directly (with the clock paused pre-navigation, neither the
 * loading indicator nor the form ever mounted, even after `fastForward`).
 * Instead, `ServerIntegrationPage.holdPrefillTimer()` installs an init
 * script that intercepts only the one `setTimeout` call requesting exactly
 * 400ms and holds it unfired until the test explicitly releases it — every
 * other timer (Angular's own scheduling included) passes through untouched.
 * See that method's doc comment for the full mechanism. That test therefore
 * runs on its own, outside the shared `beforeEach`, so the hold can be
 * installed before `goto()`.
 */
test.describe('Advanced Scenarios - Server Integration', () => {
  test('shows a loading indicator before the profile resource resolves, then prefills pristine', async ({
    page,
  }) => {
    const serverIntegration = new ServerIntegrationPage(page);
    await serverIntegration.holdPrefillTimer();
    await serverIntegration.goto();

    // The prefill's `setTimeout` is held, so this can never race — the
    // indicator is guaranteed to still be mounted regardless of how long
    // bootstrap took.
    await expect(serverIntegration.loadingIndicator).toBeVisible();

    await serverIntegration.releasePrefillTimer();

    await expect(serverIntegration.loadingIndicator).toBeHidden();
    await expect(serverIntegration.nameInput).toHaveValue('Grace Hopper');
    await expect(serverIntegration.emailInput).toHaveValue('grace@example.com');
    await expect(serverIntegration.debugLine('dirty', false)).toBeVisible();
    await expect(serverIntegration.debugLine('touched', false)).toBeVisible();
  });
});

test.describe('Advanced Scenarios - Server Integration (loaded)', () => {
  let serverIntegration: ServerIntegrationPage;

  test.beforeEach(async ({ page }) => {
    serverIntegration = new ServerIntegrationPage(page);
    await serverIntegration.goto();
    await expect(serverIntegration.loadingIndicator).toBeHidden();
  });

  test('disables Save when Name is cleared', async () => {
    await expect(serverIntegration.saveButton).toBeEnabled();

    await serverIntegration.nameInput.fill('');

    await expect(serverIntegration.saveButton).toBeDisabled();
    await expect(serverIntegration.debugLine('invalid', true)).toBeVisible();
  });

  test('rejects a taken email with a form banner and a field error, and clears both once Email is edited', async () => {
    await test.step('submitting taken@example.com surfaces the banner and the field error', async () => {
      await serverIntegration.emailInput.fill('taken@example.com');
      await serverIntegration.save();

      await expect(serverIntegration.saveButton).toHaveText('Saving…');
      await expect(serverIntegration.saveButton).toBeDisabled();

      await expect(serverIntegration.formBanner).toBeVisible();
      await expect(serverIntegration.formBanner).toContainText(
        'Please fix the errors below.',
      );
      await expect(serverIntegration.emailFieldError).toBeVisible();
      await expect(serverIntegration.emailInput).toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });

    await test.step('editing Email clears the field error and the root submission error', async () => {
      await serverIntegration.emailInput.fill('grace.fixed@example.com');

      await expect(serverIntegration.emailFieldError).toHaveCount(0);
      await expect(serverIntegration.formBanner).toHaveCount(0);
      await expect(serverIntegration.emailInput).not.toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });
  });

  test('a successful save resets dirty/touched, and reloading restores the saved values', async () => {
    await test.step('saving valid changes shows the success state and re-baselines pristine', async () => {
      await serverIntegration.nameInput.fill('Grace M. Hopper');
      await serverIntegration.emailInput.fill('grace.hopper@navy.mil');
      await serverIntegration.save();

      await expect(serverIntegration.saveButton).toHaveText('Saving…');
      await expect(serverIntegration.successBanner).toBeVisible();
      await expect(serverIntegration.saveButton).toHaveText('Save profile');

      await expect(serverIntegration.debugLine('dirty', false)).toBeVisible();
      await expect(serverIntegration.debugLine('touched', false)).toBeVisible();
      // The fields keep showing what was typed — reset(value) re-baselines,
      // it does not blank the form.
      await expect(serverIntegration.nameInput).toHaveValue('Grace M. Hopper');
      await expect(serverIntegration.emailInput).toHaveValue(
        'grace.hopper@navy.mil',
      );
    });

    await test.step('reload from server restores the just-saved record and settles pristine', async () => {
      // Dirty the form with an unsaved edit first — otherwise the fields
      // already showing the saved values would make the assertions below
      // pass even if Reload were a no-op.
      await serverIntegration.nameInput.fill('Unsaved Local Edit');
      await expect(serverIntegration.debugLine('dirty', true)).toBeVisible();

      await serverIntegration.reload();

      await expect(serverIntegration.reloadButton).toHaveText('Reloading…');
      await expect(serverIntegration.reloadButton).toHaveText(
        'Reload from server',
      );

      // The unsaved edit is gone; the last *saved* values come back.
      await expect(serverIntegration.nameInput).toHaveValue('Grace M. Hopper');
      await expect(serverIntegration.emailInput).toHaveValue(
        'grace.hopper@navy.mil',
      );
      await expect(serverIntegration.debugLine('dirty', false)).toBeVisible();
      await expect(serverIntegration.debugLine('touched', false)).toBeVisible();
    });
  });
});
