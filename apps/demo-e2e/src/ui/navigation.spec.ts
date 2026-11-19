import { expect, test } from '@playwright/test';

import { DEMO_CATEGORIES } from '@ngx-signal-forms/demo-shared';
test.describe('Demo Application - Navigation & Shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load home page successfully', async ({ page }) => {
    await test.step('Verify page title and main layout', async () => {
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();
      const titleText = await title.innerText();
      expect(titleText).toContain('Your First Form');

      const sidebar = page.locator('nav, [role="navigation"]').first();
      await expect(sidebar).toBeVisible();

      const main = page.locator('main, [role="main"]').first();
      await expect(main).toBeVisible();
    });
  });

  test('should display all navigation categories', async ({ page }) => {
    await test.step('Verify all category headers are visible', async () => {
      const categories = DEMO_CATEGORIES.map((c) => c.label);
      // The category buttons are in the nav-tree component which has its own nav
      const navTree = page.getByLabel('Documentation sections');

      await expect(navTree).toBeVisible();

      for (const category of categories) {
        const categoryElement = navTree.getByRole('button', {
          name: category,
        });
        await expect(categoryElement).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test('should have all example links accessible via navigation', async ({
    page,
  }) => {
    await test.step('Verify links are accessible by navigating to each category', async () => {
      const navTree = page.getByLabel('Documentation sections');

      for (const category of DEMO_CATEGORIES) {
        await page.goto(category.links[0].path);
        await page.waitForLoadState('domcontentloaded');

        await expect(navTree).toBeVisible();

        const categoryButton = navTree.getByRole('button', {
          name: category.label,
        });
        await categoryButton.click();

        for (const linkText of category.links.map((link) => link.label)) {
          const link = navTree.getByRole('link', { name: linkText });
          await expect(link).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
});

test('activates the theme switcher by keyboard and remembers the selected theme', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');

  const theme = page.getByRole('button', { name: /Change theme:/iu });
  const root = page.locator('html');

  await expect(theme).toHaveAccessibleName(/Change theme: system/iu);
  await expect(root).toHaveCSS('color-scheme', 'light');

  await theme.focus();
  await expect(theme).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(theme).toHaveAccessibleName(/Change theme: light/iu);

  await theme.click();
  await expect(theme).toHaveAccessibleName(/Change theme: dark/iu);
  await expect(root).toHaveCSS('color-scheme', 'dark');

  await page.reload();
  await expect(theme).toHaveAccessibleName(/Change theme: dark/iu);
  await expect(root).toHaveCSS('color-scheme', 'dark');
});

test.describe('Demo Application - Route Handling', () => {
  test('should handle invalid routes gracefully', async ({ page }) => {
    await test.step('Navigate to non-existent route', async () => {
      // Navigate to invalid route - the app shows a not-found page in place
      await page.goto(`/invalid-route-that-does-not-exist`, {
        waitUntil: 'domcontentloaded',
      });

      await expect(page).toHaveURL(/\/invalid-route-that-does-not-exist$/);
      await expect(
        page.getByRole('heading', { name: 'Page not found', level: 1 }),
      ).toBeVisible();
      await expect(page).toHaveTitle('Page not found · ngx-signal-forms');

      // Verify app shell is still present (navigation and basic structure)
      const navTree = page.getByLabel('Documentation sections');
      await expect(navTree).toBeVisible();

      // Main content should be visible
      const main = page.getByRole('main');
      await expect(main).toBeVisible();
    });
  });

  test('should show the current path when moving between unknown URLs', async ({
    page,
  }) => {
    await page.goto('/first-miss');
    await expect(page.locator('main code')).toHaveText('/first-miss');

    // Same wildcard route, so Angular reuses the not-found component.
    await page.evaluate(() => {
      history.pushState({}, '', '/second-miss');
      dispatchEvent(new PopStateEvent('popstate'));
    });

    await expect(page).toHaveURL(/\/second-miss$/u);
    await expect(page.locator('main code')).toHaveText('/second-miss');
  });
});
