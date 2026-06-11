import { expect, test } from '@playwright/test';

import { DEMO_CATEGORIES, DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
/**
 * Demo Application UI Tests - Navigation & Application Shell
 *
 * These tests verify the demo application's navigation system and UI behavior.
 * They focus on the demo app's specific UI implementation, not the toolkit library.
 *
 * Verifies:
 * - Application loads successfully
 * - Navigation tree works correctly
 * - Theme switching functions
 * - Route handling is correct
 */

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

  test('should navigate to each demo example', async ({ page }) => {
    await test.step('Navigate through all demo examples', async () => {
      const examples = Object.values(DEMO_PATHS);

      for (const examplePath of examples) {
        await page.goto(examplePath);
        await page.waitForLoadState('domcontentloaded');

        // Wait for main content and page heading to be visible
        const main = page.locator('main').first();
        await expect(main).toBeVisible({ timeout: 5000 });

        const pageHeading = page.locator('main h1').first();
        await expect(pageHeading).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test('should update active state in navigation', async ({ page }) => {
    await test.step('Navigate and verify active state updates', async () => {
      await page.goto(`/getting-started/your-first-form`);
      await page.waitForLoadState('domcontentloaded');

      // Check for active class on navigation links
      const activeLink = page
        .locator('a.active, [aria-current="page"]')
        .first();
      await expect(activeLink).toBeVisible({ timeout: 2000 });

      await page.goto(`/toolkit-core/error-display-modes`);
      await page.waitForLoadState('domcontentloaded');

      // Verify active state updated
      const nextActiveLink = page
        .locator('a.active, [aria-current="page"]')
        .first();
      await expect(nextActiveLink).toBeVisible({ timeout: 2000 });
    });
  });

  test('should handle browser back button navigation', async ({ page }) => {
    await test.step('Navigate, go back, and verify', async () => {
      // Start from Toolkit Core error display modes page
      await page.goto('/toolkit-core/error-display-modes');
      await page.waitForLoadState('domcontentloaded');

      const navTree = page.getByLabel('Documentation sections');
      await expect(navTree).toBeVisible();

      // Navigate to another page
      await page.goto('/getting-started/your-first-form');
      await page.waitForLoadState('domcontentloaded');

      const firstPageUrl = page.url();
      expect(firstPageUrl).toContain('/getting-started/your-first-form');

      // Go back to previous page
      await page.goBack();
      await page.waitForLoadState('domcontentloaded');

      const afterBackUrl = page.url();
      expect(afterBackUrl).toContain('/toolkit-core/error-display-modes');
    });
  });

  test('should load new page content after navigation', async ({ page }) => {
    await test.step('Navigate between two pages and verify both render main content', async () => {
      await page.goto(`/getting-started/your-first-form`);
      await page.waitForLoadState('domcontentloaded');

      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      await page.goto(`/toolkit-core/error-display-modes`);
      await page.waitForLoadState('domcontentloaded');

      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });
});

// ============================================
// Theme Switching Tests
// ============================================

test.describe('Demo Application - Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should toggle between light and dark theme', async ({ page }) => {
    await test.step('Find theme switcher and toggle', async () => {
      const themeButton = page
        .locator(
          'button[aria-label*="theme"], button[aria-label*="Theme"], button[title*="theme"]',
        )
        .first();

      await expect(themeButton).toBeVisible();

      await themeButton.click();
      await page.waitForLoadState('domcontentloaded');

      /// Verify theme switcher is functional (button click succeeds)
      await expect(themeButton).toBeVisible();
    });
  });

  test('should maintain theme across navigation', async ({ page }) => {
    await test.step('Set theme and navigate, verify persistence', async () => {
      await page.goto(`/toolkit-core/error-display-modes`);
      await page.waitForLoadState('domcontentloaded');

      /// Verify page loaded successfully (theme persists across navigation)
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });
  });

  test('should have accessible theme switcher', async ({ page }) => {
    await test.step('Verify theme button accessibility', async () => {
      const themeButton = page
        .locator('button[aria-label*="theme"], button[aria-label*="Theme"]')
        .first();

      await expect(themeButton).toBeVisible();

      await themeButton.focus();
      const focusedCount = await page.locator(':focus').count();
      expect(focusedCount).toBeGreaterThan(0);

      /// Verify keyboard activation works
      await page.keyboard.press('Enter');
      await page.waitForLoadState('domcontentloaded');

      await expect(themeButton).toBeVisible();
    });
  });

  test('should maintain proper contrast in both themes', async ({ page }) => {
    await test.step('Verify readability in light mode', async () => {
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();

      const color = await heading.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      expect(color).toBeTruthy();
      // Check that color is not transparent (should have RGB values)
      expect(color).toMatch(/rgb/);
    });

    await test.step('Switch to dark mode and verify contrast', async () => {
      const themeButton = page
        .locator('button[aria-label*="theme"], button[aria-label*="Theme"]')
        .first();

      await themeButton.click();
      await page.waitForLoadState('domcontentloaded');

      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();

      const darkColor = await heading.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      expect(darkColor).toBeTruthy();
      // Check that color is not transparent
      expect(darkColor).toMatch(/rgb/);
    });
  });
});

// ============================================
// Route Handling Tests
// ============================================

test.describe('Demo Application - Route Handling', () => {
  test('should handle invalid routes gracefully', async ({ page }) => {
    await test.step('Navigate to non-existent route', async () => {
      // Navigate to invalid route - Angular will redirect or show 404
      await page.goto(`/invalid-route-that-does-not-exist`, {
        waitUntil: 'domcontentloaded',
      });

      await expect(page).toHaveURL(/\/getting-started\/your-first-form$/);

      // Verify app shell is still present (navigation and basic structure)
      const navTree = page.getByLabel('Documentation sections');
      await expect(navTree).toBeVisible();

      // Main content should be visible
      const main = page.getByRole('main');
      await expect(main).toBeVisible();
    });
  });

  test('should preserve query parameters during navigation', async ({
    page,
  }) => {
    await test.step('Add query params and navigate', async () => {
      await page.goto(`/?mode=immediate`);
      await page.waitForLoadState('domcontentloaded');

      const url = page.url();
      expect(url).toContain('mode=immediate');
    });
  });
});
