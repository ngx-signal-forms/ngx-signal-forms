import { expect, test } from '@playwright/test';
import { verifyNoErrorsOnInitialLoad } from '../../fixtures/form-validation.fixture';
import { CustomControlsPage } from '../../page-objects/custom-controls.page';

/**
 * Tests for Custom Controls demo page.
 * Route: /form-field-wrapper/custom-controls
 *
 * Verifies that custom FormValueControl components (RatingControl) work
 * correctly with ngx-signal-form-field-wrapper, including:
 * - Auto-derivation of fieldName from custom control's id attribute
 * - ARIA attributes for accessibility
 * - Error display integration
 * - Keyboard navigation
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
  });

  test.describe('Rating Control Rendering', () => {
    test('should render custom rating controls', async () => {
      await test.step('Verify rating control is visible', async () => {
        await expect(page.ratingControl).toBeVisible();
        await expect(page.serviceRatingControl).toBeVisible();
        await expect(page.wouldRecommendControl).toBeVisible();
      });

      await test.step('Verify rating control has correct number of stars', async () => {
        // Product rating has 5 stars
        const productStars = page.getStars(page.ratingControl);
        await expect(productStars).toHaveCount(5);

        // Service rating has 5 stars
        const serviceStars = page.getStars(page.serviceRatingControl);
        await expect(serviceStars).toHaveCount(5);

        // Would recommend has 2 stars
        const recommendStars = page.getStars(page.wouldRecommendControl);
        await expect(recommendStars).toHaveCount(2);
      });
    });

    test('should have correct ARIA attributes on rating controls', async () => {
      await test.step('Verify role="slider" on rating control', async () => {
        await expect(page.ratingControl).toHaveAttribute('role', 'slider');
      });

      await test.step('Verify aria-valuemin and aria-valuemax', async () => {
        await expect(page.ratingControl).toHaveAttribute('aria-valuemin', '0');
        await expect(page.ratingControl).toHaveAttribute('aria-valuemax', '5');
      });

      await test.step('Verify initial aria-valuenow is 0', async () => {
        await expect(page.ratingControl).toHaveAttribute('aria-valuenow', '0');
      });
    });
  });

  test.describe('Rating Control Interaction', () => {
    test('should update rating value on click', async () => {
      await test.step('Click 4th star', async () => {
        await page.selectStar(page.ratingControl, 4);
      });

      await test.step('Verify aria-valuenow updated', async () => {
        await expect(page.ratingControl).toHaveAttribute('aria-valuenow', '4');
      });

      await test.step('Verify rating value updated', async () => {
        const value = await page.getRatingValue(page.ratingControl);
        expect(value).toBe(4);
      });

      await test.step('Verify 4 stars are filled', async () => {
        const filledStars = page.getFilledStars(page.ratingControl);
        await expect(filledStars).toHaveCount(4);
      });
    });

    test('should support keyboard navigation', async () => {
      await test.step('Focus rating control', async () => {
        await page.ratingControl.focus();
      });

      await test.step('Press ArrowRight to increase rating', async () => {
        await page.ratingControl.press('ArrowRight');
        await expect(page.ratingControl).toHaveAttribute('aria-valuenow', '1');
      });

      await test.step('Press ArrowRight again', async () => {
        await page.ratingControl.press('ArrowRight');
        await expect(page.ratingControl).toHaveAttribute('aria-valuenow', '2');
      });

      await test.step('Press ArrowLeft to decrease rating', async () => {
        await page.ratingControl.press('ArrowLeft');
        await expect(page.ratingControl).toHaveAttribute('aria-valuenow', '1');
      });

      await test.step('Press End to go to max rating', async () => {
        await page.ratingControl.press('End');
        await expect(page.ratingControl).toHaveAttribute('aria-valuenow', '5');
      });

      await test.step('Press Home to go to min rating', async () => {
        await page.ratingControl.press('Home');
        await expect(page.ratingControl).toHaveAttribute('aria-valuenow', '0');
      });
    });
  });

  test.describe('Form Field Wrapper Integration', () => {
    test('should auto-derive fieldName from custom control id', async () => {
      await test.step('Focus and blur rating control to trigger touched state', async () => {
        await page.ratingControl.focus();
        await page.ratingControl.blur();
      });

      await test.step('Verify error has correct id derived from rating control id', async () => {
        // Error should have id="rating-error" (from control id="rating")
        const errorElement = page.getErrorById('rating');
        await expect(errorElement).toBeVisible();
      });

      await test.step('Verify error contains validation message', async () => {
        const errorElement = page.getErrorById('rating');
        await expect(errorElement).toContainText('Rating');
      });
    });

    test('should link custom control to error via aria-describedby', async () => {
      await test.step('Trigger validation by touching and leaving rating empty', async () => {
        await page.ratingControl.focus();
        await page.ratingControl.blur();
      });

      await test.step('Verify aria-describedby points to error element', async () => {
        // The autoAria directive should add aria-describedby
        await expect(page.ratingControl).toHaveAttribute(
          'aria-describedby',
          /rating-error/,
        );
      });
    });

    test('should show aria-invalid on invalid custom control', async () => {
      await test.step('Touch the rating control without selecting a value', async () => {
        await page.ratingControl.focus();
        await page.ratingControl.blur();
      });

      await test.step('Verify aria-invalid is set', async () => {
        await expect(page.ratingControl).toHaveAttribute(
          'aria-invalid',
          'true',
        );
      });
    });

    test('should work for multiple custom controls independently', async () => {
      await test.step('Touch both rating controls', async () => {
        await page.ratingControl.focus();
        await page.ratingControl.blur();

        await page.serviceRatingControl.focus();
        await page.serviceRatingControl.blur();
      });

      await test.step('Verify each has its own error with correct id', async () => {
        // rating-error for first control
        const ratingError = page.getErrorById('rating');
        await expect(ratingError).toBeVisible();

        // serviceRating-error for second control
        const serviceError = page.getErrorById('serviceRating');
        await expect(serviceError).toBeVisible();
      });
    });
  });

  test.describe('Form Submission', () => {
    test('should validate custom controls on submission', async () => {
      await test.step('Submit form without filling required fields', async () => {
        await page.submitButton.click();
      });

      await test.step('Verify rating error is shown', async () => {
        const ratingError = page.getErrorById('rating');
        await expect(ratingError).toBeVisible();
      });

      await test.step('Verify product name error is shown', async () => {
        const productNameError = page.getErrorById('productName');
        await expect(productNameError).toBeVisible();
      });
    });

    test('should submit successfully with valid custom control values', async () => {
      await test.step('Fill form with valid data', async () => {
        await page.fillValidForm();
      });

      await test.step('Verify form is valid', async () => {
        // Check that no errors are visible
        const errors = page.form.locator('[role="alert"]');
        await expect(errors).toHaveCount(0);
      });

      await test.step('Submit form', async () => {
        await page.submitButton.click();
      });

      await test.step('Verify no errors after submission', async () => {
        const errors = page.form.locator('[role="alert"]');
        await expect(errors).toHaveCount(0);
      });
    });
  });

  test.describe('Mixed Native and Custom Controls', () => {
    test('should handle mix of native inputs and custom controls', async () => {
      await test.step('Fill native input', async () => {
        await page.productNameInput.fill('Test Product');
        await page.productNameInput.blur();
      });

      await test.step('Select custom rating', async () => {
        await page.selectStar(page.ratingControl, 5);
      });

      await test.step('Fill textarea', async () => {
        await page.feedbackTextarea.fill('Great experience!');
      });

      await test.step('Verify native input error id is correct', async () => {
        // Clear and blur to trigger error
        await page.productNameInput.clear();
        await page.productNameInput.blur();

        const productNameError = page.getErrorById('productName');
        await expect(productNameError).toBeVisible();
      });

      await test.step('Verify custom control maintains its error id', async () => {
        // Clear rating and blur
        await page.ratingControl.focus();
        await page.ratingControl.press('Home'); // Set to 0
        await page.ratingControl.blur();

        const ratingError = page.getErrorById('rating');
        await expect(ratingError).toBeVisible();
      });
    });
  });
});
