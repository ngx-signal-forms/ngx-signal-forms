import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { expect, test, type Page } from '@playwright/test';

/**
 * Demo Application UI Tests - Focus after a route change (#571)
 *
 * After a sidebar link click, focus moves to the new page's `<h1>`, so a
 * screen reader announces the new page. It must not move on the first load,
 * or when only the query string changes.
 */

const START_PATH = DEMO_PATHS.errorDisplayModes;
const TARGET_LABEL = 'Warning Support';
const TARGET_PATH = DEMO_PATHS.warningSupport;

async function clickSidebarLink(page: Page): Promise<void> {
  const navTree = page.getByLabel('Documentation sections');
  const link = navTree.getByRole('link', { name: TARGET_LABEL });
  if (!(await link.isVisible())) {
    await navTree.getByRole('button', { name: 'Toolkit Core' }).click();
  }
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${TARGET_PATH}$`));
}

test.describe('Demo Application UI - Focus after a route change', () => {
  test('the first load does not move focus to the heading', async ({
    page,
  }) => {
    await page.goto(START_PATH);
    await expect(page.locator('main h1')).toBeVisible();

    await expect(page.locator('main h1')).not.toBeFocused();
  });

  test('a query-only change does not move focus', async ({ page }) => {
    await page.goto(START_PATH);
    const heading = page.locator('main h1');
    await expect(heading).toBeVisible();

    await page.evaluate(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('focus-test', '1');
      window.history.pushState({}, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    await expect(heading).not.toBeFocused();
  });

  test('desktop: a sidebar link click moves focus to the new page heading', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(START_PATH);

    await clickSidebarLink(page);

    const heading = page.locator('main h1');
    await expect(heading).toHaveText(TARGET_LABEL);
    await expect(heading).toBeFocused();
  });

  test('mobile: a drawer link click moves focus to the new page heading', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(START_PATH);

    await page.getByRole('button', { name: 'Open navigation' }).click();
    await clickSidebarLink(page);

    await expect(
      page.getByRole('button', { name: 'Open navigation' }),
    ).toHaveAttribute('aria-expanded', 'false');

    const heading = page.locator('main h1');
    await expect(heading).toHaveText(TARGET_LABEL);
    await expect(heading).toBeFocused();
  });
});
