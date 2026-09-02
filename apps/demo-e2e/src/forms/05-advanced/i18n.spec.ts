import { expect, test } from '@playwright/test';

import { ROLE_ALERT_SELECTOR } from '../../fixtures/aria-selectors';
import { I18nDemoPage } from '../../page-objects/i18n.page';

test.describe('Advanced - i18n: Runtime Language Switch', () => {
  let page: I18nDemoPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new I18nDemoPage(playwrightPage);
    await page.goto();
  });

  test('should load the i18n demo', async () => {
    await expect(page.form).toBeVisible();
    await expect(page.fullNameInput).toBeVisible();
    await expect(page.emailInput).toBeVisible();
  });

  test('shows Form State & Validation bound to the live i18n form tree', async () => {
    await expect(page.page.locator('ngx-split-layout')).toBeVisible();
    await expect(page.page.locator('ngx-signal-form-debugger')).toBeVisible();
  });

  test('should switch the required error text on a runtime language change', async () => {
    await test.step('Touch full name to trigger the required error in English', async () => {
      await page.fullNameInput.focus();
      await page.fullNameInput.blur();

      const errors = page.page.locator(ROLE_ALERT_SELECTOR);
      await expect(errors.first()).toBeVisible({ timeout: 2000 });
      await expect(errors.first()).toContainText('This field is required.');
    });

    await test.step('Switch to Nederlands and confirm the same error re-renders in Dutch', async () => {
      await page.langSwitch('nl').click();

      const errors = page.page.locator(ROLE_ALERT_SELECTOR);
      await expect(errors.first()).toContainText('Dit veld is verplicht.');
    });

    await test.step('Switch to 日本語 and confirm the error re-renders again', async () => {
      await page.langSwitch('ja').click();

      const errors = page.page.locator(ROLE_ALERT_SELECTOR);
      await expect(errors.first()).toContainText('この項目は必須です。');
    });
  });

  test('should keep the parameterised minLength count correct across languages', async () => {
    await test.step('Type one character to trigger minLength(3) in English', async () => {
      await page.fullNameInput.fill('a');
      await page.fullNameInput.blur();

      const errors = page.page.locator(ROLE_ALERT_SELECTOR);
      await expect(errors.first()).toContainText(
        'Enter at least 3 characters.',
      );
    });

    await test.step('Switch to Nederlands and confirm the param interpolates correctly', async () => {
      await page.langSwitch('nl').click();

      const errors = page.page.locator(ROLE_ALERT_SELECTOR);
      await expect(errors.first()).toContainText('Voer minimaal 3 tekens in.');
    });

    await test.step('Switch to 日本語 and confirm the param interpolates correctly there too', async () => {
      await page.langSwitch('ja').click();

      const errors = page.page.locator(ROLE_ALERT_SELECTOR);
      await expect(errors.first()).toContainText('3文字以上入力してください。');
    });
  });

  test('should re-render the visible <label> text on a runtime language change', async () => {
    // The visible <label> uses the hand-rolled fieldLabel() interpolation —
    // a distinct code path from provideFieldLabels(), which only reaches the
    // error summary. Assert this path re-renders too, not just the summary.
    await test.step('Verify the English label', async () => {
      await expect(page.emailLabel).toHaveText('Email address');
    });

    await test.step('Switch to Nederlands and confirm the visible label re-renders', async () => {
      await page.langSwitch('nl').click();
      await expect(page.emailLabel).toHaveText('E-mailadres');
    });

    await test.step('Switch to 日本語 and confirm the visible label re-renders again', async () => {
      await page.langSwitch('ja').click();
      await expect(page.emailLabel).toHaveText('メールアドレス');
    });
  });

  test('should translate field labels in the error summary on a runtime language change', async () => {
    await test.step('Submit the empty form to populate the error summary', async () => {
      const submitButton = page.page.getByRole('button', { name: /Submit/iu });
      await submitButton.click();
    });

    await test.step('Verify the summary uses the English field labels', async () => {
      await expect(page.errorSummary).toBeVisible({ timeout: 3000 });
      await expect(page.errorSummary).toContainText('Full name');
      await expect(page.errorSummary).toContainText('Email address');
    });

    await test.step('Switch to Nederlands and confirm the summary relabels in place', async () => {
      await page.langSwitch('nl').click();

      await expect(page.errorSummary).toContainText('Volledige naam');
      await expect(page.errorSummary).toContainText('E-mailadres');
    });
  });
});
