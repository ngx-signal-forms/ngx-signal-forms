import { expect, test } from '@playwright/test';

import { ROLE_ALERT_SELECTOR } from '../../fixtures/aria-selectors';
import { FormFieldWrapperComplexPage } from '../../page-objects/form-field-wrapper-complex.page';

const contactMethodFieldsetTopAriaSnapshot = `
- radiogroup "Preferred contact method *":
  - text: Preferred contact method *
  - alert:
    - paragraph: Preferred contact method is required
  - radio "Email"
  - text: Email
  - radio "SMS"
  - text: SMS
  - radio "Phone"
  - text: Phone
`;

const contactMethodFieldsetBottomAriaSnapshot = `
- radiogroup "Preferred contact method *":
  - text: Preferred contact method *
  - radio "Email"
  - text: Email
  - radio "SMS"
  - text: SMS
  - radio "Phone"
  - text: Phone
  - alert:
    - paragraph: Preferred contact method is required
`;

function requireValue<T>(value: T | null, label: string): T {
  if (value === null) {
    throw new Error(`Expected ${label} to be available.`);
  }

  return value;
}

function getMessagePlacement(
  fieldset: ReturnType<FormFieldWrapperComplexPage['getFieldsetByLegend']>,
): Promise<'top' | 'bottom' | 'missing'> {
  return fieldset.evaluate((host) => {
    const layoutRoot =
      host.querySelector('.ngx-signal-form-fieldset__surface') ?? host;
    const messageContainer = host.querySelector(
      '.ngx-signal-form-fieldset__messages, .ngx-signal-form-field-wrapper__messages, .ngx-signal-form-field-wrapper__assistive',
    );
    const contentContainer = layoutRoot.querySelector(
      '.ngx-signal-form-fieldset__content, .ngx-signal-form-field-wrapper__content',
    );
    const children = Array.from(layoutRoot.children);
    const contentIndex = children.findIndex(
      (child) => child === contentContainer,
    );
    const messageIndex = children.findIndex(
      (child) => child === messageContainer,
    );

    if (contentIndex === -1 || messageIndex === -1) {
      return 'missing';
    }

    return messageIndex < contentIndex ? 'top' : 'bottom';
  });
}

function getGroupedFieldsets(page: FormFieldWrapperComplexPage) {
  return [
    page.personalInfoFieldset,
    page.addressInfoFieldset,
    page.skillsFieldset,
    page.contactsFieldset,
    page.credentialsFieldset,
    page.preferencesFieldset,
  ];
}

async function triggerContactMethodFieldsetError(
  page: FormFieldWrapperComplexPage,
): Promise<void> {
  await page.preferencesContactRadios.first().focus();
  await page.preferencesContactRadios.first().blur();
  await expect(page.contactMethodFieldsetError).toBeVisible();
}

