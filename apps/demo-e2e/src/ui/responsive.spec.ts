import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { expect, test } from '@playwright/test';
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
    const nav = page.locator('.shell__nav');
    await expect(nav).toHaveCSS('visibility', 'hidden');
    await expect(nav).toHaveAttribute('inert', '');

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
      await expect(nav).toBeVisible();
      await expect(nav).not.toHaveAttribute('inert');
    });

    await test.step('Escape closes the drawer and returns focus to the toggle', async () => {
      await page.keyboard.press('Escape');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle).toBeFocused();
      await expect(nav).toHaveAttribute('inert', '');
      await expect(nav).toHaveCSS('visibility', 'hidden');
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

/**
 * The narrow-viewport suite above only ever visits `yourFirstForm`, the
 * simplest routed page (one flat field stack, no nested groups). The
 * multi-step wizard is the app's most layout-dense page — a progress header
 * of step buttons plus grid-based destination/activity cards — and had never
 * been exercised below the 900px shell-reflow breakpoint.
 */
test.describe('Demo Application UI - Narrow viewport (advanced wizard)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(DEMO_PATHS.advancedWizard);
  });

  test('wizard reflows without introducing horizontal scroll at 390px', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: 'Traveler Information' }),
    ).toBeVisible();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
  });

  test('progress-header step buttons stay visible and operable at 390px', async ({
    page,
  }) => {
    const travelerStep = page
      .locator('.wizard-step-button')
      .filter({ hasText: 'Traveler Info' });
    await expect(travelerStep).toBeVisible();
    await expect(travelerStep).toHaveAttribute('aria-current', 'step');

    // Future steps are unvisited from a fresh load, so their header buttons
    // are disabled — but still rendered and visible, not clipped off-screen
    // by the narrower layout.
    const tripStep = page
      .locator('.wizard-step-button')
      .filter({ hasText: 'Trip Details' });
    await expect(tripStep).toBeVisible();
    await expect(tripStep).toBeDisabled();
  });
});
