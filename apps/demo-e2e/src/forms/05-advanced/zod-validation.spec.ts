import { expect, test, type Page } from '@playwright/test';

import { ROLE_ALERT_SELECTOR } from '../../fixtures/aria-selectors';

function fieldWrapper(page: Page, label: string) {
  return page.locator('ngx-form-field-wrapper', {
    has: page.getByLabel(label, { exact: true }),
  });
}

function fieldAlert(page: Page, label: string) {
  return fieldWrapper(page, label).locator(ROLE_ALERT_SELECTOR);
}

test.describe('Advanced Scenarios - Zod-Only Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/advanced-scenarios/zod-validation');
    await page.waitForLoadState('domcontentloaded');
  });

  test('renders baseline guidance and form controls', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: 'Zod-Only Validation' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'Zod-Only Validation Demo',
      }),
    ).toBeVisible();
    await expect(
      page.getByText('Zod baseline wiring', { exact: true }),
    ).toBeVisible();

    await expect(page.getByLabel('First name', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Save baseline form' }),
    ).toBeVisible();
  });

  test('shows structural Zod errors for empty submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Save baseline form' }).click();

    await expect(fieldAlert(page, 'First name')).toContainText(
      'First name is required',
    );
    await expect(fieldAlert(page, 'Last name')).toContainText(
      'Last name is required',
    );
    await expect(fieldAlert(page, 'Email')).toContainText(
      'Enter a valid email address',
    );
    await expect(fieldAlert(page, 'Password')).toContainText(
      'Password must be at least 12 characters',
    );
    await expect(fieldAlert(page, 'Account type')).toContainText(
      'Choose an account type',
    );
    await expect(fieldAlert(page, 'Country')).toContainText('Choose a country');
  });

  test('submits successfully with valid baseline data', async ({ page }) => {
    await page.getByLabel('First name', { exact: true }).fill('Arjen');
    await page.getByLabel('Last name', { exact: true }).fill('Althoff');
    await page.getByLabel('Email', { exact: true }).fill('arjen@company.com');
    await page
      .getByLabel('Password', { exact: true })
      .fill('baseline-pass-123');
    await page
      .getByLabel('Account type', { exact: true })
      .selectOption('business');
    await page.getByLabel('Country', { exact: true }).selectOption('DE');

    await page.getByRole('button', { name: 'Save baseline form' }).click();

    await expect(
      page.getByText(
        'Saved. This route uses only Zod structural validation through validateStandardSchema.',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(page.locator(ROLE_ALERT_SELECTOR)).toHaveCount(0);
  });
});
