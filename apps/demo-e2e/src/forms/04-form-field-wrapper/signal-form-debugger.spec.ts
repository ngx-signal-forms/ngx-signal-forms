import { expect, test } from '@playwright/test';
import { FormFieldWrapperComplexPage } from '../../page-objects/form-field-wrapper-complex.page';

function parseValidationCounts(headerText: string | null): {
  visible: number;
  total: number;
} {
  const match = headerText?.match(/Validation Errors (\d+)\/(\d+)/);
  expect(match).toBeTruthy();
  if (!match) {
    throw new Error('Expected validation counts in debugger header');
  }

  return {
    visible: Number(match[1]),
    total: Number(match[2]),
  };
}

function getDebuggerByHeading(
  page: import('@playwright/test').Page,
  headingName: string,
) {
  const heading = page.getByRole('heading', { name: headingName });
  return heading
    .locator('xpath=ancestor::*[.//ngx-signal-form-debugger][1]')
    .locator('ngx-signal-form-debugger');
}

/**
 * Signal Form Debugger Component Tests
 *
 * Tests the debugger's visibility counts feature:
 * - Form Model section collapsed by default
 * - Shows "visible/total" error counts (e.g., "1/11")
 * - Per-field error visibility based on touched state
 * - Works correctly with on-touch error display strategy
 */
test.describe('Signal Form Debugger - Visibility Counts', () => {
  test.beforeEach(async ({ page }) => {
    const formPage = new FormFieldWrapperComplexPage(page);
    await formPage.goto();
  });

  /**
   * Helper to get the debugger component
   */
  const getDebugger = (page: import('@playwright/test').Page) =>
    getDebuggerByHeading(page, 'Complex Form State');

  test.describe('Initial State', () => {
    test('should show Form Model section collapsed by default', async ({
      page,
    }) => {
      const debuggerPanel = getDebugger(page);
      const formModelDetails = debuggerPanel.locator('details').filter({
        has: page.locator('summary', { hasText: 'Form Model' }),
      });

      await expect(formModelDetails).toBeVisible();
      await expect(formModelDetails).not.toHaveAttribute('open');
    });

    test('should show 0/total visible errors on initial load', async ({
      page,
    }) => {
      const debuggerPanel = getDebugger(page);
      const validationErrorsHeader = debuggerPanel.getByText(
        /Validation Errors \d+\/\d+/,
      );
      await expect(validationErrorsHeader).toBeVisible();

      const headerText = await validationErrorsHeader.textContent();
      const { visible, total } = parseValidationCounts(headerText);
      expect(visible).toBe(0);
      expect(total).toBeGreaterThan(0);
    });

    test('should show all errors as "Hidden by strategy" initially', async ({
      page,
    }) => {
      const debuggerPanel = getDebugger(page);
      const hiddenByStrategyBadges =
        debuggerPanel.getByText('Hidden by strategy');
      await expect(hiddenByStrategyBadges.first()).toBeVisible();

      const count = await hiddenByStrategyBadges.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('After Touching One Field', () => {
    test('should show 1/total after touching one invalid field', async ({
      page,
    }) => {
      const lastNameInput = page.getByRole('textbox', { name: 'Last Name *' });
      await lastNameInput.focus();
      await lastNameInput.blur();

      const debuggerPanel = getDebugger(page);
      const validationErrorsHeader = debuggerPanel.getByText(
        /Validation Errors \d+\/\d+/,
      );
      await expect(validationErrorsHeader).toBeVisible();

      const headerText = await validationErrorsHeader.textContent();
      const { visible, total } = parseValidationCounts(headerText);
      expect(visible).toBe(1);
      expect(total).toBeGreaterThan(1);
    });

    test('should show touched field error without "Hidden by strategy" badge in debugger', async ({
      page,
    }) => {
      const lastNameInput = page.getByRole('textbox', { name: 'Last Name *' });
      await lastNameInput.focus();
      await lastNameInput.blur();

      const debuggerPanel = getDebugger(page);

      // Find the error entry div that contains "Last name is required" text
      const lastNameErrorEntry = debuggerPanel
        .getByRole('listitem')
        .filter({ hasText: 'Last name is required' });
      await expect(lastNameErrorEntry).toBeVisible();

      // Should NOT have "Hidden by strategy" badge
      const hiddenBadge = lastNameErrorEntry.getByText('Hidden by strategy');
      await expect(hiddenBadge).toHaveCount(0);
    });

    test('should keep untouched field errors showing "Hidden by strategy"', async ({
      page,
    }) => {
      const lastNameInput = page.getByRole('textbox', { name: 'Last Name *' });
      await lastNameInput.focus();
      await lastNameInput.blur();

      const debuggerPanel = getDebugger(page);
      const hiddenByStrategyBadges =
        debuggerPanel.getByText('Hidden by strategy');
      const count = await hiddenByStrategyBadges.count();

      // Should have multiple errors still hidden (total - 1)
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('After Touching Multiple Fields', () => {
    test('should increment visible count for each touched field', async ({
      page,
    }) => {
      const debuggerPanel = getDebugger(page);

      // Touch Last Name
      const lastNameInput = page.getByRole('textbox', { name: 'Last Name *' });
      await lastNameInput.focus();
      await lastNameInput.blur();

      let headerText = await debuggerPanel
        .getByText(/Validation Errors \d+\/\d+/)
        .textContent();
      let counts = parseValidationCounts(headerText);
      expect(counts.visible).toBe(1);

      // Touch Email (using role to be specific)
      const emailInput = page.getByRole('textbox', { name: 'Email *' });
      await emailInput.focus();
      await emailInput.blur();

      headerText = await debuggerPanel
        .getByText(/Validation Errors \d+\/\d+/)
        .textContent();
      counts = parseValidationCounts(headerText);
      expect(counts.visible).toBe(2);

      // Touch Street Address
      const streetInput = page.locator('#street');
      await streetInput.focus();
      await streetInput.blur();

      headerText = await debuggerPanel
        .getByText(/Validation Errors \d+\/\d+/)
        .textContent();
      counts = parseValidationCounts(headerText);
      expect(counts.visible).toBe(3);
    });
  });

  test.describe('Error Display Strategy Info', () => {
    test('should show error display strategy indicator', async ({ page }) => {
      const debuggerPanel = getDebugger(page);
      await expect(
        debuggerPanel.getByText('Error Display Strategy:', { exact: false }),
      ).toBeVisible();
      await expect(debuggerPanel.getByText('on-touch')).toBeVisible();
    });

    test('should show warning about hidden errors initially', async ({
      page,
    }) => {
      const debuggerPanel = getDebugger(page);
      await expect(
        debuggerPanel.getByText(/Errors hidden until you touch.*fields/i),
      ).toBeVisible();
    });

    test('should update message after field is touched', async ({ page }) => {
      const lastNameInput = page.getByRole('textbox', { name: 'Last Name *' });
      await lastNameInput.focus();
      await lastNameInput.blur();

      const debuggerPanel = getDebugger(page);
      await expect(
        debuggerPanel.getByText(/Errors shown because fields were touched/i),
      ).toBeVisible();
    });
  });
});
