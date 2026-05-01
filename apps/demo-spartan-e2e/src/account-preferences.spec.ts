import { expect, test } from '@playwright/test';

/**
 * fill → blur → observe-error
 *
 * The single E2E spec for the Spartan reference. Covers the same surface as
 * the smoke spec but through the real Vite-compiled bundle, so any broken
 * provider wiring (renderer-token registration, hint-registry projection,
 * auto-ARIA selector matching against `[brnInput]`) surfaces here.
 */
test('Spartan reference wrapper - fill, blur, and observe error wiring', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const displayName = page.getByLabel('Display name');
  await expect(displayName).toBeVisible();

  // Initial state: no error rendered, aria-invalid not "true".
  await expect(displayName).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#display-name-error')).toHaveCount(0);

  // Fill empty value, blur via Tab. on-touch strategy now reveals the error.
  await displayName.click();
  await displayName.press('Tab');

  // Toolkit owns aria-invalid + aria-describedby on the bound control.
  await expect(displayName).toHaveAttribute('aria-invalid', 'true');
  const describedBy = await displayName.getAttribute('aria-describedby');
  expect(describedBy ?? '').toContain('display-name-error');

  // The hlm-error slot rendered through the configured renderer.
  const error = page.locator('#display-name-error');
  await expect(error).toBeVisible();
  await expect(error).toContainText(/display name is required/i);
});
