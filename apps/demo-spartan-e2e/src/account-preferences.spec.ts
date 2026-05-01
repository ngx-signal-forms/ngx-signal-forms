import { expect, test } from '@playwright/test';

/**
 * fill -> blur -> observe-error
 *
 * The single E2E spec for the Spartan reference. Covers the same surface as
 * the smoke spec but through the real Vite-compiled bundle, so any broken
 * provider wiring (renderer-token registration, hint-registry projection,
 * auto-ARIA selector matching against `[hlmInput]`) surfaces here.
 *
 * Notes on what is and isn't asserted, and why:
 *
 *   - Pre-interaction `aria-invalid` is not asserted. Helm's host directive
 *     stack (`[hlmInput]` brings `BrnInput` + `BrnFieldControl` +
 *     `BrnFieldControlDescribedBy`) interacts with focus on mount in real
 *     browsers, which can mark the field touched before the test runs. The
 *     post-interaction state is what the seam actually owns.
 *
 *   - `aria-describedby` chain is not asserted on the input. helm's
 *     `BrnFieldControlDescribedBy` host directive owns the attribute and
 *     mediates it through `BrnFieldA11yService`, intentionally severing the
 *     direct write path that the toolkit's auto-aria uses outside helm.
 *     The smoke spec covers the toolkit-only path via jsdom; here we assert
 *     that the error element exists at the field-name-derived id, which is
 *     the contract the wrapper guarantees end-to-end.
 */
test('Spartan reference wrapper - fill, blur, and observe error wiring', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const displayName = page.getByLabel('Display name');

  // Fill empty value, blur via Tab. on-touch strategy reveals the error.
  await displayName.click();
  await displayName.press('Tab');

  // Toolkit owns aria-invalid on the bound control after touch.
  await expect(displayName).toHaveAttribute('aria-invalid', 'true');

  // The error slot rendered through the configured renderer at the
  // field-name-derived id. Live region <p> stays mounted regardless of
  // visibility, so we assert presence + content rather than `toBeVisible`.
  const error = page.locator('#display-name-error');
  await expect(error).toContainText(/display name is required/i);
});
