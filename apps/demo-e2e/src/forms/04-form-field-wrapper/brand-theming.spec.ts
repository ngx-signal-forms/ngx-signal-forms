import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { WCAG_22_AA_TAGS } from '@ngx-signal-forms/toolkit/testing';

/**
 * Brand Theming - E2E Tests
 * Route: /form-field-wrapper/brand-theming
 *
 * Covers issue #273: the brand-token theming demo must (1) visibly swap the
 * wrapper's public CSS custom properties when the "Brand theme" toggle is on,
 * (2) honor dark mode with its own brand-dark values (not the light palette
 * re-rendered on a dark background), (3) reach every stateful color (error,
 * warning, disabled, focus), and (4) stay WCAG 2.2 AA in both themes.
 *
 * No `@layout` tag / `toHaveScreenshot()` here on purpose — the palette is a
 * scoped opt-in on this page's own panel, so a computed-style assertion
 * proves the override took effect without a platform-scoped visual baseline.
 */

const errorContentLocator = (
  page: import('@playwright/test').Page,
  fieldId: string,
) =>
  page
    .locator('ngx-form-field-wrapper')
    .filter({ has: page.locator(`#${fieldId}`) })
    .locator('.ngx-signal-form-field-wrapper__content');

test.describe('Form Field Wrapper - Brand Theming', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_PATHS.brandTheming);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the page with correct heading', async ({ page }) => {
    await expect(
      page.locator('h1', { hasText: /brand theming/i }),
    ).toBeVisible();
    await expect(page.locator('form').first()).toBeVisible();
  });

  test('should show blocking errors immediately on the required fields', async ({
    page,
  }) => {
    // errorStrategy="immediate" — no interaction needed.
    await expect(
      page.locator('[role="alert"]', { hasText: /team name is required/i }),
    ).toBeVisible();
    await expect(
      page.locator('[role="alert"]', {
        hasText: /workspace url is required/i,
      }),
    ).toBeVisible();
  });

  test('should surface a non-blocking warning once the budget crosses the threshold', async ({
    page,
  }) => {
    const budgetInput = page.locator('#monthlyBudget');
    await budgetInput.fill('7500');
    await budgetInput.blur();

    await expect(
      page.locator('[role="status"]', {
        hasText: /finance sign-off/i,
      }),
    ).toBeVisible();
  });

  test('should render the legacy workspace field as disabled', async ({
    page,
  }) => {
    await expect(page.locator('#legacyWorkspaceId')).toBeDisabled();
  });

  test('should apply the brand palette by default and revert on "Stock theme"', async ({
    page,
  }) => {
    const content = errorContentLocator(page, 'teamName');

    // Brand theme is on by default — the invalid border uses the brand
    // danger color (#be123c → rgb(190, 18, 60)), not the stock #db1818.
    await expect(content).toHaveCSS('border-color', 'rgb(190, 18, 60)');

    await page.getByRole('button', { name: 'Stock theme' }).click();

    // Switching to "Stock theme" removes the scoping class entirely, so the
    // wrapper falls back to its own stock default (#db1818 → rgb(219, 24, 24)).
    await expect(content).toHaveCSS('border-color', 'rgb(219, 24, 24)');
  });

  test('should apply the brand focus color on keyboard focus, distinct from stock', async ({
    page,
  }) => {
    // `monthlyBudget` is the one field that starts valid (empty, no
    // `required` rule) — focusing it exercises the plain focus ring
    // (`--_focus-color` → `--ngx-form-field-focus-color` falling back to
    // `--color-primary`), not the invalid/warning ring the other fields
    // would show instead.
    const budgetContent = errorContentLocator(page, 'monthlyBudget');

    // Real keyboard focus, not a programmatic `.focus()` call: click the
    // preceding field, then Tab — `legacyWorkspaceId` is disabled and never
    // receives focus, so Tab from `workspaceSlug` lands on `monthlyBudget`.
    await page.locator('#workspaceSlug').click();
    await page.keyboard.press('Tab');
    await expect(page.locator('#monthlyBudget')).toBeFocused();

    // Brand primary (#6d28d9 → rgb(109, 40, 217)) drives the focus border.
    await expect(budgetContent).toHaveCSS('border-color', 'rgb(109, 40, 217)');

    await page.getByRole('button', { name: 'Stock theme' }).click();
    await page.locator('#workspaceSlug').click();
    await page.keyboard.press('Tab');
    await expect(page.locator('#monthlyBudget')).toBeFocused();

    // Stock primary (#007bc7 → rgb(0, 123, 199)) — distinct from the brand
    // color above, proving the focus ring actually re-themes rather than
    // coincidentally matching.
    await expect(budgetContent).toHaveCSS('border-color', 'rgb(0, 123, 199)');
  });

  test('should apply the brand-dark palette (not the light palette) when dark mode is active', async ({
    page,
  }) => {
    // Simulate the header's theme switcher having already been set to dark —
    // exercises the same `.dark` class the switcher applies, without coupling
    // this spec to the switcher's click-to-cycle UI.
    await page.evaluate(() => {
      localStorage.setItem('color-theme', 'dark');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('html')).toHaveClass(/dark/);

    const content = errorContentLocator(page, 'teamName');

    // Brand-dark error color (#fda4af → rgb(253, 164, 175)) — distinct from
    // both the brand-light color and the stock dark color.
    await expect(content).toHaveCSS('border-color', 'rgb(253, 164, 175)');
  });

  test('should not affect an unrelated route’s wrapper colors after an in-app navigation', async ({
    page,
  }) => {
    // A full page.goto() would trivially pass this assertion — every route
    // gets a fresh document with no leftover styles. The real risk is a
    // client-side (SPA) navigation, where the router swaps the routed
    // component but the document — and anything the brand page injected
    // into <head>/<body> — stays alive. Navigate via the nav-tree link, not
    // page.goto, so this test actually exercises that scenario.
    //
    // "Form Field Wrapper" is already expanded because the current route
    // (`/form-field-wrapper/brand-theming`) matches its pattern — see
    // NavTreeComponent's `expandedId` — so the field-marking link is
    // immediately clickable with no extra expand step.
    const nav = page.getByRole('navigation', {
      name: 'Documentation sections',
    });
    await nav
      .getByRole('link', { name: 'Required / Optional Marking' })
      .click();
    await expect(page).toHaveURL(/\/form-field-wrapper\/field-marking$/);

    await page.locator('#fullName').focus();
    await page.locator('#fullName').blur();

    const content = errorContentLocator(page, 'fullName');
    await expect(content).toHaveCSS('border-color', 'rgb(219, 24, 24)');
  });
});

