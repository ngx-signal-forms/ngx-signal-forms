import { expect, test } from '@playwright/test';
import { verifyNoErrorsOnInitialLoad } from '../../fixtures/form-validation.fixture';
import { CustomControlsPage } from '../../page-objects/custom-controls.page';

/**
 * Tests for the current Custom Controls demo page.
 */
test.describe('Custom Signal Forms Controls', () => {
  let page: CustomControlsPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new CustomControlsPage(playwrightPage);
    await page.goto();
  });

  test('should NOT show errors on initial page load', async ({
    page: playwrightPage,
  }) => {
    await verifyNoErrorsOnInitialLoad(playwrightPage);
    await expect(page.form).toBeVisible();
  });

  test.describe('Rating Control Rendering', () => {
    test('should render the visible custom controls', async () => {
      await test.step('Verify each control is visible', async () => {
        await expect(page.productNameInput).toBeVisible();
        await expect(page.ratingControl).toBeVisible();
        await expect(page.serviceRatingControl).toBeVisible();
        await expect(page.wouldRecommendControl).toBeVisible();
        await expect(page.emailUpdatesSwitch).toBeVisible();
        await expect(page.feedbackTextarea).toBeVisible();
      });

      await test.step('Verify the star counts match each control configuration', async () => {
        await expect(page.getStars(page.ratingControl)).toHaveCount(5);
        await expect(page.getStars(page.serviceRatingControl)).toHaveCount(5);
        await expect(page.getStars(page.wouldRecommendControl)).toHaveCount(2);
      });
    });

    test('should expose the expected slider ARIA metadata', async () => {
      await test.step('Verify each rating control exposes slider semantics', async () => {
        for (const control of [
          page.ratingControl,
          page.serviceRatingControl,
          page.wouldRecommendControl,
        ]) {
          await expect(control).toHaveAttribute('role', 'slider');
          await expect(control).toHaveAttribute('aria-valuemin', '0');
          await expect(control).toHaveAttribute('aria-valuenow', '0');
        }
      });

      await test.step('Verify each control exposes the correct max value', async () => {
        await expect(page.ratingControl).toHaveAttribute('aria-valuemax', '5');
        await expect(page.serviceRatingControl).toHaveAttribute(
          'aria-valuemax',
          '5',
        );
        await expect(page.wouldRecommendControl).toHaveAttribute(
          'aria-valuemax',
          '2',
        );
      });
    });
  });

  test.describe('Rating Control Interaction', () => {
    test('should update rating value on click', async () => {
      await test.step('Click the fourth star', async () => {
        await page.selectStar(page.ratingControl, 4);
      });

      await test.step('Verify the rating state updates', async () => {
        await expect(page.ratingControl).toHaveAttribute('aria-valuenow', '4');
        expect(await page.getRatingValue(page.ratingControl)).toBe(4);
        await expect(page.getFilledStars(page.ratingControl)).toHaveCount(4);
      });
    });

    test('should support keyboard navigation', async () => {
      await test.step('Drive the rating with keyboard controls', async () => {
        await page.ratingControl.focus();

        await page.ratingControl.press('ArrowRight');
        await expect(page.ratingControl).toHaveAttribute('aria-valuenow', '1');

        await page.ratingControl.press('ArrowRight');
        await expect(page.ratingControl).toHaveAttribute('aria-valuenow', '2');

        await page.ratingControl.press('ArrowLeft');
        await expect(page.ratingControl).toHaveAttribute('aria-valuenow', '1');

        await page.ratingControl.press('End');
        await expect(page.ratingControl).toHaveAttribute('aria-valuenow', '5');

        await page.ratingControl.press('Home');
        await expect(page.ratingControl).toHaveAttribute('aria-valuenow', '0');
      });
    });

    test('should toggle the switch control with the expected accessibility label', async () => {
      await test.step('Verify the switch starts unchecked with an accessible name', async () => {
        await expect(page.emailUpdatesSwitch).not.toBeChecked();
        await expect(page.emailUpdatesSwitch).toHaveAccessibleName(
          /email updates/iu,
        );
      });

      await test.step('Toggle the switch on and off', async () => {
        await page.emailUpdatesSwitch.click();
        await expect(page.emailUpdatesSwitch).toBeChecked();

        await page.emailUpdatesSwitch.press('Space');
        await expect(page.emailUpdatesSwitch).not.toBeChecked();
      });
    });

    test('should show and clear switch errors within the form-field wrapper', async () => {
      await test.step('Touch the switch without enabling it', async () => {
        await page.emailUpdatesSwitch.focus();
        await page.emailUpdatesSwitch.blur();
      });

      await test.step('Verify the wrapper exposes the switch error state', async () => {
        const switchError = page.getErrorById('emailUpdates');
        const switchWrapper = page.getWrapperByControlId('emailUpdates');

        await expect(switchError).toBeVisible();
        await expect(switchError).toContainText(
          'Enable email updates to complete this demo',
        );
        await expect(page.emailUpdatesSwitch).toHaveAttribute(
          'aria-invalid',
          'true',
        );
        await expect(page.emailUpdatesSwitch).toHaveAttribute(
          'aria-describedby',
          /emailUpdates-error/,
        );
        await expect(switchWrapper).toHaveClass(
          /ngx-signal-form-field-wrapper--invalid/,
        );
      });

      await test.step('Verify enabling the switch clears the error', async () => {
        await page.emailUpdatesSwitch.click();

        await expect(page.emailUpdatesSwitch).toBeChecked();
        await expect(page.getErrorById('emailUpdates')).toHaveCount(0);
        await expect(page.emailUpdatesSwitch).toHaveAttribute(
          'aria-invalid',
          'false',
        );
        await expect(page.emailUpdatesSwitch).not.toHaveAttribute(
          'aria-describedby',
          /emailUpdates-error/,
        );
      });
    });
  });

  test.describe('Form Field Wrapper Integration', () => {
    test('should auto-derive fieldName from the rating control id', async () => {
      await test.step('Focus and blur the rating control to trigger validation', async () => {
        await page.ratingControl.focus();
        await page.ratingControl.blur();
      });

      await test.step('Verify the derived error id and message', async () => {
        const errorElement = page.getErrorById('rating');
        await expect(errorElement).toBeVisible();
        await expect(errorElement).toContainText('Rating');
      });
    });

    test('should link custom control errors via aria-describedby', async () => {
      await page.ratingControl.focus();
      await page.ratingControl.blur();

      await expect(page.ratingControl).toHaveAttribute(
        'aria-describedby',
        /rating-error/,
      );
    });

    test('should show aria-invalid on invalid custom controls', async () => {
      await page.ratingControl.focus();
      await page.ratingControl.blur();

      await expect(page.ratingControl).toHaveAttribute('aria-invalid', 'true');
    });

    test('should keep multiple custom control errors independent', async () => {
      await page.ratingControl.focus();
      await page.ratingControl.blur();

      await page.serviceRatingControl.focus();
      await page.serviceRatingControl.blur();

      await expect(page.getErrorById('rating')).toBeVisible();
      await expect(page.getErrorById('serviceRating')).toBeVisible();
    });
  });

  test.describe('Form Submission', () => {
    test('should validate required controls on submission', async () => {
      await page.submitButton.click();

      await expect(page.getErrorById('productName')).toBeVisible();
      await expect(page.getErrorById('rating')).toBeVisible();
      await expect(page.getErrorById('serviceRating')).toBeVisible();
      await expect(page.getErrorById('emailUpdates')).toBeVisible();
    });

    test('should submit successfully with valid custom control values', async () => {
      await page.fillValidForm();

      const errors = page.form.locator('[role="alert"]');
      await expect(errors).toHaveCount(0);

      await page.submitButton.click();

      await expect(errors).toHaveCount(0);
    });
  });

  test.describe('Outline appearance integration', () => {
    test('should apply outline styling to every wrapper when outline mode is selected', async () => {
      await page.showOutlineAppearance();
      await expect(page.outlineAppearanceButton).toHaveAttribute(
        'aria-pressed',
        'true',
      );

      for (const controlId of [
        'productName',
        'rating',
        'serviceRating',
        'wouldRecommend',
        'emailUpdates',
        'feedback',
      ]) {
        const wrapper = page.getWrapperByControlId(controlId);
        await expect(wrapper).toHaveAttribute('outline', '');
        await expect(wrapper).toHaveClass(/ngx-signal-forms-outline/);
      }
    });

    test('should keep required outline wrappers invalid after an empty submit', async () => {
      await page.showOutlineAppearance();
      await page.submitButton.click();

      for (const controlId of [
        'productName',
        'rating',
        'serviceRating',
        'emailUpdates',
      ]) {
        await expect(page.getWrapperByControlId(controlId)).toHaveClass(
          /ngx-signal-form-field-wrapper--invalid/,
        );
        await expect(page.getWrapperByControlId(controlId)).toHaveClass(
          /ngx-signal-forms-outline/,
        );
        await expect(page.getErrorById(controlId)).toBeVisible();
      }

      for (const controlId of ['wouldRecommend', 'feedback']) {
        await expect(page.getErrorById(controlId)).toHaveCount(0);
        await expect(page.getWrapperByControlId(controlId)).not.toHaveClass(
          /ngx-signal-form-field-wrapper--invalid/,
        );
      }
    });
  });

  test.describe('Mixed Native and Custom Controls', () => {
    test('should handle a mix of native inputs and custom controls', async () => {
      await page.productNameInput.fill('Test Product');
      await page.productNameInput.blur();

      await page.selectStar(page.ratingControl, 5);
      await page.feedbackTextarea.fill('Great experience!');

      await page.productNameInput.clear();
      await page.productNameInput.blur();
      await expect(page.getErrorById('productName')).toBeVisible();

      await page.ratingControl.focus();
      await page.ratingControl.press('Home');
      await page.ratingControl.blur();
      await expect(page.getErrorById('rating')).toBeVisible();
    });
  });
});
