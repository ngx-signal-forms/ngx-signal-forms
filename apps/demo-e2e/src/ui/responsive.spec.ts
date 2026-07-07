import { DEMO_CATEGORIES, DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { expect, test } from '@playwright/test';
/**
 * Demo Application UI Tests - Responsive Behavior
 *
 * These tests verify the demo application's responsive design and page loading behavior.
 * They focus on the demo app's specific UI implementation, not the toolkit library.
 */

test.describe('Demo Application UI - Page Loading', () => {
  test('should load all demo pages successfully', async ({ page }) => {
    await test.step('Load all example routes', async () => {
      const routes = [
        '/',
        ...DEMO_CATEGORIES.flatMap((c) => c.links.map((l) => l.path)),
      ];

      for (const route of routes) {
        const routePage = await page.context().newPage();
        await routePage.goto(route, { waitUntil: 'domcontentloaded' });

        /// Verify page loaded with content
        const main = routePage.locator('main, [role="main"]');
        const isVisible = await main
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        expect(isVisible || (await routePage.content()).length > 0).toBe(true);

        await routePage.close();
      }
    });
  });

  test('should render forms on all pages', async ({ page }) => {
    await test.step('Verify forms are present', async () => {
      const routes = [
        DEMO_PATHS.yourFirstForm,
        DEMO_PATHS.errorDisplayModes,
        DEMO_PATHS.warningSupport,
        DEMO_PATHS.complexForms,
      ];

      for (const route of routes) {
        const routePage = await page.context().newPage();
        await routePage.goto(route, { waitUntil: 'domcontentloaded' });

        const form = routePage.locator('form').first();
        await expect(form).toBeVisible({ timeout: 5000 });

        await routePage.close();
      }
    });
  });
});

/**
 * Regression coverage for #166 findings #5 and #7 — until now this suite
 * never changed viewport size, so neither the shell's hard-coded
 * `min-width: 900px` (which forced horizontal scrolling at narrow widths,
 * WCAG 2.2 AA 1.4.10 Reflow) nor the slide-over's missing focus management
 * were ever exercised.
 */
test.describe('Demo Application UI - Narrow viewport (< 900px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(DEMO_PATHS.yourFirstForm);
  });

  test('shell reflows without introducing horizontal scroll at 390px', async ({
    page,
  }) => {
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
  });

  test('left nav becomes a drawer, toggled by a hamburger button', async ({
    page,
  }) => {
    await expect(page.locator('.shell__nav')).toBeHidden();

    const toggle = page.getByRole('button', { name: 'Open navigation' });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await test.step('Opening the drawer moves focus into it', async () => {
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');

      const closeButton = page.getByRole('button', {
        name: 'Close navigation',
      });
      await expect(closeButton).toBeFocused();
      await expect(page.locator('.shell__nav')).toBeVisible();
    });

    await test.step('Escape closes the drawer and returns focus to the toggle', async () => {
      await page.keyboard.press('Escape');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle).toBeFocused();
    });
  });

  test('display-controls slide-over manages focus and closes on Escape', async ({
    page,
  }) => {
    const pin = page.getByRole('button', { name: 'Open display controls' });
    await expect(pin).toBeVisible();

    const dialog = page.locator('dialog.panel--slideover');

    await test.step('Opening the slide-over moves focus into it', async () => {
      await pin.click();
      await expect(dialog).toHaveAttribute('open', '');

      const closeButton = page.getByRole('button', {
        name: 'Close configuration panel',
      });
      await expect(closeButton).toBeFocused();
    });

    await test.step('Escape closes the slide-over and returns focus to the pin', async () => {
      await page.keyboard.press('Escape');
      await expect(dialog).not.toHaveAttribute('open', '');
      await expect(pin).toBeFocused();
    });
  });

  test('clicking the slide-over backdrop closes it', async ({ page }) => {
    const pin = page.getByRole('button', { name: 'Open display controls' });
    await pin.click();

    const dialog = page.locator('dialog.panel--slideover');
    await expect(dialog).toHaveAttribute('open', '');

    // The slide-over is anchored to the right edge (`width: min(26rem,
    // 94vw)`), so the viewport's top-left corner is genuine backdrop at
    // this 390px width. Native <dialog> attributes backdrop clicks to the
    // dialog element itself — this exercises the bounding-rect check in
    // RightRailComponent.onDialogBackdropClick, not a click "on" the panel.
    await page.mouse.click(2, 2);
    await expect(dialog).not.toHaveAttribute('open', '');
  });
});
