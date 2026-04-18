import { expect, test } from '@playwright/test';
import { FormFieldWrapperComplexPage } from '../../page-objects/form-field-wrapper-complex.page';

test.describe('Form Field Wrapper - Complex Forms', () => {
  let page: FormFieldWrapperComplexPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new FormFieldWrapperComplexPage(playwrightPage);
    await page.goto();
  });

  test('should keep the main complex form free of errors on initial load', async ({
    page: playwrightPage,
  }) => {
    await playwrightPage.waitForLoadState('domcontentloaded');
    await page.form.locator('#firstName').waitFor({ state: 'visible' });
    await expect(page.form.locator('[role="alert"]')).toHaveCount(0);
  });

  test.describe('Component Structure', () => {
    test('should render form field wrapper components', async () => {
      const firstField = page.formFields.first();
      await expect(firstField).toBeVisible();
    });

    test('should have multiple form controls', async () => {
      await expect(page.allFormControls.first()).toBeVisible();
      const controlCount = await page.allFormControls.count();
      expect(controlCount).toBeGreaterThan(0);
    });

    test('should count form field wrappers', async () => {
      await expect(page.formFields.first()).toBeVisible();
      const count = await page.countFormFields();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Fieldset Grouping', () => {
    test('should render all fieldset sections', async () => {
      await expect(page.personalInfoFieldset).toBeVisible();
      await expect(page.addressInfoFieldset).toBeVisible();
      await expect(page.skillsFieldset).toBeVisible();
      await expect(page.contactsFieldset).toBeVisible();
      await expect(page.preferencesFieldset).toBeVisible();
    });

    test('should have exactly 6 fieldsets', async () => {
      await expect(page.fieldsets.first()).toBeVisible();
      const count = await page.countFieldsets();
      expect(count).toBe(6);
    });

    test('should render contact method radio group in preferences', async () => {
      await expect(page.preferencesContactRadios).toHaveCount(3);
    });

    test('should display aggregated errors in fieldset after submit', async () => {
      await page.submit();

      // Touch a field to trigger error display
      await page.allFormControls.first().focus();
      await page.allFormControls.first().blur();

      // Check that fieldset displays aggregated errors
      await expect(
        page.getFieldsetErrorsByLegend(/Personal Information/i).first(),
      ).toBeVisible({ timeout: 5000 });
    });

    test('fieldsets should have proper accessibility structure', async () => {
      // Check fieldset component renders content including a legend
      const legend = page.personalInfoFieldset.locator('legend');
      await expect(legend).toBeVisible();
      await expect(legend).toContainText('Personal Information');
    });
  });

  test.describe('Horizontal orientation integration', () => {
    test('should apply horizontal orientation to nested field wrappers while leaving selection rows vertical', async () => {
      await test.step('Switch the demo to horizontal orientation', async () => {
        await page.showHorizontalOrientation();

        await expect(page.horizontalOrientationButton).toHaveAttribute(
          'aria-pressed',
          'true',
        );
      });

      await test.step('Verify textual nested wrappers resolve to horizontal', async () => {
        for (const controlId of ['firstName', 'street']) {
          const wrapper = page.getWrapperByControlId(controlId);

          await expect(wrapper).toHaveAttribute(
            'data-orientation',
            'horizontal',
          );
          await expect(wrapper).toHaveClass(
            /ngx-signal-form-field-wrapper--horizontal/,
          );
        }
      });

      await test.step('Verify switch and checkbox rows keep vertical semantics', async () => {
        for (const controlId of ['newsletter', 'notifications']) {
          const wrapper = page.getWrapperByControlId(controlId);

          await expect(wrapper).toHaveAttribute('data-orientation', 'vertical');
          await expect(wrapper).not.toHaveClass(
            /ngx-signal-form-field-wrapper--horizontal/,
          );
        }
      });
    });

    test('should disable horizontal orientation when outline appearance is active', async () => {
      await test.step('Switch to horizontal orientation before selecting outline', async () => {
        await page.showHorizontalOrientation();
        await expect(page.horizontalOrientationButton).toHaveAttribute(
          'aria-pressed',
          'true',
        );
      });

      await test.step('Enable outline appearance', async () => {
        await page.showOutlineAppearance();

        await expect(page.outlineAppearanceButton).toHaveAttribute(
          'aria-pressed',
          'true',
        );
        await expect(page.horizontalOrientationButton).toBeDisabled();
        await expect(page.verticalOrientationButton).toHaveAttribute(
          'aria-pressed',
          'true',
        );
      });

      await test.step('Verify previously horizontal wrappers resolve back to vertical', async () => {
        for (const controlId of ['firstName', 'street']) {
          const wrapper = page.getWrapperByControlId(controlId);

          await expect(wrapper).toHaveAttribute('data-orientation', 'vertical');
          await expect(wrapper).not.toHaveClass(
            /ngx-signal-form-field-wrapper--horizontal/,
          );
        }
      });
    });
  });

  test.describe('Auto Error Display', () => {
    test('should automatically display errors with field wrapper', async () => {
      const firstInput = page.allFormControls.first();
      await firstInput.focus();
      await firstInput.blur();

      await expect(page.errorAlerts.first()).toBeVisible();
    });

    test('should show preference contact method errors after touch', async () => {
      await page.preferencesContactRadios.first().focus();
      await page.preferencesContactRadios.first().blur();

      await expect(
        page.getFieldsetErrorsByLegend(/Preferred contact method/i).first(),
      ).toBeVisible();
    });
  });

  test.describe('Mixed Control Families', () => {
    test('should render newsletter as a switch with correct data attributes', async () => {
      const newsletter = page.newsletterSwitch;
      await expect(newsletter).toBeVisible();
      await expect(newsletter).toHaveAttribute('role', 'switch');
      await expect(newsletter).toHaveAttribute(
        'data-ngx-signal-form-control-kind',
        'switch',
      );
    });

    test('should render notifications as a checkbox with correct data attributes', async () => {
      const notifications = page.notificationsCheckbox;
      await expect(notifications).toBeVisible();
      await expect(notifications).toHaveAttribute(
        'data-ngx-signal-form-control-kind',
        'checkbox',
      );
    });

    test('should wrap switch and checkbox in form field wrappers', async () => {
      const newsletterWrapper = page.preferencesFieldset.locator(
        'ngx-signal-form-field-wrapper',
      );
      await expect(newsletterWrapper.first()).toBeVisible();
      const count = await newsletterWrapper.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('should apply auto-ARIA to switch control after interaction', async () => {
      const newsletter = page.newsletterSwitch;
      await newsletter.focus();
      await newsletter.blur();
      await expect(newsletter).toHaveAttribute('aria-invalid', 'false');
    });
  });

  test.describe('Form Submission', () => {
    test('should have submit button', async () => {
      await expect(page.submitButton).toBeVisible();
    });

    test('should handle submission attempt with invalid data', async () => {
      await page.submit();

      await page.allFormControls.first().focus();
      await page.allFormControls.first().blur();

      await Promise.any([
        (async () => {
          await expect(page.errorAlerts.first()).toBeVisible();
        })(),
        (async () => {
          await expect(page.allFormControls.first()).toHaveAttribute(
            'aria-invalid',
            'true',
          );
        })(),
      ]);
    });

    test('should reset dynamic skills back to baseline without stale touched errors', async () => {
      await expect(page.getSkillNameInput(0)).toBeVisible();

      const baselineSkillRows = await page.skillRows.count();
      expect(baselineSkillRows).toBe(1);

      await test.step('add a skill row and trigger a touched validation error', async () => {
        await page.addSkillButton.click();
        await expect(page.skillRows).toHaveCount(baselineSkillRows + 1);

        const addedSkillNameInput = page.getSkillNameInput(1);
        await addedSkillNameInput.focus();
        await addedSkillNameInput.blur();

        await expect(
          page.errorAlerts
            .filter({ hasText: /Skill name is required/i })
            .first(),
        ).toBeVisible();
      });

      await test.step('reset and verify the form returns to its initial skills state', async () => {
        await page.resetButton.click();

        await expect(page.skillRows).toHaveCount(baselineSkillRows);
        await expect(
          page.errorAlerts.filter({ hasText: /Skill name is required/i }),
        ).toHaveCount(0);
        await expect(page.getSkillNameInput(0)).not.toHaveAttribute(
          'aria-invalid',
          'true',
        );
      });
    });
  });
});
