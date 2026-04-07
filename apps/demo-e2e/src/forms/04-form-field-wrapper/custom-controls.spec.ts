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
    await expect(page.form).toBeVisible();
  });

  test.describe('Rating Control Rendering', () => {
    test('should render custom rating controls', async () => {
      await test.step('Verify rating control is visible', async () => {
        await expect(page.ratingControl).toBeVisible();
        await expect(page.serviceRatingControl).toBeVisible();
        await expect(page.wouldRecommendControl).toBeVisible();
        await expect(page.emailUpdatesSwitch).toBeVisible();
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

      await test.step('Verify switch error is shown', async () => {
        const switchError = page.getErrorById('emailUpdates');
        await expect(switchError).toBeVisible();
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

  test.describe('Outline appearance integration', () => {
    test('should apply outline appearance to native and custom wrappers', async () => {
      await test.step('Switch the demo to outline mode', async () => {
        await page.showOutlineAppearance();
        await expect(page.outlineAppearanceButton).toHaveAttribute(
          'aria-pressed',
          'true',
        );
      });

      await test.step('Verify native and custom wrappers receive outline styling hooks', async () => {
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
    });

    test('should keep invalid outline borders for native and custom required fields', async () => {
      const controlIds = ['productName', 'rating', 'serviceRating'] as const;
      const initialBorderColors = new Map<string, string>();

      await test.step('Switch to outline mode and submit the empty form', async () => {
        await page.showOutlineAppearance();

        for (const controlId of controlIds) {
          const content = page.getWrapperContentByControlId(controlId);
          initialBorderColors.set(
            controlId,
            await content.evaluate(
              (element) => window.getComputedStyle(element).borderColor,
            ),
          );
        }

        await page.submitButton.click();
      });

      await test.step('Verify native and custom invalid wrappers render the shared error border', async () => {
        for (const controlId of controlIds) {
          const wrapper = page.getWrapperByControlId(controlId);
          const content = page.getWrapperContentByControlId(controlId);
          const initialBorderColor = initialBorderColors.get(controlId);

          await expect(wrapper).toHaveClass(
            /ngx-signal-form-field-wrapper--invalid/,
          );
          expect(initialBorderColor).toBeDefined();

          await expect
            .poll(async () => {
              return content.evaluate(
                (element) => window.getComputedStyle(element).borderColor,
              );
            })
            .not.toBe(initialBorderColor);
        }
      });
    });

    test('should left-align outlined rating controls and reuse the shared outline padding', async () => {
      await test.step('Switch to outline mode', async () => {
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
        ]) {
          await expect(page.getWrapperByControlId(controlId)).toHaveClass(
            /ngx-signal-forms-outline/,
          );
        }
      });

      await test.step('Verify outlined rating wrappers reuse the text field wrapper horizontal padding', async () => {
        const productNamePadding = await page
          .getWrapperContentByControlId('productName')
          .evaluate((element) => {
            const styles = window.getComputedStyle(element);

            return {
              paddingLeft: styles.paddingLeft,
              paddingRight: styles.paddingRight,
            };
          });

        for (const controlId of ['rating', 'serviceRating', 'wouldRecommend']) {
          const padding = await page
            .getWrapperContentByControlId(controlId)
            .evaluate((element) => {
              const styles = window.getComputedStyle(element);

              return {
                paddingLeft: styles.paddingLeft,
                paddingRight: styles.paddingRight,
              };
            });

          expect(padding).toEqual(productNamePadding);
        }
      });

      await test.step('Verify outlined rating controls are left aligned inside the shared wrapper layout', async () => {
        for (const controlId of ['rating', 'serviceRating', 'wouldRecommend']) {
          const main = page.getWrapperMainByControlId(controlId);
          const control = page.form.locator(`#${controlId}`);

          const mainAlignItems = await main.evaluate(
            (element) => window.getComputedStyle(element).alignItems,
          );
          const controlAlignSelf = await control.evaluate(
            (element) => window.getComputedStyle(element).alignSelf,
          );
          const geometry = await control.evaluate((element) => {
            const controlRect = element.getBoundingClientRect();
            const parentRect = element.parentElement?.getBoundingClientRect();

            return {
              offsetFromParentLeft: parentRect
                ? Math.round(controlRect.left - parentRect.left)
                : null,
            };
          });

          expect(mainAlignItems).toBe('flex-start');
          expect(controlAlignSelf).toBe('flex-start');
          expect(geometry.offsetFromParentLeft).toBe(0);
        }
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
