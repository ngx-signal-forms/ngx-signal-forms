import { expect, test, type Page } from '@playwright/test';

function fieldWrapper(page: Page, label: string) {
  return page.locator('ngx-form-field-wrapper', {
    has: page.getByLabel(label, { exact: true }),
  });
}

function fieldAlert(page: Page, label: string) {
  return fieldWrapper(page, label).locator('[role="alert"]');
}

function fieldStatus(page: Page, label: string) {
  return fieldWrapper(page, label).locator('[role="status"]');
}

test.describe('Advanced Scenarios - Zod + Vest Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/advanced-scenarios/zod-vest-validation');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Zod + Vest Validation - renders layered guidance and form controls', async ({
    page,
  }) => {
    await test.step('Verify the layered guidance copy is visible', async () => {
      await expect(
        page.getByRole('heading', {
          level: 2,
          name: 'Zod + Vest Validation Demo',
        }),
      ).toBeVisible();
      await expect(
        page.getByText('Zod handles the baseline', { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText('Vest handles business policy', { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(
          'Blocking errors and warn() guidance come from the same Vest run.',
          { exact: false },
        ),
      ).toBeVisible();
      await expect(
        page.getByText(
          'Try including your first or last name in the password to trigger a Vest business-policy error. Remove special characters or the VAT country prefix to see non-blocking Vest warnings rendered by the same wrapper-driven assistive UI used for blocking errors.',
          { exact: true },
        ),
      ).toBeVisible();
    });

    await test.step('Verify the form fields are available', async () => {
      await expect(
        page.getByLabel('First name', { exact: true }),
      ).toBeVisible();
      await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Provision account' }),
      ).toBeVisible();
    });
  });

  test('Zod + Vest Validation - shows baseline Zod errors for empty submission', async ({
    page,
  }) => {
    await test.step('Submit the empty form', async () => {
      await page.getByRole('button', { name: 'Provision account' }).click();
    });

    await test.step('Verify structural validation messages are shown', async () => {
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
      await expect(fieldAlert(page, 'Country')).toContainText(
        'Choose a country',
      );
    });
  });

  test('Zod + Vest Validation - combines Vest business rules with the Zod baseline', async ({
    page,
  }) => {
    await test.step('Fill the form so the Vest-only business rules fail', async () => {
      await page.getByLabel('First name', { exact: true }).fill('Arjen');
      await page.getByLabel('Last name', { exact: true }).fill('Althoff');
      await page.getByLabel('Email', { exact: true }).fill('arjen@gmail.com');
      await page
        .getByLabel('Password', { exact: true })
        .fill('Arjen-secure-123');
      await page
        .getByLabel('Account type', { exact: true })
        .selectOption('business');
      await page.getByLabel('Country', { exact: true }).selectOption('DE');

      await page.getByRole('button', { name: 'Provision account' }).click();
    });

    await test.step('Verify the business-policy errors are shown', async () => {
      await expect(fieldAlert(page, 'Email')).toContainText(
        'Business accounts must use a company email domain',
      );
      await expect(fieldAlert(page, 'Password')).toContainText(
        'Password must not include your first or last name',
      );
      await expect(fieldAlert(page, 'Company name')).toContainText(
        'Company name is required for business accounts',
      );
      await expect(fieldAlert(page, 'VAT number')).toContainText(
        'VAT number is required for business accounts in DE, NL, or BE',
      );
    });

    await test.step('Correct the business rules and verify the errors clear', async () => {
      await page.getByLabel('Email', { exact: true }).fill('arjen@company.com');
      await page
        .getByLabel('Password', { exact: true })
        .fill('secure-pass-1234');
      await page.getByLabel('Company name', { exact: true }).fill('Acme GmbH');
      await page.getByLabel('VAT number', { exact: true }).fill('DE123456789');
      await page.getByRole('button', { name: 'Provision account' }).click();

      await expect(fieldAlert(page, 'Email')).toHaveCount(0);
      await expect(fieldAlert(page, 'Password')).toHaveCount(0);
      await expect(fieldAlert(page, 'Company name')).toHaveCount(0);
      await expect(fieldAlert(page, 'VAT number')).toHaveCount(0);
    });
  });

  test('Zod + Vest Validation - allows submit when only Vest warnings remain', async ({
    page,
  }) => {
    await test.step('Fill the form so only warning-level Vest rules fail', async () => {
      await page.getByLabel('First name', { exact: true }).fill('Arjen');
      await page.getByLabel('Last name', { exact: true }).fill('Althoff');
      await page.getByLabel('Email', { exact: true }).fill('arjen@company.com');
      await page.getByLabel('Password', { exact: true }).fill('securepass1234');
      await page
        .getByLabel('Account type', { exact: true })
        .selectOption('business');
      await page.getByLabel('Country', { exact: true }).selectOption('DE');
      await page.getByLabel('Company name', { exact: true }).fill('Acme GmbH');
      await page.getByLabel('VAT number', { exact: true }).fill('123456789');
      await page.getByLabel('VAT number', { exact: true }).blur();
    });

    await test.step('Verify warnings show up as status messages', async () => {
      await expect(fieldStatus(page, 'Password')).toContainText(
        'Add a symbol to make the password stronger',
      );
      await expect(fieldStatus(page, 'VAT number')).toContainText(
        'Include the country prefix in the VAT number for faster review',
      );
      await expect(fieldAlert(page, 'Password')).toHaveCount(0);
      await expect(fieldAlert(page, 'VAT number')).toHaveCount(0);
    });

    await test.step('Submit successfully while the warnings stay advisory', async () => {
      await page.getByRole('button', { name: 'Provision account' }).click();

      await expect(
        page.getByText(
          'Account provisioned. Zod errors stayed blocking, and the first-class Vest adapter kept warnings advisory.',
          { exact: true },
        ),
      ).toBeVisible();
      await expect(fieldStatus(page, 'Password')).toContainText(
        'Add a symbol to make the password stronger',
      );
    });
  });
});
