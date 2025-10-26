import { Page, expect } from '@playwright/test';

/**
 * Reusable form validation test patterns
 */

/**
 * Verifies that NO error messages are visible on initial page load.
 * This is critical for 'on-touch' error display strategy.
 *
 * @param page - Playwright page object
 * @param options - Optional configuration
 */
export async function verifyNoErrorsOnInitialLoad(
  page: Page,
  options: {
    waitForLoadState?: 'load' | 'domcontentloaded' | 'networkidle';
    visibleFieldSelectors?: string[];
  } = {},
) {
  const { waitForLoadState = 'domcontentloaded', visibleFieldSelectors = [] } =
    options;

  // Wait for the main document to be ready
  await page.waitForLoadState(waitForLoadState);

  // Ensure at least one form control is visible to avoid racing Angular init
  const firstControl = page
    .locator('form input, form select, form textarea')
    .first();
  await firstControl.waitFor({ state: 'visible' });

  // Optionally ensure caller-specified fields are visible (e.g., for specific pages)
  for (const selector of visibleFieldSelectors) {
    await page.locator(selector).waitFor({ state: 'visible' });
  }

  /// Verify NO error messages are visible (allow brief stabilization window)
  const alerts = page.locator('[role="alert"]');
  await expect(alerts).toHaveCount(0, { timeout: 2000 });
}

/**
 * Verifies that errors appear after blur event (on-touch strategy)
 *
 * @param page - Playwright page object
 * @param fieldSelector - CSS selector for the input field
 * @param expectedErrorPattern - Regex pattern to match error message
 */
export async function verifyErrorsAfterBlur(
  page: Page,
  fieldSelector: string,
  expectedErrorPattern?: RegExp,
) {
  const field = page.locator(fieldSelector);

  await field.focus();
  await field.blur();

  const alerts = page.locator('[role="alert"]');
  await expect(alerts.first()).toBeVisible();

  if (expectedErrorPattern) {
    await expect(alerts.first()).toContainText(expectedErrorPattern);
  }
}

/**
 * Verifies that errors clear when valid data is entered
 *
 * @param page - Playwright page object
 * @param fieldSelector - CSS selector for the input field
 * @param validValue - Valid value to enter
 */
export async function verifyErrorsClearWithValidData(
  page: Page,
  fieldSelector: string,
  validValue: string,
) {
  const field = page.locator(fieldSelector);

  await field.fill(validValue);
  await field.blur();

  /// Field should not have aria-invalid="true" when valid
  await expect(field).not.toHaveAttribute('aria-invalid', 'true');
}

/**
 * Verifies error display mode switching behavior
 *
 * @param page - Playwright page object
 * @param modeName - Name of the error mode radio button
 */
export async function switchErrorMode(page: Page, modeName: string) {
  const modeRadio = page.getByRole('radio', { name: modeName });
  await expect(modeRadio).toBeVisible();
  await modeRadio.check();
  await expect(modeRadio).toBeChecked();
}

/**
 * Verifies that form submission works with valid data
 *
 * @param page - Playwright page object
 * @param submitButtonSelector - Text pattern to find submit button
 * @param verifyReset - Whether to verify form resets after submission
 */
export async function submitFormWithValidData(
  page: Page,
  submitButtonSelector: string | RegExp,
  verifyReset = true,
) {
  const submitButton = page.getByRole('button', {
    name: submitButtonSelector,
  });
  await submitButton.click();

  if (verifyReset) {
    /// After successful submission, first input should be empty
    const firstInput = page.locator('form input').first();
    await expect(firstInput).toHaveValue('');
  }
}

/**
 * Verifies that form prevents submission with invalid data
 *
 * @param page - Playwright page object
 * @param submitButtonSelector - Text pattern to find submit button
 */
export async function preventInvalidSubmission(
  page: Page,
  submitButtonSelector: string | RegExp,
) {
  const submitButton = page.getByRole('button', {
    name: submitButtonSelector,
  });
  await submitButton.click();

  /// Errors should be visible after submit attempt
  const alerts = page.locator('[role="alert"]');
  await expect(alerts.first()).toBeVisible();
}
