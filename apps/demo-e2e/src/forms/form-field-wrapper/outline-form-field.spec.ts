import { expect, test } from '@playwright/test';

test.describe('Outline Form Field - Complex Nested Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/form-field-wrapper/outline-form-field');
  });

  test('should render initial state correctly', async ({ page }) => {
    // Initial state has 1 fact by default (from setup in component)
    await expect(page.getByText('Feit', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Feit nummer')).toHaveValue('1');

    // Submit button remains enabled to allow validation feedback on submit
    await expect(page.getByRole('button', { name: 'Opslaan' })).toBeEnabled();
  });

  test('should add and remove facts', async ({ page }) => {
    // Add a second fact
    // Use exact match to avoid matching "Strafbaar feit toevoegen"
    await page
      .getByRole('button', { name: 'Feit toevoegen', exact: true })
      .click();

    await expect(page.getByLabel('Feit nummer', { exact: true })).toHaveCount(
      2,
    );
    // Use .nth(1) for the second input
    await expect(
      page.getByLabel('Feit nummer', { exact: true }).nth(1),
    ).toHaveValue('2');

    // Remove the second fact
    await page.getByLabel('Feit 2 verwijderen', { exact: true }).click();

    await expect(page.getByLabel('Feit nummer', { exact: true })).toHaveCount(
      1,
    );
    await expect(page.getByLabel('Feit nummer', { exact: true })).toHaveValue(
      '1',
    );
  });

  test('should add and remove nested offenses and articles', async ({
    page,
  }) => {
    // 1. Add nested Offense via "Strafbaar feit toevoegen"
    await expect(page.getByText('Strafbaar feit', { exact: true })).toHaveCount(
      1,
    );

    await page
      .getByRole('button', { name: 'Strafbaar feit toevoegen', exact: true })
      .click();
    await expect(page.getByText('Strafbaar feit', { exact: true })).toHaveCount(
      2,
    );

    // 2. Add nested Article via "Wetsartikel toevoegen" inside the first offense
    // Count total articles first (should be 2: one for each offense)
    // Use getByRole to target combobox specifically and avoid matching delete buttons
    await expect(
      page.getByRole('combobox', { name: 'Wetsartikel', exact: true }),
    ).toHaveCount(2);

    // Click "Wetsartikel toevoegen" for the FIRST offense (first button)
    // Use exact match for button logic too if needed, though button role filters inputs
    await page
      .getByRole('button', { name: 'Wetsartikel toevoegen', exact: true })
      .first()
      .click();

    // Total articles should now be 3
    await expect(
      page.getByRole('combobox', { name: 'Wetsartikel', exact: true }),
    ).toHaveCount(3);

    // 3. Remove Article
    // Remove the newly added article (it's the second one in the first offense)
    // Buttons: [Off1-Art1-Del], [Off1-Art2-Del], [Off2-Art1-Del]
    await page
      .getByRole('button', { name: 'Wetsartikel verwijderen', exact: true })
      .nth(1)
      .click();
    await expect(
      page.getByRole('combobox', { name: 'Wetsartikel', exact: true }),
    ).toHaveCount(2);

    // 4. Remove Offense
    // Remove the second offense
    await page
      .getByRole('button', { name: 'Strafbaar feit verwijderen', exact: true })
      .nth(1)
      .click();
    await expect(page.getByText('Strafbaar feit', { exact: true })).toHaveCount(
      1,
    );
  });

  test('should validate fields (on-touch) and enable submit when valid', async ({
    page,
  }) => {
    // Trigger validation error
    // Use exact match to avoid matching "Pleegplaats" or similar if substring problems exist
    const commitDateInput = page.getByLabel('Pleegdatum', { exact: true });
    await commitDateInput.focus();
    await commitDateInput.blur();

    // Use specific locator for the alert
    const dateAlert = page
      .locator('ngx-signal-form-error')
      .filter({ hasText: 'Pleegdatum is verplicht' });
    await expect(dateAlert).toBeVisible();

    // Fix error
    await commitDateInput.fill('01-01-2024');
    await expect(dateAlert).toBeHidden();

    // Fill other required fields
    // Use exact matches for all labels
    await page.getByLabel('Plaats', { exact: true }).fill('Amsterdam');
    await page.getByLabel('Land', { exact: true }).selectOption('Nederland');
    // Municipality is required for Netherlands (NL)
    await page.getByLabel('Gemeente', { exact: true }).fill('Amsterdam');

    await page.getByLabel('Kwalificatiecode', { exact: true }).fill('SR-310');
    await page
      .getByRole('combobox', { name: 'Wetsartikel', exact: true })
      .selectOption({ label: 'SR-310 - Doodslag' });

    // Submit button should be enabled
    await expect(page.getByRole('button', { name: 'Opslaan' })).toBeEnabled();
  });
});
