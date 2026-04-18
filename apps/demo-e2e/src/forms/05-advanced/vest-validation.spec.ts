import { expect, test, type Page } from '@playwright/test';

function fieldWrapper(page: Page, label: string) {
  return page.locator('ngx-signal-form-field-wrapper', {
    has: page.getByLabel(label, { exact: true }),
  });
}

function fieldAlert(page: Page, label: string) {
  return fieldWrapper(page, label).locator('[role="alert"]');
}

function fieldStatus(page: Page, label: string) {
  return fieldWrapper(page, label).locator('[role="status"]');
}

test.describe('Advanced Scenarios - Vest-Only Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/advanced-scenarios/vest-validation');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Vest-Only Validation - renders the demo guidance and form controls', async ({
    page,
  }) => {
    await test.step('Verify the page-specific guidance is visible', async () => {
      await expect(
        page.getByRole('heading', {
          level: 2,
          name: 'Vest-Only Validation Demo',
        }),
      ).toBeVisible();
      await expect(
        page.getByText('Why this is a Vest-friendly example', { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText('Errors and warnings come from the same Vest run.', {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page
          .getByText('Required for business accounts.', { exact: true })
          .first(),
      ).toBeVisible();
    });

    await test.step('Verify the key form controls are available', async () => {
      await expect(
        page.getByLabel('Account type', { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByLabel('Billing country', { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByLabel('Work email', { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Create account' }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
    });
  });

  test('Vest-Only Validation - requires company and VAT for EU business accounts', async ({
    page,
  }) => {
    await test.step('Fill the non-conditional fields with valid values', async () => {
      await page
        .getByLabel('Account type', { exact: true })
        .selectOption('business');
      await page
        .getByLabel('Billing country', { exact: true })
        .selectOption('DE');
      await page
        .getByLabel('Work email', { exact: true })
        .fill('team@example.com');
      await page.getByLabel('Team size', { exact: true }).fill('5');
    });

    await test.step('Submit the form to trigger conditional business validation', async () => {
      await page.getByRole('button', { name: 'Create account' }).click();

      await expect(fieldAlert(page, 'Company name')).toContainText(
        'Company name is required for business accounts',
      );
      await expect(fieldAlert(page, 'VAT number')).toContainText(
        'VAT number is required for business accounts in DE, NL, or BE',
      );
    });
  });

  test('Vest-Only Validation - clears personal plan limits after correction', async ({
    page,
  }) => {
    await test.step('Trigger personal seat and referral validation errors', async () => {
      await page
        .getByLabel('Account type', { exact: true })
        .selectOption('personal');
      await page
        .getByLabel('Billing country', { exact: true })
        .selectOption('US');
      await page
        .getByLabel('Work email', { exact: true })
        .fill('team@example.com');
      await page.getByLabel('Team size', { exact: true }).fill('20');
      await page
        .getByLabel('Referral code', { exact: true })
        .fill('STARTER100');

      await page.getByRole('button', { name: 'Create account' }).click();

      await expect(fieldAlert(page, 'Team size')).toContainText(
        'Personal accounts support up to 10 seats',
      );
      await expect(fieldAlert(page, 'Referral code')).toContainText(
        'STARTER100 is only valid for personal accounts with up to 3 seats',
      );
    });

    await test.step('Correct the values and verify both errors disappear', async () => {
      await page.getByLabel('Team size', { exact: true }).fill('3');
      await page.getByLabel('Referral code', { exact: true }).blur();
      await page.getByRole('button', { name: 'Create account' }).click();

      await expect(fieldAlert(page, 'Team size')).toHaveCount(0);
      await expect(fieldAlert(page, 'Referral code')).toHaveCount(0);
    });
  });

  test('Vest-Only Validation - shows Vest warnings without blocking submission', async ({
    page,
  }) => {
    await test.step('Fill the form with warning-only values', async () => {
      await page
        .getByLabel('Account type', { exact: true })
        .selectOption('business');
      await page
        .getByLabel('Billing country', { exact: true })
        .selectOption('DE');
      await page.getByLabel('Company name', { exact: true }).fill('Acme GmbH');
      await page.getByLabel('VAT number', { exact: true }).fill('DE123456789');
      await page
        .getByLabel('Work email', { exact: true })
        .fill('team@gmail.com');
      await page.getByLabel('Team size', { exact: true }).fill('55');
      await page.getByLabel('Team size', { exact: true }).blur();
    });

    await test.step('Verify warnings render as polite status messages', async () => {
      await expect(fieldStatus(page, 'Work email')).toContainText(
        'Using a company email usually speeds up workspace approval',
      );
      await expect(fieldStatus(page, 'Team size')).toContainText(
        'Teams above 50 seats usually need annual billing review',
      );
      await expect(fieldAlert(page, 'Work email')).toHaveCount(0);
      await expect(fieldAlert(page, 'Team size')).toHaveCount(0);
    });

    await test.step('Submit successfully while warnings remain visible', async () => {
      await page.getByRole('button', { name: 'Create account' }).click();

      await expect(
        page.getByText(
          'Account created. The first-class Vest adapter kept warnings visible without blocking submission.',
          { exact: true },
        ),
      ).toBeVisible();
      await expect(fieldStatus(page, 'Work email')).toContainText(
        'Using a company email usually speeds up workspace approval',
      );
    });
  });

  test('Vest-Only Validation - uses single-column field rows for standard horizontal mode', async ({
    page,
  }) => {
    const form = page.locator('form.max-w-3xl.space-y-6');
    const pairGrids = form.locator('.vest-validation-form__pair-grid');

    await test.step('Switch the demo to standard and horizontal', async () => {
      await page.getByRole('button', { name: 'Standard' }).click();
      await page.getByRole('button', { name: 'Horizontal' }).click();

      await expect(form).toHaveClass(/vest-validation-form--single-column/);
    });

    await test.step('Verify each pair grid resolves to a single column', async () => {
      const gridCount = await pairGrids.count();

      for (let index = 0; index < gridCount; index += 1) {
        await expect
          .poll(async () =>
            pairGrids
              .nth(index)
              .evaluate(
                (element) =>
                  window
                    .getComputedStyle(element)
                    .gridTemplateColumns.split(/\s+/)
                    .filter(Boolean).length,
              ),
          )
          .toBe(1);
      }
    });

    await test.step('Capture the standard horizontal demo baseline', async () => {
      await expect(form).toHaveScreenshot(
        'vest-validation-standard-horizontal-single-column.png',
      );
    });
  });
});
