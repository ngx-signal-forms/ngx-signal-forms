import { expect, test, type Page } from '@playwright/test';

/**
 * Live Store Binding - E2E Tests
 * Route: /advanced-scenarios/store-binding
 *
 * Verifies the two-way binding between the form and the NgRx SignalStore via
 * the `delegatedStoreField` helper: form edits write straight back to the store
 * (no draft/commit buffer), and out-of-band store mutations flow back into the
 * inputs through the `linkedSignal` read seam.
 *
 * Locators are scoped to the form because the site chrome also exposes a
 * "Change theme" control, which would otherwise collide with the Theme field.
 */

const formScope = (page: Page) => page.locator('form');

test.describe('Advanced Scenarios - Live Store Binding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/advanced-scenarios/store-binding`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should render the form seeded from the store', async ({ page }) => {
    const form = formScope(page);
    await expect(form.getByLabel('Display name')).toHaveValue('Ada Lovelace');
    await expect(form.getByLabel('Email')).toHaveValue('ada@example.com');
    await expect(form.getByLabel('Theme')).toHaveValue('system');
    await expect(form.getByLabel('Newsletter')).toBeChecked();
  });

  test('should write every keystroke straight into the store snapshot', async ({
    page,
  }) => {
    const form = formScope(page);
    const snapshot = form
      .locator('section')
      .filter({ hasText: 'Live store snapshot' });

    await form.getByLabel('Display name').fill('Grace Hopper');
    await expect(snapshot).toContainText('Grace Hopper');

    await form.getByLabel('Theme').selectOption('dark');
    await expect(snapshot).toContainText('dark');

    await form.getByLabel('Newsletter').uncheck();
    await expect(snapshot).toContainText('false');
  });

  test('should reflect out-of-band store mutations back into the inputs', async ({
    page,
  }) => {
    const form = formScope(page);
    await page.getByRole('button', { name: 'Simulate remote sync' }).click();

    // Read seam: the store mutation lands in the form inputs with no commit.
    await expect(form.getByLabel('Display name')).toHaveValue('Remote Admin');
    await expect(form.getByLabel('Theme')).toHaveValue('dark');
    await expect(form.getByLabel('Newsletter')).not.toBeChecked();
    // Fields left untouched by the remote sync keep their value.
    await expect(form.getByLabel('Email')).toHaveValue('ada@example.com');
  });

  test('should restore defaults through the store on reset', async ({
    page,
  }) => {
    const form = formScope(page);
    await form.getByLabel('Display name').fill('Changed Name');
    await form.getByLabel('Newsletter').uncheck();

    await page.getByRole('button', { name: 'Reset store' }).click();

    await expect(form.getByLabel('Display name')).toHaveValue('Ada Lovelace');
    await expect(form.getByLabel('Email')).toHaveValue('ada@example.com');
    await expect(form.getByLabel('Theme')).toHaveValue('system');
    await expect(form.getByLabel('Newsletter')).toBeChecked();
  });
});