test.describe('Form Field Wrapper - Brand Theming - accessibility', () => {
  test('brand theme, light mode: no WCAG 2.2 AA violations', async ({
    page,
  }) => {
    await page.goto(DEMO_PATHS.brandTheming);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#monthlyBudget').fill('7500');
    await page.locator('#monthlyBudget').blur();

    // Scoped to the routed content region (`#maincontent`) PLUS the
    // right-hand display-controls rail (`#right-panel`), rather than the
    // whole document: the app shell's nav/header is shared across every
    // route and tracked by the site-wide a11y baseline sweep
    // (src/accessibility.spec.ts) — this spec's job is proving the brand
    // page's own UI is AA-clean, not re-litigating the shared shell. The
    // "Brand theme" / "Stock theme" toggle lives in `#right-panel` (the
    // persistent rail at desktop widths), so leaving it out of the include
    // list would silently never gate that markup.
    const results = await new AxeBuilder({ page })
      .include('#maincontent')
      .include('#right-panel')
      .withTags([...WCAG_22_AA_TAGS])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('brand theme, dark mode: no WCAG 2.2 AA violations', async ({
    page,
  }) => {
    await page.goto(DEMO_PATHS.brandTheming);
    await page.evaluate(() => {
      localStorage.setItem('color-theme', 'dark');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.locator('#monthlyBudget').fill('7500');
    await page.locator('#monthlyBudget').blur();

    // Scoped to the routed content region (`#maincontent`) PLUS the
    // right-hand display-controls rail (`#right-panel`), rather than the
    // whole document: the app shell's nav/header is shared across every
    // route and tracked by the site-wide a11y baseline sweep
    // (src/accessibility.spec.ts) — this spec's job is proving the brand
    // page's own UI is AA-clean, not re-litigating the shared shell. The
    // "Brand theme" / "Stock theme" toggle lives in `#right-panel` (the
    // persistent rail at desktop widths), so leaving it out of the include
    // list would silently never gate that markup.
    const results = await new AxeBuilder({ page })
      .include('#maincontent')
      .include('#right-panel')
      .withTags([...WCAG_22_AA_TAGS])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
