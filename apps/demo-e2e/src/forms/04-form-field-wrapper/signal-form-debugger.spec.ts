import { expect, test } from '@playwright/test';
import { FormFieldWrapperComplexPage } from '../../page-objects/form-field-wrapper-complex.page';
import { OutlineFormFieldPage } from '../../page-objects/outline-form-field.page';

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
    page.locator('ngx-signal-form-debugger');

  test.describe('Initial State', () => {
    test('should show Form Model section collapsed by default', async ({
      page,
    }) => {
      const debugger_ = getDebugger(page);
      const formModelDetails = debugger_.locator('details').filter({
        has: page.locator('summary', { hasText: 'Form Model' }),
      });

      await expect(formModelDetails).toBeVisible();
      await expect(formModelDetails).not.toHaveAttribute('open');
    });

    test('should show 0/total visible errors on initial load', async ({
      page,
    }) => {
      const debugger_ = getDebugger(page);
      const validationErrorsHeader = debugger_.getByText(
        /Validation Errors \d+\/\d+/,
      );
      await expect(validationErrorsHeader).toBeVisible();

      const headerText = await validationErrorsHeader.textContent();
      const match = headerText?.match(/Validation Errors (\d+)\/(\d+)/);
      expect(match).toBeTruthy();

      const [, visible, total] = match!;
      expect(Number(visible)).toBe(0);
      expect(Number(total)).toBeGreaterThan(0);
    });

    test('should show all errors as "Hidden by strategy" initially', async ({
      page,
    }) => {
      const debugger_ = getDebugger(page);
      const hiddenByStrategyBadges = debugger_.getByText('Hidden by strategy');
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

      const debugger_ = getDebugger(page);
      const validationErrorsHeader = debugger_.getByText(
        /Validation Errors \d+\/\d+/,
      );
      await expect(validationErrorsHeader).toBeVisible();

      const headerText = await validationErrorsHeader.textContent();
      const match = headerText?.match(/Validation Errors (\d+)\/(\d+)/);
      expect(match).toBeTruthy();

      const [, visible, total] = match!;
      expect(Number(visible)).toBe(1);
      expect(Number(total)).toBeGreaterThan(1);
    });

    test('should show touched field error without "Hidden by strategy" badge in debugger', async ({
      page,
    }) => {
      const lastNameInput = page.getByRole('textbox', { name: 'Last Name *' });
      await lastNameInput.focus();
      await lastNameInput.blur();

      const debugger_ = getDebugger(page);

      // Find the error entry div that contains "Last name is required" text
      const lastNameErrorEntry = debugger_
        .locator('div.rounded-md.border')
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

      const debugger_ = getDebugger(page);
      const hiddenByStrategyBadges = debugger_.getByText('Hidden by strategy');
      const count = await hiddenByStrategyBadges.count();

      // Should have multiple errors still hidden (total - 1)
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('After Touching Multiple Fields', () => {
    test('should increment visible count for each touched field', async ({
      page,
    }) => {
      const debugger_ = getDebugger(page);

      // Touch Last Name
      const lastNameInput = page.getByRole('textbox', { name: 'Last Name *' });
      await lastNameInput.focus();
      await lastNameInput.blur();

      let headerText = await debugger_
        .getByText(/Validation Errors \d+\/\d+/)
        .textContent();
      let match = headerText?.match(/Validation Errors (\d+)\/(\d+)/);
      expect(Number(match![1])).toBe(1);

      // Touch Email (using role to be specific)
      const emailInput = page.getByRole('textbox', { name: 'Email *' });
      await emailInput.focus();
      await emailInput.blur();

      headerText = await debugger_
        .getByText(/Validation Errors \d+\/\d+/)
        .textContent();
      match = headerText?.match(/Validation Errors (\d+)\/(\d+)/);
      expect(Number(match![1])).toBe(2);

      // Touch Street Address
      const streetInput = page.getByRole('textbox', {
        name: 'Street Address *',
      });
      await streetInput.focus();
      await streetInput.blur();

      headerText = await debugger_
        .getByText(/Validation Errors \d+\/\d+/)
        .textContent();
      match = headerText?.match(/Validation Errors (\d+)\/(\d+)/);
      expect(Number(match![1])).toBe(3);
    });
  });

  test.describe('Error Display Strategy Info', () => {
    test('should show error display strategy indicator', async ({ page }) => {
      const debugger_ = getDebugger(page);
      await expect(
        debugger_.getByText('Error Display Strategy:', { exact: false }),
      ).toBeVisible();
      await expect(debugger_.getByText('on-touch')).toBeVisible();
    });

    test('should show warning about hidden errors initially', async ({
      page,
    }) => {
      const debugger_ = getDebugger(page);
      await expect(
        debugger_.getByText(/Errors hidden until you touch.*fields/i),
      ).toBeVisible();
    });

    test('should update message after field is touched', async ({ page }) => {
      const lastNameInput = page.getByRole('textbox', { name: 'Last Name *' });
      await lastNameInput.focus();
      await lastNameInput.blur();

      const debugger_ = getDebugger(page);
      await expect(
        debugger_.getByText(/Errors shown because fields were touched/i),
      ).toBeVisible();
    });
  });
});

test.describe('Signal Form Debugger - Outline Form Field Page', () => {
  test.beforeEach(async ({ page }) => {
    const formPage = new OutlineFormFieldPage(page);
    await formPage.goto();
  });

  /**
   * Helper to get the debugger component
   */
  const getDebugger = (page: import('@playwright/test').Page) =>
    page.locator('ngx-signal-form-debugger');

  test('should show 0/4 visible errors on initial load', async ({ page }) => {
    const debugger_ = getDebugger(page);
    const validationErrorsHeader = debugger_.getByText(
      /Validation Errors \d+\/\d+/,
    );
    await expect(validationErrorsHeader).toBeVisible();

    const headerText = await validationErrorsHeader.textContent();
    const match = headerText?.match(/Validation Errors (\d+)\/(\d+)/);
    expect(match).toBeTruthy();

    const [, visible, total] = match!;
    expect(Number(visible)).toBe(0);
    expect(Number(total)).toBe(4);
  });

  test('should show 1/4 after touching Pleegdatum field', async ({ page }) => {
    const pleegdatumInput = page.getByLabel('Pleegdatum', { exact: true });
    await pleegdatumInput.focus();
    await pleegdatumInput.blur();

    const debugger_ = getDebugger(page);
    const validationErrorsHeader = debugger_.getByText(
      /Validation Errors \d+\/\d+/,
    );
    const headerText = await validationErrorsHeader.textContent();
    const match = headerText?.match(/Validation Errors (\d+)\/(\d+)/);

    expect(Number(match![1])).toBe(1);
    expect(Number(match![2])).toBe(4);
  });

  test('should show Pleegdatum error as visible after touch', async ({
    page,
  }) => {
    const pleegdatumInput = page.getByLabel('Pleegdatum', { exact: true });
    await pleegdatumInput.focus();
    await pleegdatumInput.blur();

    const debugger_ = getDebugger(page);

    // Find the Pleegdatum error entry in the debugger
    const pleegdatumErrorEntry = debugger_
      .locator('div.rounded-md.border')
      .filter({ hasText: 'Pleegdatum is verplicht' });
    await expect(pleegdatumErrorEntry).toBeVisible();

    // Find the Validation Errors section to scope the check
    const validationErrorsSection = debugger_
      .locator('details')
      .filter({ has: page.getByText('Validation Errors') });

    // Count hidden badges - should be 3 (total 4 - 1 visible)
    // We scope to validation errors section to avoid counting warning badges
    const hiddenBadges =
      validationErrorsSection.getByText('Hidden by strategy');
    const count = await hiddenBadges.count();
    expect(count).toBe(3);
  });
});

test.describe('Signal Form Debugger - Warnings Section', () => {
  test.beforeEach(async ({ page }) => {
    const formPage = new OutlineFormFieldPage(page);
    await formPage.goto();
  });

  /**
   * Helper to get the debugger component
   */
  const getDebugger = (page: import('@playwright/test').Page) =>
    page.locator('ngx-signal-form-debugger');

  test('should show warnings section with visible/total count', async ({
    page,
  }) => {
    const debugger_ = getDebugger(page);
    const warningsHeader = debugger_.getByText(/Warnings.*\d+\/\d+/);
    await expect(warningsHeader).toBeVisible();
  });

  test('should display warning messages', async ({ page }) => {
    const debugger_ = getDebugger(page);
    await expect(
      debugger_.getByText(/Overweeg een plaatsbeschrijving toe te voegen/),
    ).toBeVisible();
  });
});
