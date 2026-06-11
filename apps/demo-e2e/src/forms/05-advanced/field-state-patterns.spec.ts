import { expect, test } from '@playwright/test';
import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';

/**
 * Field State Patterns - E2E Tests
 * Route: /advanced-scenarios/field-state-patterns
 *
 * Tests hidden(), disabled(), and readonly() driven by schema logic:
 * - hidden: invite code hidden until invite-only is checked
 * - disabled: mobile number disabled until SMS preference is selected
 * - readonly: work email readonly when managed-by-identity-provider is checked
 */

test.describe('Advanced Scenarios - Field State Patterns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_PATHS.fieldStatePatterns);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the page with correct heading', async ({ page }) => {
    await expect(
      page.locator('h1', { hasText: /field state patterns/i }),
    ).toBeVisible();
    await expect(page.locator('form').first()).toBeVisible();
  });

  test('should hide the invite-code field until invite-only is checked (hidden)', async ({
    page,
  }) => {
    const inviteCodeInput = page.locator('#field-state-invite-code');

    // Initially invite-only is unchecked — invite-code must not be visible
    // (hidden at the attribute/CSS level via the wrapper; always in the DOM).
    await expect(inviteCodeInput).not.toBeVisible();

    // Enable invite-only.
    await page.locator('#field-state-invite-only').check();

    // Now the invite-code field must appear.
    await expect(inviteCodeInput).toBeVisible();
  });

  test('should re-hide the invite-code field when invite-only is unchecked', async ({
    page,
  }) => {
    const inviteOnlyCheckbox = page.locator('#field-state-invite-only');
    const inviteCodeInput = page.locator('#field-state-invite-code');

    await inviteOnlyCheckbox.check();
    await expect(inviteCodeInput).toBeVisible();

    await inviteOnlyCheckbox.uncheck();
    await expect(inviteCodeInput).not.toBeVisible();
  });

  test('should disable the mobile-number field until SMS preference is selected (disabled)', async ({
    page,
  }) => {
    const mobileInput = page.locator('#field-state-mobile-number');
    const preferenceSelect = page.locator('#field-state-contact-preference');

    // Default preference is 'email' — mobile number must be disabled.
    await expect(mobileInput).toBeDisabled();

    // Switch to SMS.
    await preferenceSelect.selectOption('sms');

    // Mobile number must now be enabled.
    await expect(mobileInput).not.toBeDisabled();
  });

  test('should re-disable the mobile-number field when preference reverts to email', async ({
    page,
  }) => {
    const mobileInput = page.locator('#field-state-mobile-number');
    const preferenceSelect = page.locator('#field-state-contact-preference');

    await preferenceSelect.selectOption('sms');
    await expect(mobileInput).not.toBeDisabled();

    await preferenceSelect.selectOption('email');
    await expect(mobileInput).toBeDisabled();
  });

  test('should set the work-email field to readonly when managed by identity provider (readonly)', async ({
    page,
  }) => {
    const workEmailInput = page.locator('#field-state-work-email');
    const managedByIdpCheckbox = page.locator('#field-state-managed-by-idp');

    // Initially the work email should be editable.
    await expect(workEmailInput).not.toHaveAttribute('readonly');

    // Toggle on identity-provider management.
    await managedByIdpCheckbox.check();

    // Work email must now be readonly.
    await expect(workEmailInput).toHaveAttribute('readonly');
  });

  test('should make the work-email field editable again when identity-provider management is turned off', async ({
    page,
  }) => {
    const workEmailInput = page.locator('#field-state-work-email');
    const managedByIdpCheckbox = page.locator('#field-state-managed-by-idp');

    await managedByIdpCheckbox.check();
    await expect(workEmailInput).toHaveAttribute('readonly');

    await managedByIdpCheckbox.uncheck();
    await expect(workEmailInput).not.toHaveAttribute('readonly');
  });

  test('should accept valid preferences and show a success message on submit', async ({
    page,
  }) => {
    // Fill valid work email and submit.
    const workEmailInput = page.locator('#field-state-work-email');
    await workEmailInput.fill('ada@company.com');

    await page.getByRole('button', { name: /save preferences/i }).click();

    // A success message should appear.
    await expect(
      page.locator('[role="status"]', { hasText: /saved/i }).first(),
    ).toBeVisible({ timeout: 3000 });
  });

  test('should reflect state in the debug display', async ({ page }) => {
    // The debug panel renders workEmail.readonly(), mobileNumber.disabled(),
    // inviteCode.hidden() directly in the DOM.
    const debugPanel = page.locator('.font-mono').filter({
      hasText: /mobileNumber\.disabled\(\)/,
    });

    await expect(debugPanel).toContainText('mobileNumber.disabled(): true');
    await expect(debugPanel).toContainText('inviteCode.hidden(): true');
    await expect(debugPanel).toContainText('workEmail.readonly(): false');
  });
});
