import { expect, test } from '@playwright/test';
import { verifyNoErrorsOnInitialLoad } from '../../fixtures/form-validation.fixture';
import { WarningSupportPage } from '../../page-objects/warning-support.page';

test.describe('Warning Support Demo', () => {
  let page: WarningSupportPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new WarningSupportPage(playwrightPage);
    await page.goto();
  });

  test('should NOT show errors on initial load (CRITICAL BUG CHECK)', async ({
    page: playwrightPage,
  }) => {
    // oxlint-disable-next-line @typescript-eslint/no-confusing-void-expression -- sentinel assertion; fixture throws on failure
    const result = await verifyNoErrorsOnInitialLoad(playwrightPage, {
      visibleFieldSelectors: [
        'input#username',
        'input#email',
        'input#password',
      ],
    });
    expect(result).toBeUndefined(); // Fixture throws if errors found
  });

  test.describe('Field Structure', () => {
    test('should display all required form fields', async () => {
      await expect(page.usernameInput).toBeVisible();
      await expect(page.emailInput).toBeVisible();
      await expect(page.passwordInput).toBeVisible();
      await expect(page.submitButton).toBeVisible();
    });
  });

  test.describe('Progressive Error Disclosure', () => {
    test('should NOT show errors in on-touch mode until field is touched', async () => {
      // Focus and blur without entering data
      await page.usernameInput.focus();
      await page.usernameInput.blur();

      // Error should appear after blur
      await expect(page.errorAlerts.first()).toBeVisible();
    });
  });

  test.describe('Warnings vs Errors', () => {
    test('should display warning for weak password (8-11 chars)', async () => {
      // Fill with password that meets minimum (8 chars) but triggers warning
      await page.usernameInput.fill('testuser');
      await page.emailInput.fill('test@example.com');
      await page.passwordInput.fill('Short123'); // 8 chars - meets minimum but triggers warning
      await page.passwordInput.blur();

      // Should have warning status element (role="status" for warnings)
      const warningStatus = page.page.locator('[role="status"]');
      await expect(warningStatus.first()).toBeVisible();
      await expect(warningStatus.first()).toContainText(
        /12\+ characters for better security/i,
      );
    });

    test('should display warning for simple password composition', async () => {
      // Fill with password that lacks character variety
      await page.usernameInput.fill('testuser');
      await page.emailInput.fill('test@example.com');
      await page.passwordInput.fill('alllowercase'); // Only lowercase - triggers composition warning
      await page.passwordInput.blur();

      // Should show warning about character mixing
      const warningStatus = page.page.locator('[role="status"]');
      await expect(warningStatus).toContainText(
        /mixing uppercase, lowercase, numbers/i,
      );
    });

    test('should display warning for short username (3-5 chars)', async () => {
      // Username with 4 chars - valid but triggers warning
      await page.usernameInput.fill('user'); // 4 chars
      await page.usernameInput.blur();

      const warningStatus = page.page.locator('[role="status"]');
      await expect(warningStatus.first()).toBeVisible();
      await expect(warningStatus.first()).toContainText(
        /6\+ characters for better security/i,
      );
    });

    test('should allow submission with warnings (non-blocking)', async () => {
      await page.fillWithWarnings();

      // Warnings should be visible
      const warningStatus = page.page.locator('[role="status"]');
      await expect(warningStatus.first()).toBeVisible();

      // Submit should work even with warnings (INTENDED BEHAVIOR)
      await page.submit();

      // Success message should appear (warnings don't block submission)
      await expect(page.successMessage).toBeVisible({ timeout: 3000 });
      await expect(page.successMessage).toContainText(/created successfully/i);
    });

    test('should display both errors and warnings simultaneously', async () => {
      // Trigger blocking error (empty required field) and warning (short username)
      await page.usernameInput.fill('usr'); // 3 chars - valid but shows warning
      await page.usernameInput.blur();

      // Leave email empty and blur to trigger required error
      await page.emailInput.focus();
      await page.emailInput.blur();

      // Should show warning for username (role="status")
      const warnings = page.page.locator('[role="status"]');
      await expect(warnings.first()).toBeVisible();

      // Should show error for email (role="alert")
      const errors = page.page.locator('[role="alert"]');
      await expect(errors.first()).toBeVisible();
      await expect(errors.first()).toContainText(/required/i);
    });

    test('should use correct ARIA roles for errors vs warnings', async () => {
      // Fill to trigger both error and warning
      await page.usernameInput.fill('usr'); // Triggers warning
      await page.passwordInput.fill('short'); // Less than 8 chars - triggers error
      await page.passwordInput.blur();

      // Errors use role="alert" (assertive)
      const alerts = page.page.locator('[role="alert"]');
      await expect(alerts.first()).toBeVisible();

      // Warnings use role="status" (polite)
      const statuses = page.page.locator('[role="status"]');
      await expect(statuses.first()).toBeVisible();
    });

    test('should apply warning CSS class when only warnings exist (no blocking errors)', async () => {
      // Fill username with short value to trigger warning only (no blocking error)
      await page.usernameInput.fill('user'); // 4 chars - valid but triggers warning
      await page.usernameInput.blur();

      // Password field (field with only warning, no error)
      const usernameFormField = page.page.locator(
        'ngx-signal-form-field-wrapper:has(input#username)',
      );

      // Should have warning class applied
      await expect(usernameFormField).toHaveClass(
        /ngx-signal-form-field-wrapper--warning/,
      );
    });

    test('should NOT apply warning CSS class when blocking errors exist', async () => {
      // Fill with invalid values that trigger blocking errors
      await page.usernameInput.fill('ab'); // 2 chars - triggers blocking minLength error
      await page.usernameInput.blur();

      const usernameFormField = page.page.locator(
        'ngx-signal-form-field-wrapper:has(input#username)',
      );

      // Should NOT have warning class - errors take priority
      await expect(usernameFormField).not.toHaveClass(
        /ngx-signal-form-field-wrapper--warning/,
      );
    });
  });

  test.describe('Form Validation', () => {
    test('should validate required fields on submit', async () => {
      await test.step('Submit empty form', async () => {
        await page.submit();
      });

      await test.step('Verify errors are visible for required fields', async () => {
        const alerts = page.page.locator('[role="alert"]');
        await expect(alerts.first()).toBeVisible();
      });

      await test.step('Touch a field to confirm error display persists', async () => {
        await page.usernameInput.focus();
        await page.usernameInput.blur();

        // NOW errors should appear
        await expect(page.errorAlerts.first()).toBeVisible();
      });
    });

    test('should validate email format', async () => {
      await page.usernameInput.fill('testuser');
      await page.emailInput.fill('invalid-email');
      await page.passwordInput.fill('password123');
      await page.emailInput.blur();

      // Should show email validation error
      const emailError = page.page.locator('#email-error');
      await expect(emailError).toBeVisible();
    });

    test('should clear errors when valid data is entered', async () => {
      // Trigger error
      await page.usernameInput.focus();
      await page.usernameInput.blur();

      await expect(page.errorAlerts.first()).toBeVisible();

      // Fix the error
      await page.usernameInput.fill('validusername');
      await page.usernameInput.blur();

      // Error should be cleared
      const usernameError = page.page.locator('#username-error');
      await expect(usernameError).toBeHidden();
    });
  });

  test.describe('Form Submission', () => {
    test('should show success message after valid submission (no warnings)', async () => {
      await page.usernameInput.fill('testuser123');
      await page.usernameInput.blur();

      await page.emailInput.fill('test@example.com');
      await page.emailInput.blur();

      await page.passwordInput.fill('StrongPassword123!');
      await page.passwordInput.blur();

      await page.submit();

      // Success message should appear (role="status" for non-critical updates)
      await expect(page.successMessage).toBeVisible({ timeout: 3000 });
      await expect(page.successMessage).toContainText(/created successfully/i);
      await expect(page.successMessage).toContainText(
        /warnings did not block/i,
      );
    });

    test('should NOT submit when form has blocking errors', async () => {
      // Fill form with invalid data (too short)
      await page.usernameInput.fill('ab'); // 2 chars - below minimum
      await page.emailInput.fill('invalid'); // Invalid email
      await page.passwordInput.fill('short'); // 5 chars - below minimum

      await page.submit();

      // Success message should NOT appear because form is invalid
      await expect(page.successMessage).toBeHidden();
    });
  });
});
