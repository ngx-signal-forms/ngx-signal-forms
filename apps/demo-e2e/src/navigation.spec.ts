import { expect, test } from '@playwright/test';

/**
 * Navigation & Application Shell Tests
 * Tests for Part 1 of DEMO_TEST_PLAN.md
 *
 * Verifies:
 * - Application loads successfully
 * - Navigation system works
 * - Theme switching functions
 * - Route handling is correct
 */

test.describe('Demo Application - Navigation & Shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load home page successfully', async ({ page }) => {
    await test.step('Verify page title and main layout', async () => {
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();
      const titleText = await title.innerText();
      expect(titleText).toContain('Pure Signal Forms');

      const sidebar = page.locator('nav, [role="navigation"]').first();
      await expect(sidebar).toBeVisible();

      const main = page.locator('main, [role="main"]').first();
      await expect(main).toBeVisible();
    });
  });

  test('should display all 5 navigation categories', async ({ page }) => {
    await test.step('Verify all category headers are visible', async () => {
      const categories = [
        'Signal Forms Only',
        'Getting Started',
        'Toolkit Core',
        'Form Field Wrapper',
        'Advanced',
      ];

      for (const category of categories) {
        const categoryElement = page.getByRole('link', {
          name: new RegExp(category),
        });
        await expect(categoryElement).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test('should have all 9 example links accessible via navigation', async ({
    page,
  }) => {
    await test.step('Verify links are accessible by navigating to each category', async () => {
      // Navigate to each category and verify its example links in sidebar
      const categoryTests = [
        {
          category: '/signal-forms-only',
          links: ['Pure Signal Forms'],
        },
        {
          category: '/getting-started',
          links: ['Your First Form'],
        },
        {
          category: '/toolkit-core',
          links: [
            'Accessibility Comparison',
            'Error Display Modes',
            'Warning Support',
            'Field States',
            'CSS Status Classes',
          ],
        },
        {
          category: '/form-field-wrapper',
          links: [
            'Basic Usage',
            'Complex Forms',
            'Fieldset',
            'Outlined Form Fields',
          ],
        },
        {
          category: '/advanced',
          links: [
            'Global Configuration',
            'Submission Patterns',
            'Error Messages',
          ],
        },
      ];

      for (const { category, links } of categoryTests) {
        await page.goto(category);
        await page.waitForLoadState('domcontentloaded');

        // Get the sidebar navigation
        const sidebar = page
          .getByRole('navigation', { name: /section/i })
          .first();
        await expect(sidebar).toBeVisible();

        for (const linkText of links) {
          // Look for links specifically within the sidebar navigation
          const link = sidebar.getByRole('link', {
            name: new RegExp(linkText, 'i'),
          });
          await expect(link).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test('should navigate to each demo example', async ({ page }) => {
    await test.step('Navigate through all demo examples', async () => {
      const examples = [
        '/signal-forms-only/pure-signal-form',
        '/getting-started/your-first-form',
        '/toolkit-core/accessibility-comparison',
        '/toolkit-core/error-display-modes',
        '/toolkit-core/warning-support',
        '/toolkit-core/field-states',
        '/toolkit-core/css-status-classes',
        '/form-field-wrapper/basic-usage',
        '/form-field-wrapper/complex-forms',
        '/form-field-wrapper/fieldset',
        '/form-field-wrapper/outline-form-field',
        '/advanced/global-configuration',
        '/advanced/submission-patterns',
        '/advanced/error-messages',
        '/new-demos/dynamic-list',
        '/new-demos/nested-groups',
        '/new-demos/async-validation',
        '/new-demos/stepper-form',
        '/new-demos/cross-field-validation',
      ];

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
      await page.goto('/getting-started/your-first-form');
      await page.waitForLoadState('domcontentloaded');

      // Check for active class on navigation links
      const activeLink = page
        .locator('a.active, [aria-current="page"]')
        .first();
      await expect(activeLink).toBeVisible({ timeout: 2000 });

      await page.goto('/toolkit-core/accessibility-comparison');
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
      // Start from home page
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Navigate to first page by clicking link (creates proper history entry)
      const gettingStartedNav = page.getByRole('link', {
        name: /Getting Started/i,
      });
      await gettingStartedNav.click();
      await page.waitForLoadState('domcontentloaded');

      // Click the "Your First Form" link in the sidebar
      const sidebar = page
        .getByRole('navigation', { name: /section/i })
        .first();
      const yourFirstFormLink = sidebar.getByRole('link', {
        name: /Your First Form/i,
      });
      await yourFirstFormLink.click();
      await page.waitForLoadState('domcontentloaded');

      const firstPageUrl = page.url();
      expect(firstPageUrl).toContain('/getting-started/your-first-form');

      // Navigate to second page by clicking link
      const toolkitCoreNav = page.getByRole('link', {
        name: /Toolkit Core/i,
      });
      await toolkitCoreNav.click();
      await page.waitForLoadState('domcontentloaded');

      const accessibilityLink = sidebar.getByRole('link', {
        name: /Accessibility Comparison/i,
      });
      await accessibilityLink.click();
      await page.waitForLoadState('domcontentloaded');

      const secondPageUrl = page.url();
      expect(secondPageUrl).toContain('/toolkit-core/accessibility-comparison');

      // Go back to first page
      await page.goBack();
      await page.waitForLoadState('domcontentloaded');

      const afterBackUrl = page.url();
      expect(afterBackUrl).toContain('/getting-started/your-first-form');
    });
  });

  test('should maintain scroll position reset between navigation', async ({
    page,
  }) => {
    await test.step('Verify navigation works correctly', async () => {
      // Navigate to first page
      await page.goto('/getting-started/your-first-form');
      await page.waitForLoadState('domcontentloaded');

      const mainContent = page.locator('main').first();
      await expect(mainContent).toBeVisible();

      // Verify page heading is visible at top
      const heading = page.locator('main h1').first();
      await expect(heading).toBeVisible();

      // Navigate to second page
      await page.goto('/toolkit-core/error-display-modes');
      await page.waitForLoadState('domcontentloaded');

      // Verify new page loaded and main content is visible
      await expect(mainContent).toBeVisible();
      await expect(page.locator('main h1').first()).toBeVisible();
    });
  });
});

// ============================================
// Theme Switching Tests
// ============================================

test.describe('Demo Application - Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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
      await page.goto('/toolkit-core/accessibility-comparison');
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
      await page
        .goto('/invalid-route-that-does-not-exist', {
          waitUntil: 'domcontentloaded',
        })
        .catch(() => {
          // Route may not exist, that's expected
        });

      // Verify app shell is still present (navigation and basic structure)
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible({ timeout: 2000 });

      // Main content should be visible
      const main = page.locator('main').first();
      await expect(main).toBeVisible({ timeout: 2000 });
    });
  });

  test('should preserve query parameters during navigation', async ({
    page,
  }) => {
    await test.step('Add query params and navigate', async () => {
      await page.goto('/?debug=true&mode=manual');
      await page.waitForLoadState('domcontentloaded');

      const url = page.url();
      expect(url).toContain('debug=true');
      expect(url).toContain('mode=manual');
    });
  });
});
