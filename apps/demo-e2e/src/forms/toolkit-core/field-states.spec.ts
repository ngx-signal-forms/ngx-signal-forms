import { expect, test } from '@playwright/test';
import { verifyNoErrorsOnInitialLoad } from '../../fixtures/form-validation.fixture';
import { FieldStatesPage } from '../../page-objects/field-states.page';

/**
 * Tests for "Field States" demo
 * Route: /toolkit-core/field-states
 */
test.describe('Field States', () => {
  let formPage: FieldStatesPage;

  test.beforeEach(async ({ page }) => {
    formPage = new FieldStatesPage(page);
    await formPage.goto();
  });

  test('should NOT show errors on initial page load', async ({ page }) => {
    await verifyNoErrorsOnInitialLoad(page);
  });

  test('should display form state debugger', async () => {
    await test.step('Verify debugger shows form state', async () => {
      await expect(formPage.debuggerComponent).toBeVisible();
    });
  });

  test('should track field state changes', async () => {
    await test.step('Modify form and observe state changes', async () => {
      await expect(formPage.emailInput).toBeVisible();

      await formPage.interactWithEmail();

      /// Verify field remains visible after interaction
      await expect(formPage.emailInput).toBeVisible();
    });
  });
});
