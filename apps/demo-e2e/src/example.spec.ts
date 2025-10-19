import { expect, test } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect main content h1 to contain "Pure Signal Forms"
  // The page has 2 h1 elements (sidebar nav title + main content), so we target the main element
  const mainHeading = page.locator('main h1').first();
  await expect(mainHeading).toContainText(/Pure Signal Forms/i);
});
