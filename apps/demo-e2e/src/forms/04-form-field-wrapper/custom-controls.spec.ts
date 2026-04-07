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
        await expect(page.shareReviewPubliclyCheckbox).toBeVisible();
        await expect(page.accessibilityAuditControl).toBeVisible();
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
        await expect(page.accessibilityAuditControl).toHaveAttribute(
          'role',
          'slider',
        );
      });

      await test.step('Verify aria-valuemin and aria-valuemax', async () => {
        await expect(page.ratingControl).toHaveAttribute('aria-valuemin', '0');
        await expect(page.ratingControl).toHaveAttribute('aria-valuemax', '5');
      });

      await test.step('Verify initial aria-valuenow is 0', async () => {
        await expect(page.ratingControl).toHaveAttribute('aria-valuenow', '0');
        await expect(page.accessibilityAuditControl).toHaveAttribute(
          'aria-valuenow',
          '0',
        );
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

    test('should opt a standard checkbox into toolkit checkbox ARIA and wrapper state', async () => {
      await test.step('Touch the checkbox without enabling it', async () => {
        await page.shareReviewPubliclyCheckbox.focus();
        await page.shareReviewPubliclyCheckbox.blur();
      });

      await test.step('Verify checkbox wrapper metadata and ARIA wiring', async () => {
        const checkboxError = page.getErrorById('shareReviewPublicly');
        const checkboxWrapper = page.getWrapperByControlId(
          'shareReviewPublicly',
        );

        await expect(checkboxError).toBeVisible();
        await expect(checkboxError).toContainText(
          'Please confirm that this review can be shared publicly',
        );
        await expect(page.shareReviewPubliclyCheckbox).toHaveAttribute(
          'aria-invalid',
          'true',
        );
        await expect(page.shareReviewPubliclyCheckbox).toHaveAttribute(
          'aria-describedby',
          /shareReviewPublicly-error/,
        );
        await expect(checkboxWrapper).toHaveAttribute(
          'data-ngx-signal-form-control-kind',
          'checkbox',
        );
        await expect(checkboxWrapper).toHaveAttribute(
          'data-ngx-signal-form-control-layout',
          'group',
        );
      });

      await test.step('Verify checking the checkbox clears the error', async () => {
        await page.shareReviewPubliclyCheckbox.click();

        await expect(page.shareReviewPubliclyCheckbox).toBeChecked();
        await expect(page.getErrorById('shareReviewPublicly')).toHaveCount(0);
        await expect(page.shareReviewPubliclyCheckbox).toHaveAttribute(
          'aria-invalid',
          'false',
        );
      });
    });

    test('should preserve manual ARIA ownership for the preset-driven slider example', async () => {
      await test.step('Verify the slider starts with its hint-only described-by chain', async () => {
        const sliderWrapper = page.getWrapperByControlId('accessibilityAudit');

        await expect(page.accessibilityAuditControl).toHaveAttribute(
          'aria-describedby',
          'accessibilityAudit-hint',
        );
        await expect(page.accessibilityAuditControl).toHaveAttribute(
          'aria-required',
          'true',
        );
        await expect(sliderWrapper).toHaveAttribute(
          'data-ngx-signal-form-control-kind',
          'slider',
        );
        await expect(sliderWrapper).toHaveAttribute(
          'data-ngx-signal-form-control-layout',
          'custom',
        );
        await expect(sliderWrapper).toHaveAttribute(
          'data-ngx-signal-form-control-aria-mode',
          'manual',
        );
      });

      await test.step('Touch the slider without selecting a rating', async () => {
        await page.accessibilityAuditControl.focus();
        await page.accessibilityAuditControl.blur();
      });

      await test.step('Verify the control keeps its own described-by chain when the wrapper error appears', async () => {
        const sliderError = page.getErrorById('accessibilityAudit');

        await expect(sliderError).toBeVisible();
        await expect(sliderError).toContainText(
          'Accessibility audit must be at least 1 star',
        );
        await expect(page.accessibilityAuditControl).toHaveAttribute(
          'aria-describedby',
          'accessibilityAudit-hint accessibilityAudit-error',
        );
        await expect(page.accessibilityAuditControl).toHaveAttribute(
          'aria-invalid',
          'true',
        );
      });

      await test.step('Verify selecting a rating restores the hint-only described-by chain', async () => {
        await page.selectStar(page.accessibilityAuditControl, 4);

        await expect(page.getErrorById('accessibilityAudit')).toHaveCount(0);
        await expect(page.accessibilityAuditControl).toHaveAttribute(
          'aria-describedby',
          'accessibilityAudit-hint',
        );
        await expect(page.accessibilityAuditControl).toHaveAttribute(
          'aria-invalid',
          'false',
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

      await test.step('Verify checkbox opt-in error is shown', async () => {
        const checkboxError = page.getErrorById('shareReviewPublicly');
        await expect(checkboxError).toBeVisible();
      });

      await test.step('Verify manual slider error is shown', async () => {
        const sliderError = page.getErrorById('accessibilityAudit');
        await expect(sliderError).toBeVisible();
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
    test('should apply outline only to text-like wrappers while custom plain and selection rows keep their own layouts', async () => {
      await test.step('Switch the demo to outline mode', async () => {
        await page.showOutlineAppearance();
        await expect(page.outlineAppearanceButton).toHaveAttribute(
          'aria-pressed',
          'true',
        );
      });

      await test.step('Verify native text-like wrappers receive outline styling hooks', async () => {
        for (const controlId of ['productName', 'feedback']) {
          const wrapper = page.getWrapperByControlId(controlId);
          await expect(wrapper).toHaveAttribute('outline', '');
          await expect(wrapper).toHaveClass(/ngx-signal-forms-outline/);
        }
      });

      await test.step('Verify custom rating and slider wrappers stay plain even when the demo toggles to outline mode', async () => {
        for (const controlId of [
          'rating',
          'serviceRating',
          'wouldRecommend',
          'accessibilityAudit',
        ]) {
          const wrapper = page.getWrapperByControlId(controlId);
          await expect(wrapper).not.toHaveAttribute('outline', '');
          await expect(wrapper).toHaveClass(/ngx-signal-forms-plain/);
          await expect(wrapper).not.toHaveClass(/ngx-signal-forms-outline/);
        }
      });

      await test.step('Verify switch and checkbox rows keep their semantic layouts without text-field outline chrome', async () => {
        for (const controlId of ['emailUpdates', 'shareReviewPublicly']) {
          const wrapper = page.getWrapperByControlId(controlId);
          await expect(wrapper).not.toHaveAttribute('outline', '');
          await expect(wrapper).not.toHaveClass(/ngx-signal-forms-outline/);
        }

        await expect(
          page.getWrapperByControlId('emailUpdates'),
        ).toHaveAttribute(
          'data-ngx-signal-form-control-layout',
          'inline-control',
        );
        await expect(
          page.getWrapperByControlId('shareReviewPublicly'),
        ).toHaveAttribute('data-ngx-signal-form-control-layout', 'group');
      });
    });

    test('should keep invalid outline borders only for outlined text-like required fields', async () => {
      const outlinedControlIds = ['productName'] as const;
      const plainControlIds = ['rating', 'serviceRating'] as const;
      const rowControlIds = ['emailUpdates', 'shareReviewPublicly'] as const;
      const initialBorderColors = new Map<string, string>();

      await test.step('Switch to outline mode and submit the empty form', async () => {
        await page.showOutlineAppearance();

        for (const controlId of [
          ...outlinedControlIds,
          ...plainControlIds,
          ...rowControlIds,
        ]) {
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

      await test.step('Verify outlined native wrappers render the shared error border', async () => {
        for (const controlId of outlinedControlIds) {
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

      await test.step('Verify plain custom wrappers still report invalid state without outline chrome', async () => {
        for (const controlId of plainControlIds) {
          const wrapper = page.getWrapperByControlId(controlId);
          const initialBorderColor = initialBorderColors.get(controlId);
          const content = page.getWrapperContentByControlId(controlId);

          await expect(wrapper).toHaveClass(
            /ngx-signal-form-field-wrapper--invalid/,
          );
          await expect(wrapper).toHaveClass(/ngx-signal-forms-plain/);
          await expect(wrapper).not.toHaveClass(/ngx-signal-forms-outline/);
          expect(initialBorderColor).toBeDefined();

          await expect
            .poll(async () => {
              return content.evaluate(
                (element) => window.getComputedStyle(element).borderColor,
              );
            })
            .toBe(initialBorderColor);
        }
      });

      await test.step('Verify row-based controls stay non-outlined even when invalid', async () => {
        for (const controlId of rowControlIds) {
          const wrapper = page.getWrapperByControlId(controlId);
          const content = page.getWrapperContentByControlId(controlId);
          const initialBorderColor = initialBorderColors.get(controlId);

          await expect(wrapper).toHaveClass(
            /ngx-signal-form-field-wrapper--invalid/,
          );
          await expect(wrapper).not.toHaveClass(/ngx-signal-forms-outline/);
          await expect(wrapper).not.toHaveAttribute('outline', '');
          expect(initialBorderColor).toBeDefined();

          await expect
            .poll(async () => {
              return content.evaluate(
                (element) => window.getComputedStyle(element).borderColor,
              );
            })
            .toBe(initialBorderColor);
        }
      });
    });

    test('should keep plain rating controls aligned with shared wrapper padding when the page switches to outline mode', async () => {
      await test.step('Switch to outline mode', async () => {
        await page.showOutlineAppearance();
        await expect(page.outlineAppearanceButton).toHaveAttribute(
          'aria-pressed',
          'true',
        );

        await expect(page.getWrapperByControlId('productName')).toHaveClass(
          /ngx-signal-forms-outline/,
        );

        for (const controlId of ['rating', 'serviceRating', 'wouldRecommend']) {
          await expect(page.getWrapperByControlId(controlId)).toHaveClass(
            /ngx-signal-forms-plain/,
          );
          await expect(page.getWrapperByControlId(controlId)).not.toHaveClass(
            /ngx-signal-forms-outline/,
          );
        }
      });

      await test.step('Verify plain rating wrappers keep the shared horizontal padding', async () => {
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

      await test.step('Verify plain rating controls stay flush-left inside their wrapper layout', async () => {
        for (const controlId of ['rating', 'serviceRating', 'wouldRecommend']) {
          const control = page.form.locator(`#${controlId}`);

          const geometry = await control.evaluate((element) => {
            const controlRect = element.getBoundingClientRect();
            const parentRect = element.parentElement?.getBoundingClientRect();

            return {
              offsetFromParentLeft: parentRect
                ? Math.round(controlRect.left - parentRect.left)
                : null,
            };
          });

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
