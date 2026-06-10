import { DEMO_CATEGORIES } from '@ngx-signal-forms/demo-shared';
import { expect, test } from '@playwright/test';

test.describe('Demo Application - Page Chrome & Content', () => {
  test('should keep app chrome visible across all routes', async ({ page }) => {
    const allLinks = DEMO_CATEGORIES.flatMap((category) => category.links);

    for (const link of allLinks) {
      await page.goto(link.path);
      await page.waitForLoadState('domcontentloaded');

      await expect(page.getByLabel('Documentation sections')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.locator('main h1').first()).toBeVisible();
      await expect(
        page.locator('main h1').first(),
        `Route ${link.path} should render a non-empty page title`,
      ).not.toHaveText(/^\s*$/);
    }
  });

  test('should render display configuration panel on routes that expose controls', async ({
    page,
  }) => {
    const controlledLinks = DEMO_CATEGORIES.flatMap((category) =>
      category.links.filter((link) => link.hasControls),
    );

    for (const link of controlledLinks) {
      await page.goto(link.path);
      await page.waitForLoadState('domcontentloaded');

      const rightRail = page.getByRole('complementary', {
        name: 'Page configuration',
      });
      await expect(
        rightRail,
        `Route ${link.path} should expose config bar`,
      ).toBeVisible();
      await expect(
        rightRail.getByText('Display Controls', { exact: true }),
      ).toBeVisible();
      await expect(
        rightRail.getByText('No display controls', { exact: true }),
      ).toHaveCount(0);
    }
  });
});
