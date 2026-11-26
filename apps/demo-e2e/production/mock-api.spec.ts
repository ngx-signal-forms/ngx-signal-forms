import { expect, test } from '@playwright/test';

test('checks a taken username on the production site', async ({ page }) => {
  await page.goto('advanced-scenarios/async-validation');
  const username = page.getByRole('textbox', { name: 'Username', exact: true });

  await username.fill('admin');
  await username.press('Tab');

  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'The username "admin" is already taken' }),
  ).toBeVisible();
  await expect(username).toHaveAttribute('aria-invalid', 'true');
});

test('saves an edit on the production site', async ({ page }) => {
  await page.goto('advanced-scenarios/autosave');
  await page
    .getByRole('textbox', { name: 'Display name' })
    .fill('Taylor Example');

  await expect(
    page.getByRole('status').filter({ hasText: 'All changes saved.' }),
  ).toBeVisible();
});

test('restores an unfinished wizard draft on the production site', async ({
  page,
}) => {
  await page.goto('advanced-scenarios/advanced-wizard');
  const firstName = page.getByRole('textbox', { name: 'First Name' });

  await firstName.fill('Taylor');
  await expect(page.getByText(/Last saved:\s+\d/u)).toBeVisible();
  await page.reload();

  await expect(firstName).toHaveValue('Taylor');
});
