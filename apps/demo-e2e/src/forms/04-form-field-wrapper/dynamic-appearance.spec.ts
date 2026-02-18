import { expect, test } from '@playwright/test';

test.describe('Dynamic Appearance - Runtime Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/form-field-wrapper/dynamic-appearance');
  });

  test('should default to standard appearance', async ({ page }) => {
    const firstWrapper = page.locator('ngx-signal-form-field-wrapper').first();
    await expect(firstWrapper).toBeVisible();

    // Default should be standard, check for standard class or absence of outline class
    // Based on previous knowledge, standard might be default or explicit class
    // Let's check for standard button active state
    await expect(page.getByRole('button', { name: 'Standard' })).toHaveClass(
      /bg-white/,
    ); // Active class from AppearanceToggleComponent
    await expect(page.getByRole('button', { name: 'Outline' })).not.toHaveClass(
      /bg-white/,
    );
  });

  test('should switch to outline appearance when toggled', async ({ page }) => {
    const firstWrapper = page.locator('ngx-signal-form-field-wrapper').first();

    // Click Outline button
    await page.getByRole('button', { name: 'Outline' }).click();

    // Verify active state of buttons
    await expect(
      page.getByRole('button', { name: 'Standard' }),
    ).not.toHaveClass(/bg-white/);
    await expect(page.getByRole('button', { name: 'Outline' })).toHaveClass(
      /bg-white/,
    );

    // Verify wrapper has outline styling
    await expect(firstWrapper).toHaveClass(/ngx-signal-forms-outline/);
  });

  test('should switch back to standard appearance', async ({ page }) => {
    const firstWrapper = page.locator('ngx-signal-form-field-wrapper').first();

    // Switch to Outline first
    await page.getByRole('button', { name: 'Outline' }).click();
    await expect(firstWrapper).toHaveClass(/ngx-signal-forms-outline/);

    // Switch back to Standard
    await page.getByRole('button', { name: 'Standard' }).click();

    // Verify wrapper does not have outline styling (or has standard styling)
    await expect(firstWrapper).not.toHaveClass(/ngx-signal-forms-outline/);
  });
});