async function triggerCredentialsFieldsetError(
  page: FormFieldWrapperComplexPage,
): Promise<void> {
  await page.credentialsPasswordInput.fill('short');
  await page.credentialsConfirmPasswordInput.fill('different1');
  await page.credentialsConfirmPasswordInput.focus();
  await page.credentialsConfirmPasswordInput.blur();
  await expect(page.credentialsFieldsetError).toBeVisible();
}

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
    await expect(page.form.locator(ROLE_ALERT_SELECTOR)).toHaveCount(0);
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
      await expect(page.credentialsFieldset).toBeVisible();
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

    test('should use a neutral projected heading to label the contact-method radiogroup', async () => {
      await expect(page.contactMethodGroupLabel).toBeVisible();
      await expect(page.contactMethodGroupLabel).toContainText(
        'Preferred contact method *',
      );
      await expect(page.contactMethodGroupLabel).toHaveAttribute(
        'id',
        'contact-method-label',
      );

      const headingSemantics = await page.contactMethodGroupLabel.evaluate(
        (element) => ({
          tagName: element.tagName,
          forAttribute: element.getAttribute('for'),
        }),
      );

      expect(headingSemantics.tagName).toBe('SPAN');
      expect(headingSemantics.forAttribute).toBeNull();
      await expect(page.contactMethodGroup).toHaveAttribute(
        'aria-labelledby',
        'contact-method-label',
      );
    });

    test('should keep grouped fieldset summaries at the bottom by default', async () => {
      await expect(page.bottomFieldsetSummaryButton).toHaveAttribute(
        'aria-pressed',
        'true',
      );

      for (const fieldset of getGroupedFieldsets(page)) {
        await expect(fieldset).toHaveAttribute(
          'data-error-placement',
          'bottom',
        );
      }

      await expect(page.contactMethodGroup).toHaveAttribute(
        'data-error-placement',
        'bottom',
      );

      await triggerContactMethodFieldsetError(page);
      expect(await getMessagePlacement(page.contactMethodGroup)).toBe('bottom');
    });

    test('should let the demo move grouped fieldset summaries to the top', async () => {
      await expect(page.bottomFieldsetSummaryButton).toHaveAttribute(
        'aria-pressed',
        'true',
      );

      await page.showTopFieldsetSummaryPlacement();

      await expect(page.topFieldsetSummaryButton).toHaveAttribute(
        'aria-pressed',
        'true',
      );

      for (const fieldset of getGroupedFieldsets(page)) {
        await expect(fieldset).toHaveAttribute('data-error-placement', 'top');
      }

      await expect(page.contactMethodGroup).toHaveAttribute(
        'data-error-placement',
        'top',
      );

      await triggerContactMethodFieldsetError(page);
      expect(await getMessagePlacement(page.contactMethodGroup)).toBe('top');
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

    test('should surface password mismatch at the credentials fieldset level', async () => {
      await page.credentialsPasswordInput.fill('abc12345');
      await page.credentialsConfirmPasswordInput.fill('different1');

      await page.credentialsConfirmPasswordInput.focus();
      await page.credentialsConfirmPasswordInput.blur();

      await expect(
        page.getFieldsetErrorsByLegend(/Account Credentials/i).first(),
      ).toContainText('Passwords must match');
    });

    test('should use the wrapper selection-group error surface recipe from the design system', async () => {
      await triggerContactMethodFieldsetError(page);

      const surface = page.contactMethodGroup.locator(
        '.ngx-signal-form-field-wrapper__content',
      );
      const heading = page.contactMethodGroup.locator(
        '.choice-group-field__label',
      );
      const options = page.contactMethodGroup.locator(
        '.choice-group-field__options',
      );
      const messages = page.contactMethodGroup.locator(
        '.ngx-signal-form-field-wrapper__assistive',
      );
      const alert = page.contactMethodGroup.getByRole('alert');
      const firstOption = page.contactMethodGroup
        .locator('.choice-group-field__option')
        .first();

      await expect(surface).toBeVisible();
      await expect(heading).toBeVisible();
      await expect(options).toBeVisible();
      await expect(messages).toBeVisible();
      await expect(alert).toBeVisible();
      await expect(firstOption).toBeVisible();
      await expect(surface).toHaveCSS('background-color', 'rgb(251, 221, 221)');

      const [
        surfaceStyles,
        legendStyles,
        optionsGap,
        optionMinHeight,
        alertStyles,
      ] = await Promise.all([
        surface.evaluate((element) => ({
          surfaceBg: getComputedStyle(element).backgroundColor,
          surfacePadding: getComputedStyle(element).padding,
          surfaceBorderWidth: getComputedStyle(element).borderTopWidth,
          surfaceRadius: getComputedStyle(element).borderTopLeftRadius,
        })),
        heading.evaluate((element) => ({
          headingColor: getComputedStyle(element).color,
          headingFontSize: getComputedStyle(element).fontSize,
          headingFontWeight: getComputedStyle(element).fontWeight,
        })),
        options.evaluate((element) => getComputedStyle(element).gap),
        firstOption.evaluate((element) => getComputedStyle(element).minHeight),
        alert.evaluate((element) => ({
          alertColor: getComputedStyle(element).color,
          alertFontSize: getComputedStyle(element).fontSize,
          alertLineHeight: getComputedStyle(element).lineHeight,
        })),
      ]);

      const selectionRecipe = {
        ...surfaceStyles,
        ...legendStyles,
        optionsGap,
        optionMinHeight,
        ...alertStyles,
      };

      expect(selectionRecipe.surfaceBg).toBe('rgb(251, 221, 221)');
      expect(selectionRecipe.surfacePadding).toBe('12px');
      expect(selectionRecipe.surfaceBorderWidth).toBe('0px');
      expect(selectionRecipe.surfaceRadius).toBe('4px');
      expect(selectionRecipe.headingColor).toBe('rgb(50, 65, 85)');
      expect(selectionRecipe.headingFontSize).toBe('14px');
      expect(selectionRecipe.headingFontWeight).toBe('500');
      expect(selectionRecipe.optionsGap).toBe('8px');
      expect(selectionRecipe.optionMinHeight).toBe('32px');
      expect(selectionRecipe.alertColor).toBe('rgb(219, 24, 24)');
      expect(selectionRecipe.alertFontSize).toBe('12px');
      expect(selectionRecipe.alertLineHeight).toBe('16px');
    });

    test('should use the same error message typography for notifications and inline errors', async () => {
      await triggerCredentialsFieldsetError(page);

      const [notificationMessageStyles, inlineErrorStyles] = await Promise.all([
        page.credentialsFieldset
          .locator('.ngx-form-field-notification__message')
          .first()
          .evaluate((message) => {
            const style = getComputedStyle(message);
            return {
              fontSize: style.fontSize,
              lineHeight: style.lineHeight,
            };
          }),
        page.form
          .locator('#credentialsPassword-error .ngx-form-field-error__message')
          .first()
          .evaluate((message) => {
            const style = getComputedStyle(message);
            return {
              fontSize: style.fontSize,
              lineHeight: style.lineHeight,
            };
          }),
      ]);

      expect(notificationMessageStyles).toEqual(inlineErrorStyles);
    });

    test('should render the credentials grouped summary as an aligned bulleted list', async () => {
      await triggerCredentialsFieldsetError(page);

      await expect(page.credentialsFieldsetErrorList).toBeVisible();
      await expect(page.credentialsFieldsetErrorList.locator('li')).toHaveCount(
        1,
      );

      const messageSlot = page.credentialsFieldset.locator(
        '.ngx-signal-form-fieldset__messages',
      );
      const notificationCard = page.credentialsFieldset.locator(
        'ngx-form-field-notification .ngx-form-field-notification:not(.ngx-form-field-notification--empty)',
      );

      const recipe = await page.credentialsFieldset.evaluate((host) => {
        const style = getComputedStyle(host);

        return {
          contentOffset: style
            .getPropertyValue('--ngx-signal-form-fieldset-content-offset')
            .trim(),
          insetInlineStart: style
            .getPropertyValue(
              '--ngx-signal-form-fieldset-message-inset-inline-start',
            )
            .trim(),
          listStyle: style
            .getPropertyValue(
              '--ngx-signal-form-fieldset-notification-list-style',
            )
            .trim(),
        };
      });

      expect(recipe.contentOffset).toBe('0');
      expect(recipe.insetInlineStart).toBe('0.875rem');
      expect(recipe.listStyle).toBe('disc outside');

      const [messageSlotBox, notificationCardBox] = await Promise.all([
        messageSlot.boundingBox(),
        notificationCard.boundingBox(),
      ]);

      const alignedMessageSlotBox = requireValue(
        messageSlotBox,
        'credentials notification slot bounding box',
      );
      const alignedNotificationCardBox = requireValue(
        notificationCardBox,
        'credentials notification card bounding box',
      );

      expect(
        Math.abs(alignedNotificationCardBox.x - alignedMessageSlotBox.x),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(
          alignedNotificationCardBox.width - alignedMessageSlotBox.width,
        ),
      ).toBeLessThanOrEqual(1);

      const listStyle = await page.credentialsFieldsetErrorList.evaluate(
        (list) => {
          const style = getComputedStyle(list);

          return {
            listStylePosition: style.listStylePosition,
            listStyleType: style.listStyleType,
            paddingInlineStart: style.paddingInlineStart,
          };
        },
      );

      expect(listStyle.listStyleType).toBe('disc');
      expect(listStyle.listStylePosition).toBe('outside');
      expect(Number.parseFloat(listStyle.paddingInlineStart)).toBeGreaterThan(
        0,
      );
    });

    test('should preserve the contact-method accessibility tree for top and bottom placement', async () => {
      await triggerContactMethodFieldsetError(page);
      await expect(page.contactMethodGroup).toMatchAriaSnapshot(
        contactMethodFieldsetBottomAriaSnapshot,
      );

      await page.showTopFieldsetSummaryPlacement();
      await triggerContactMethodFieldsetError(page);
      await expect(page.contactMethodGroup).toMatchAriaSnapshot(
        contactMethodFieldsetTopAriaSnapshot,
      );
    });

    test('should expose the custom-element personal-info fieldset as an a11y group with a labelled region', async () => {
      await page.submit();

      // The `group` accessible name comes from the projected <legend> via
      // `aria-labelledby`, which is what makes the custom-element fieldset
      // navigable as a landmark for AT. The inner `text:` lines below include
      // the legend because it is also rendered visually inside the host —
      // they are labels for sibling controls, not the group's own name.
      await expect(page.personalInfoFieldset).toMatchAriaSnapshot(`
        - group "👤 Personal Information":
          - text: 👤 Personal Information First Name *
          - textbox "First Name *"
          - alert:
            - paragraph: First name is required
          - text: Last Name *
          - textbox "Last Name *"
          - alert:
            - paragraph: Last name is required
          - text: Email *
          - textbox "Email *"
          - alert:
            - paragraph: Email is required
          - text: Age *
          - spinbutton "Age *": "0"
          - alert:
            - paragraph: Must be 18 or older
      `);
    });

    test('snapshot: contact-method grouped error with top placement', async () => {
      await page.showTopFieldsetSummaryPlacement();
      await triggerContactMethodFieldsetError(page);
      await page.contactMethodGroup.scrollIntoViewIfNeeded();

      await expect(page.contactMethodGroup).toHaveScreenshot(
        'complex-forms-contact-method-error-top.png',
      );
    });

    test('snapshot: contact-method grouped error with bottom placement', async () => {
      await page.showBottomFieldsetSummaryPlacement();
      await triggerContactMethodFieldsetError(page);
      await page.contactMethodGroup.scrollIntoViewIfNeeded();

      await expect(page.contactMethodGroup).toHaveScreenshot(
        'complex-forms-contact-method-error-bottom.png',
      );
    });

    test('snapshot: credentials grouped error uses bullets and reduced gap', async () => {
      await page.showTopFieldsetSummaryPlacement();
      await triggerCredentialsFieldsetError(page);
      await page.credentialsFieldset.scrollIntoViewIfNeeded();

      await expect(page.credentialsFieldset).toHaveScreenshot(
        'complex-forms-credentials-grouped-error-bullets.png',
      );
    });

    test('snapshot: credentials grouped error with top placement', async () => {
      await page.showTopFieldsetSummaryPlacement();
      await triggerCredentialsFieldsetError(page);
      await page.credentialsFieldset.scrollIntoViewIfNeeded();

      await expect(page.credentialsFieldset).toHaveScreenshot(
        'complex-forms-credentials-error-top.png',
      );
    });

    test('snapshot: credentials grouped error with bottom placement', async () => {
      await page.showBottomFieldsetSummaryPlacement();
      await triggerCredentialsFieldsetError(page);
      await page.credentialsFieldset.scrollIntoViewIfNeeded();

      await expect(page.credentialsFieldset).toHaveScreenshot(
        'complex-forms-credentials-error-bottom.png',
      );
    });
  });

  test.describe('Horizontal orientation integration', () => {
    test('should apply horizontal orientation to nested field wrappers while leaving selection rows vertical', async () => {
      await test.step('Switch the demo to horizontal orientation', async () => {
        await page.showStandardAppearance();
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
        await page.showStandardAppearance();
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

    test('should render personal and address rows as single-column in standard horizontal mode', async () => {
      await test.step('Show the standard horizontal nested layout', async () => {
        await page.showStandardAppearance();
        await page.showHorizontalOrientation();
      });

      await test.step('Verify Personal Information wrappers are stacked vertically', async () => {
        const firstNameWrapper = page.getWrapperByControlId('firstName');
        const lastNameWrapper = page.getWrapperByControlId('lastName');

        await expect(firstNameWrapper).toBeVisible();
        await expect(lastNameWrapper).toBeVisible();

        const firstNameBox = await firstNameWrapper.boundingBox();
        const lastNameBox = await lastNameWrapper.boundingBox();

        expect(firstNameBox).not.toBeNull();
        expect(lastNameBox).not.toBeNull();

        const firstNameRect = requireValue(
          firstNameBox,
          'first name wrapper bounding box',
        );
        const lastNameRect = requireValue(
          lastNameBox,
          'last name wrapper bounding box',
        );

        expect(Math.abs(firstNameRect.x - lastNameRect.x)).toBeLessThan(2);
        expect(lastNameRect.y).toBeGreaterThan(firstNameRect.y);
      });

      await test.step('Verify Address city/zip wrappers are stacked vertically', async () => {
        const cityWrapper = page.getWrapperByControlId('city');
        const zipWrapper = page.getWrapperByControlId('zipCode');

        await expect(cityWrapper).toBeVisible();
        await expect(zipWrapper).toBeVisible();

        const cityBox = await cityWrapper.boundingBox();
        const zipBox = await zipWrapper.boundingBox();

        expect(cityBox).not.toBeNull();
        expect(zipBox).not.toBeNull();

        const cityRect = requireValue(cityBox, 'city wrapper bounding box');
        const zipRect = requireValue(zipBox, 'zip wrapper bounding box');

        expect(Math.abs(cityRect.x - zipRect.x)).toBeLessThan(2);
        expect(zipRect.y).toBeGreaterThan(cityRect.y);
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

      await expect(page.contactMethodFieldsetError).toBeVisible();
    });

    test('should keep error colors readable in explicit light mode even when the browser prefers dark', async ({
      page: playwrightPage,
    }) => {
      await playwrightPage.emulateMedia({ colorScheme: 'dark' });
      await playwrightPage.evaluate(() => {
        localStorage.setItem('color-theme', 'light');
      });

      await page.goto();
      await page.submit();

      const firstError = page.errorAlerts.first();
      const groupedError = page.contactMethodFieldsetError;

      await expect(firstError).toBeVisible();
      await expect(groupedError).toBeVisible();
      await expect(playwrightPage.locator('html')).not.toHaveClass(/dark/);
      await expect(firstError).toHaveCSS('color', 'rgb(219, 24, 24)');
      await expect(groupedError).toHaveCSS('color', 'rgb(219, 24, 24)');
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
        'ngx-form-field-wrapper',
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

    test('should preserve the remaining skill value after removing the first repeated row', async () => {
      await expect(page.getSkillNameInput(0)).toBeVisible();

      await test.step('create two distinct skill rows', async () => {
        await page.getSkillNameInput(0).fill('Angular');
        await page.addSkillButton.click();
        await expect(page.skillRows).toHaveCount(2);

        await page.getSkillNameInput(1).fill('TypeScript');
      });

      await test.step('remove the first row', async () => {
        await page.page.getByRole('button', { name: 'Remove skill 1' }).click();
      });

      await test.step('verify the remaining row keeps the second field value', async () => {
        await expect(page.skillRows).toHaveCount(1);
        await expect(page.getSkillNameInput(0)).toHaveValue('TypeScript');
      });
    });
  });
});
