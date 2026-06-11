import { expect, test } from '@playwright/test';
import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';

/**
 * Field Marking - E2E Tests
 * Route: /form-field-wrapper/field-marking
 *
 * Tests required/optional field marking modes, marker text configuration,
 * the NgxFormMarkingLegend component, and error display on submit.
 */

test.describe('Form Field Wrapper - Field Marking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_PATHS.fieldMarking);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the page with correct heading', async ({ page }) => {
    await expect(
      page.locator('h1', {
        hasText: /required \/ optional field marking/i,
      }),
    ).toBeVisible();
    await expect(page.locator('form').first()).toBeVisible();
  });

  test('should render required-field markers in "Mark required" mode (default)', async ({
    page,
  }) => {
    // Default mode is 'required' — full-name and email are always required.
    // The marker text defaults to ' *'.
    const fullNameWrapper = page
      .locator('ngx-form-field-wrapper')
      .filter({ has: page.locator('#fullName') });
    const phoneWrapper = page
      .locator('ngx-form-field-wrapper')
      .filter({ has: page.locator('#phone') });

    // Required fields must expose their marker text.
    await expect(fullNameWrapper).toContainText('*');

    // Phone is optional by default so it must NOT expose the required marker.
    await expect(phoneWrapper).not.toContainText('*');
  });

  test('should switch to "Mark optional" mode and update markers', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: 'Mark optional', exact: true })
      .click();

    // In 'optional' mode the always-optional fields (company, bio) get marked.
    const companyWrapper = page
      .locator('ngx-form-field-wrapper')
      .filter({ has: page.locator('#company') });

    await expect(companyWrapper).toContainText('optional');

    // Required fields must NOT carry the optional marker.
    const fullNameWrapper = page
      .locator('ngx-form-field-wrapper')
      .filter({ has: page.locator('#fullName') });
    await expect(fullNameWrapper).not.toContainText('optional');
  });

  test('should suppress all markers in "Mark none" mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Mark none', exact: true }).click();

    // No wrapper should contain ' *' (required marker) or '(optional)' text.
    const allWrappers = page.locator('ngx-form-field-wrapper');
    const count = await allWrappers.count();
    for (let i = 0; i < count; i++) {
      await expect(allWrappers.nth(i)).not.toContainText('*');
      await expect(allWrappers.nth(i)).not.toContainText('optional');
    }
  });

  test('should reflect the marking mode in the NgxFormMarkingLegend', async ({
    page,
  }) => {
    const legend = page.locator('ngx-form-marking-legend');

    // Default mode = 'required': legend references required fields.
    await expect(legend).toBeVisible();
    await expect(legend).toContainText('*');

    // Switch to 'optional': legend should now reference optional fields.
    await page
      .getByRole('button', { name: 'Mark optional', exact: true })
      .click();
    await expect(legend).toContainText('optional');

    // Switch to 'none': legend should hide itself (no relevant field).
    await page.getByRole('button', { name: 'Mark none', exact: true }).click();
    await expect(legend).not.toBeVisible();
  });

  test('should keep the legend visible and mark the phone field when it becomes required', async ({
    page,
  }) => {
    // Make phone required via the checkbox control.
    await page
      .getByRole('checkbox', { name: /make the phone field required/i })
      .check();

    // Legend must still be visible (required mode, required fields present).
    const legend = page.locator('ngx-form-marking-legend');
    await expect(legend).toBeVisible();

    // Phone wrapper should now carry the required marker.
    const phoneWrapper = page
      .locator('ngx-form-field-wrapper')
      .filter({ has: page.locator('#phone') });
    await expect(phoneWrapper).toContainText('*');
  });

  test('should show errors on required fields when they are touched and left empty', async ({
    page,
  }) => {
    // The field-marking demo has no submit button (it is a pure display form).
    // Errors surface when a required field is touched and left empty.
    const fullNameInput = page.locator('#fullName');
    const emailInput = page.locator('#email');

    // Touch fullName without filling it.
    await fullNameInput.focus();
    await fullNameInput.blur();

    await expect(
      page
        .locator('[role="alert"]', { hasText: /your name is required/i })
        .first(),
    ).toBeVisible({ timeout: 3000 });

    // Touch email without filling it.
    await emailInput.focus();
    await emailInput.blur();

    await expect(
      page.locator('[role="alert"]', { hasText: /email is required/i }).first(),
    ).toBeVisible({ timeout: 3000 });

    // The optional phone field (unchecked) must NOT show a required error.
    const phoneInput = page.locator('#phone');
    await phoneInput.focus();
    await phoneInput.blur();

    await expect(
      page.locator('[role="alert"]', { hasText: /phone is required/i }),
    ).toHaveCount(0);
  });
});
