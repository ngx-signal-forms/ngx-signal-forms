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
 * `aria-describedby` is the contract that the wrapper-scoped
 * `BrnFieldA11yService` factory in
 * {@link `apps/demo-spartan/src/app/wrapper/spartan-form-field.ts`}
 * mediates: Brain's `BrnFieldControlDescribedBy` host directive owns the
 * attribute on `[hlmInput]`, but the factory-installed bridge service feeds
 * it from the toolkit's composition so the toolkit-managed `<fieldName>-error`
 * id reaches the helm input host element. This spec asserts that contract
 * end-to-end (the smoke spec covers the same path through jsdom).
 */
test.describe('Spartan account preferences form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('keeps the plan select closed until the user opens it', async ({
    page,
  }) => {
    const plan = page.getByRole('combobox', { name: 'Plan' });

    await test.step('Verify the select starts collapsed with no inline options', async () => {
      await expect(plan).toHaveAttribute('aria-expanded', 'false');
      await expect(page.getByRole('option', { name: 'Starter' })).toHaveCount(
        0,
      );
    });

    await test.step('Open the select and verify options are rendered in the overlay', async () => {
      await plan.focus();
      await plan.press('ArrowDown');

      await expect(page.getByRole('option', { name: 'Starter' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Pro' })).toBeVisible();
      await expect(
        page.getByRole('option', { name: 'Enterprise' }),
      ).toBeVisible();
    });
  });

  test('shows blocking errors and wires aria-describedby after touch', async ({
    page,
  }) => {
    const displayName = page.getByLabel('Display name');

    await test.step('Blur the empty field to trigger on-touch validation', async () => {
      await displayName.click();
      await displayName.press('Tab');
    });

    await test.step('Verify error rendering and aria linkage', async () => {
      await expect(displayName).toHaveAttribute('aria-invalid', 'true');

      const error = page.locator('#display-name-error');
      await expect(error).toContainText(/display name is required/i);
      await expect(displayName).toHaveAttribute(
        'aria-describedby',
        /\bdisplay-name-error\b/,
      );
    });
  });

  test('renders warnings without marking the field invalid and still submits', async ({
    page,
  }) => {
    const displayName = page.getByLabel('Display name');
    const plan = page.getByRole('combobox', { name: 'Plan' });

    await test.step('Enter a short-but-valid display name to trigger the warning path', async () => {
      await displayName.fill('Ada');
      await displayName.press('Tab');

      const warning = page.locator('#display-name-warning');
      await expect(warning).toContainText(
        /short names are accepted but easy to confuse with handles/i,
      );
      await expect(displayName).toHaveAttribute('aria-invalid', 'false');
      await expect(displayName).toHaveAttribute(
        'aria-describedby',
        /\bdisplay-name-warning\b/,
      );
    });

    await test.step('Choose a plan and submit successfully with warnings only', async () => {
      await plan.focus();
      await plan.press('ArrowDown');
      await page.getByRole('option', { name: 'Starter' }).click();
      await page.getByTestId('submit-button').click();

      await expect(page.getByTestId('last-submission')).toContainText(
        '"displayName": "Ada"',
      );
      await expect(page.getByTestId('last-submission')).toContainText(
        '"plan": "starter"',
      );
    });
  });
});
