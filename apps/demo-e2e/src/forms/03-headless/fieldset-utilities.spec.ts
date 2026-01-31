import { expect, test } from '@playwright/test';

/**
 * Headless Fieldset + Utilities - E2E Tests
 * Route: /headless/fieldset-utilities
 *
 * Tests NgxHeadlessFieldsetDirective, NgxHeadlessFieldNameDirective,
 * createErrorState(), and createCharacterCount() utilities.
 */
test.describe('Headless - Fieldset + Utilities', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/headless/fieldset-utilities`);
    await expect(page.locator('form').first()).toBeVisible();
    await expect(page.getByLabel('Contact email *')).toBeVisible();
  });

  test.describe('Component Structure', () => {
    test('should render all form sections', async ({ page }) => {
      await test.step('Verify contact email section', async () => {
        await expect(page.getByLabel('Contact email *')).toBeVisible();
      });

      await test.step('Verify shipping address fieldset', async () => {
        await expect(
          page.getByRole('group', { name: 'Shipping address' }),
        ).toBeVisible();
        await expect(page.getByLabel('Street *')).toBeVisible();
        await expect(page.getByLabel('City *')).toBeVisible();
        await expect(page.getByLabel('Postal code *')).toBeVisible();
      });

      await test.step('Verify delivery notes section with utilities', async () => {
        await expect(page.getByLabel('Notes')).toBeVisible();
        await expect(page.getByText(/0\s*\/\s*200/)).toBeVisible();
      });

      await test.step('Verify action buttons', async () => {
        await expect(
          page.getByRole('button', { name: 'Submit request' }),
        ).toBeVisible();
        await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
      });
    });

    test('should display fieldset state indicators', async ({ page }) => {
      const fieldset = page.getByRole('group', { name: 'Shipping address' });
      await expect(fieldset.getByText('touched:')).toBeVisible();
      await expect(fieldset.getByText('dirty:')).toBeVisible();
      await expect(fieldset.getByText('invalid:')).toBeVisible();
      await expect(fieldset.getByText('pending:')).toBeVisible();
    });
  });

  test.describe('Contact Email - FieldName + ErrorState', () => {
    test('should show error after blur on empty email', async ({ page }) => {
      const emailInput = page.getByLabel('Contact email *');

      await test.step('Focus and blur email field', async () => {
        await emailInput.focus();
        await emailInput.blur();
      });

      await test.step('Verify error is shown', async () => {
        await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        const alert = page
          .locator('[role="alert"]')
          .filter({ hasText: 'Email is required' });
        await expect(alert).toBeVisible();
      });
    });

    test('should show error for invalid email format', async ({ page }) => {
      const emailInput = page.getByLabel('Contact email *');

      await test.step('Enter invalid email', async () => {
        await emailInput.fill('not-an-email');
        await emailInput.blur();
      });

      await test.step('Verify format error', async () => {
        await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        const alert = page
          .locator('[role="alert"]')
          .filter({ hasText: 'Enter a valid email address' });
        await expect(alert).toBeVisible();
      });
    });

    test('should clear error with valid email', async ({ page }) => {
      const emailInput = page.getByLabel('Contact email *');

      await test.step('Trigger error first', async () => {
        await emailInput.focus();
        await emailInput.blur();
        await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });

      await test.step('Enter valid email', async () => {
        await emailInput.fill('test@example.com');
        await emailInput.blur();
      });

      await test.step('Verify error is cleared', async () => {
        await expect(emailInput).not.toHaveAttribute('aria-invalid', 'true');
        await expect(
          page.locator('[role="alert"]').filter({ hasText: 'Email' }),
        ).toBeHidden();
      });
    });
  });

  test.describe('Shipping Address - Fieldset Directive', () => {
    test('should show aggregated errors for fieldset on submit', async ({
      page,
    }) => {
      await test.step('Submit empty form', async () => {
        await page.getByRole('button', { name: 'Submit request' }).click();
      });

      await test.step('Verify aggregated errors in fieldset', async () => {
        const fieldset = page.getByRole('group', { name: 'Shipping address' });
        const aggregatedAlert = fieldset.locator('[role="alert"]').first();
        await expect(aggregatedAlert).toBeVisible();
        await expect(aggregatedAlert).toContainText('Street is required');
        await expect(aggregatedAlert).toContainText('City is required');
        await expect(aggregatedAlert).toContainText('Postal code is required');
      });
    });

    test('should update fieldset state indicators when interacting', async ({
      page,
    }) => {
      const fieldset = page.getByRole('group', { name: 'Shipping address' });
      const streetInput = page.getByLabel('Street *');

      await test.step('Initial state: not touched', async () => {
        await expect(fieldset.getByText('touched: false')).toBeVisible();
        await expect(fieldset.getByText('dirty: false')).toBeVisible();
      });

      await test.step('Touch field', async () => {
        await streetInput.focus();
        await streetInput.blur();
        await expect(fieldset.getByText('touched: true')).toBeVisible();
      });

      await test.step('Make field dirty', async () => {
        await streetInput.fill('Main');
        await expect(fieldset.getByText('dirty: true')).toBeVisible();
      });
    });

    test('should show individual field errors for minLength', async ({
      page,
    }) => {
      const streetInput = page.getByLabel('Street *');

      await test.step('Fill other required fields first', async () => {
        await page.getByLabel('City *').fill('Springfield');
        await page.getByLabel('Postal code *').fill('12345');
      });

      await test.step('Enter too short street', async () => {
        await streetInput.fill('AB');
        await streetInput.blur();
      });

      await test.step('Verify field-level error', async () => {
        await expect(streetInput).toHaveAttribute('aria-invalid', 'true');
        // Get the error directly associated with the street field via aria-describedby
        const describedBy = await streetInput.getAttribute('aria-describedby');
        const errorElement = page.locator(`#${describedBy}`);
        await expect(errorElement).toContainText(
          'Street must be at least 3 characters',
        );
      });
    });

    test('should show postal code warning for format', async ({ page }) => {
      const postalInput = page.getByLabel('Postal code *');

      await test.step('Enter valid but non-standard postal code', async () => {
        await postalInput.fill('1234');
        await postalInput.blur();
      });

      await test.step('Verify warning is shown (not error)', async () => {
        // First, we should see minLength error since it requires 5+ chars
        await expect(postalInput).toHaveAttribute('aria-invalid', 'true');
      });

      await test.step('Enter 5+ chars with non-ZIP format', async () => {
        await postalInput.fill('ABCDE');
        await postalInput.blur();
      });

      await test.step('Verify format warning', async () => {
        const warning = page.locator('[role="status"]').filter({
          hasText: 'Consider the 5-digit ZIP format',
        });
        await expect(warning).toBeVisible();
      });
    });

    test('should clear errors when fields are valid', async ({ page }) => {
      const fieldset = page.getByRole('group', { name: 'Shipping address' });

      await test.step('Submit to trigger errors', async () => {
        await page.getByRole('button', { name: 'Submit request' }).click();
        await expect(fieldset.locator('[role="alert"]').first()).toBeVisible();
      });

      await test.step('Fill all address fields', async () => {
        await page.getByLabel('Street *').fill('123 Main St');
        await page.getByLabel('City *').fill('Springfield');
        await page.getByLabel('Postal code *').fill('12345');
      });

      await test.step('Verify aggregated errors cleared', async () => {
        await expect(fieldset.locator('[role="alert"]').first()).toBeHidden();
      });
    });
  });

  test.describe('Delivery Notes - Utility Functions', () => {
    test('should update character count while typing', async ({ page }) => {
      const notesInput = page.getByLabel('Notes');

      await test.step('Initial count shows 0/200', async () => {
        await expect(page.getByText(/0\s*\/\s*200/)).toBeVisible();
        await expect(page.getByText('200 remaining')).toBeVisible();
      });

      await test.step('Type some text', async () => {
        await notesInput.fill('Hello world');
        await expect(page.getByText(/11\s*\/\s*200/)).toBeVisible();
        await expect(page.getByText('189 remaining')).toBeVisible();
      });
    });

    test('should show short notes warning', async ({ page }) => {
      const notesInput = page.getByLabel('Notes');

      await test.step('Enter short notes (< 20 chars)', async () => {
        await notesInput.fill('Short');
        await notesInput.blur();
      });

      await test.step('Verify warning is shown', async () => {
        const warning = page.locator('[role="status"]').filter({
          hasText: 'Consider adding more detail',
        });
        await expect(warning).toBeVisible();
      });

      await test.step('Clear warning with 20+ chars', async () => {
        await notesInput.fill('This is a longer note with more detail');
        await notesInput.blur();
        await expect(
          page.locator('[role="status"]').filter({
            hasText: 'Consider adding more detail',
          }),
        ).toBeHidden();
      });
    });

    test('should show character count at limit', async ({ page }) => {
      const notesInput = page.getByLabel('Notes');
      const maxText = 'x'.repeat(200);

      await test.step('Fill to exactly 200 characters', async () => {
        await notesInput.fill(maxText);
      });

      await test.step('Verify counter shows limit reached', async () => {
        await expect(page.getByText(/200\s*\/\s*200/)).toBeVisible();
        await expect(page.getByText('0 remaining')).toBeVisible();
      });
    });
  });

  test.describe('Form Submission', () => {
    test('should validate all fields on submit', async ({ page }) => {
      await test.step('Submit empty form', async () => {
        await page.getByRole('button', { name: 'Submit request' }).click();
      });

      await test.step('Verify all required errors shown', async () => {
        await expect(
          page
            .locator('[role="alert"]')
            .filter({ hasText: 'Email is required' }),
        ).toBeVisible();
        await expect(
          page
            .getByRole('group', { name: 'Shipping address' })
            .locator('[role="alert"]')
            .first(),
        ).toBeVisible();
      });
    });

    test('should allow reset of form', async ({ page }) => {
      await test.step('Fill some fields', async () => {
        await page.getByLabel('Contact email *').fill('test@example.com');
        await page.getByLabel('Street *').fill('123 Main St');
        await page.getByLabel('Notes').fill('Some notes here');
      });

      await test.step('Click reset button', async () => {
        await page.getByRole('button', { name: 'Reset' }).click();
      });

      await test.step('Verify fields are cleared', async () => {
        await expect(page.getByLabel('Contact email *')).toHaveValue('');
        await expect(page.getByLabel('Street *')).toHaveValue('');
        await expect(page.getByLabel('Notes')).toHaveValue('');
        await expect(page.getByText(/0\s*\/\s*200/)).toBeVisible();
      });
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper aria-invalid when field becomes valid', async ({
      page,
    }) => {
      const emailInput = page.getByLabel('Contact email *');

      await test.step('Field starts with aria-invalid (required)', async () => {
        // NgxHeadlessErrorStateDirective applies aria-invalid based on field state
        // Required fields may show as invalid immediately
        await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });

      await test.step('aria-invalid cleared when valid email entered', async () => {
        await emailInput.fill('valid@example.com');
        await emailInput.blur();
        await expect(emailInput).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    test('should have proper aria-describedby linking', async ({ page }) => {
      const emailInput = page.getByLabel('Contact email *');

      await test.step('Trigger error', async () => {
        await emailInput.focus();
        await emailInput.blur();
      });

      await test.step('Verify aria-describedby points to error', async () => {
        await expect(emailInput).toHaveAttribute('aria-describedby');
        const describedBy = await emailInput.getAttribute('aria-describedby');
        if (!describedBy) {
          throw new Error('Expected aria-describedby to be set');
        }
        const errorElement = page.locator(`#${describedBy}`);
        await expect(errorElement).toBeVisible();
        await expect(errorElement).toContainText('Email is required');
      });
    });

    test('should have fieldset with legend for grouping', async ({ page }) => {
      await test.step('Verify fieldset structure', async () => {
        const fieldset = page.getByRole('group', { name: 'Shipping address' });
        await expect(fieldset).toBeVisible();
        await expect(
          fieldset.locator('legend').filter({ hasText: 'Shipping address' }),
        ).toBeVisible();
      });
    });
  });
});
