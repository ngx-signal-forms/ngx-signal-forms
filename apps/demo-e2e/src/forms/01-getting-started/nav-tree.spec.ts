import { expect, test } from '@playwright/test';

import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';

test.describe('Demo app navigation tree', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_PATHS.yourFirstForm);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should expand a category and navigate to the global configuration page', async ({
    page,
  }) => {
    await test.step('Expand the Advanced Scenarios category', async () => {
      const nav = page.getByRole('navigation', {
        name: 'Documentation sections',
      });
      const advancedButton = nav.getByRole('button', {
        name: /Advanced Scenarios/i,
      });

      await expect(advancedButton).toHaveAttribute('aria-expanded', 'false');
      await advancedButton.click();
      await expect(advancedButton).toHaveAttribute('aria-expanded', 'true');

      const globalConfigLink = nav.getByRole('link', {
        name: 'Global Configuration',
      });
      await expect(globalConfigLink).toBeVisible();
      await globalConfigLink.click();
    });

    await test.step('Verify navigation landed on the Global Configuration page', async () => {
      await expect(page).toHaveURL(
        /\/advanced-scenarios\/global-configuration$/,
      );
      await expect(
        page.getByRole('heading', {
          name: 'Global Toolkit Configuration',
          level: 1,
        }),
      ).toBeVisible();
    });
  });

  test('should collapse and reveal the nested links on demand', async ({
    page,
  }) => {
    await test.step('Expand the Form Field Wrapper category', async () => {
      const nav = page.getByRole('navigation', {
        name: 'Documentation sections',
      });
      const formFieldButton = nav.getByRole('button', {
        name: /Form Field Wrapper/i,
      });

      await expect(formFieldButton).toHaveAttribute('aria-expanded', 'false');
      await formFieldButton.click();

      await expect(formFieldButton).toHaveAttribute('aria-expanded', 'true');
      await expect(
        nav.getByRole('link', { name: /Complex Forms \(Nested \+ Arrays\)/i }),
      ).toBeVisible();

      await test.step('Collapse and verify inert state', async () => {
        await formFieldButton.click();

        const formFieldPanel = nav.locator('#form-field-wrapper-panel');
        await expect(formFieldButton).toHaveAttribute('aria-expanded', 'false');
        await expect(formFieldPanel).toHaveAttribute('data-open', 'false');
        await expect(
          formFieldPanel.locator('.cat__panel-inner'),
        ).toHaveAttribute('inert', '');
      });
    });
  });
});
