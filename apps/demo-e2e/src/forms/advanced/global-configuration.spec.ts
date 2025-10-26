import { expect, test } from '@playwright/test';
import { GlobalConfigurationPage } from '../../page-objects/global-configuration.page';

test.describe('Advanced - Global Configuration', () => {
  let page: GlobalConfigurationPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new GlobalConfigurationPage(playwrightPage);
    await page.goto();
  });

  test('should load configuration example', async () => {
    await expect(page.form).toBeVisible();
  });

  test('should display form elements', async () => {
    // Verify the example loaded successfully
    await expect(page.form).toBeVisible();
  });
});
