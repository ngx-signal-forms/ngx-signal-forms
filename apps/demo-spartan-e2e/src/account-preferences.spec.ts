import { expect, test } from '@playwright/test';

/**
 * fill -> blur -> observe-error
 *
 * The single E2E spec for the Spartan reference. Covers the same surface as
 * the smoke spec but through the real Vite-compiled bundle, so any broken
 * provider wiring (renderer-token registration, hint-registry projection,
 * auto-ARIA selector matching against `[hlmInput]`) surfaces here.
 *
 * Pre-interaction `aria-invalid` is not asserted. Helm's host directive stack
 * (`[hlmInput]` brings `BrnInput` + `BrnFieldControl` +
 * `BrnFieldControlDescribedBy`) interacts with focus on mount in real
 * browsers, which can mark the field touched before the test runs. The
 * post-interaction state is what the seam actually owns.
 *
 * `aria-describedby` is the contract that
 * {@link `apps/demo-spartan/src/app/wrapper/spartan-aria-describedby-bridge.ts`}
 * mediates: Brain's `BrnFieldControlDescribedBy` host directive owns the
 * attribute on `[hlmInput]`, but the wrapper-scoped bridge service feeds it
 * from the toolkit's composition so the toolkit-managed `<fieldName>-error`
 * id reaches the helm input host element. This spec asserts that contract
 * end-to-end (the smoke spec covers the same path through jsdom).
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

  // The wrapper-scoped `BrnFieldA11yService` bridge feeds the toolkit's
  // composed id list into Brain's `BrnFieldControlDescribedBy` host binding,
  // so the helm input host element exposes `display-name-error` for AT.
  // This is the contract-level assertion that proves the bridge is wired
  // correctly (without it, Brain's empty service nulls the attribute).
  await expect(displayName).toHaveAttribute(
    'aria-describedby',
    /\bdisplay-name-error\b/,
  );
});
