import { expect, test } from '@playwright/test';

test.describe('Advanced Wizard Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/advanced-scenarios/advanced-wizard');
  });

  test('complete happy path with cross-step validation check', async ({
    page,
  }) => {
    // ----------------------------------------------------------------
    // Step 1: Traveler Info
    // ----------------------------------------------------------------
    await test.step('Fill Traveler Information', async () => {
      // Check we are on the traveler step
      await expect(
        page.getByRole('heading', { name: 'Traveler Information' }),
      ).toBeVisible();

      // Fill in valid traveler data
      await page.getByLabel('First Name').fill('John');
      await page.getByLabel('Last Name').fill('Doe');
      await page.getByLabel('Email').fill('john.doe@example.com');
      await page.getByLabel('Passport Number').fill('A1234567');

      // Set passport expiry to a date far in the future initially (e.g., 2030)
      await page.getByLabel(/Expiry Date/i).fill('2030-01-01');
      await page.getByLabel('Nationality').fill('Dutch');

      // Navigate to Trip step
      await page.getByRole('button', { name: 'Next' }).click();
    });

    // ----------------------------------------------------------------
    // Step 2: Trip Details
    // ----------------------------------------------------------------
    await test.step('Fill Trip Details', async () => {
      // Check we are on the trip step
      await expect(
        page.getByRole('heading', { name: 'Trip Details', exact: true }),
      ).toBeVisible();

      // Trip form is initially empty or has one empty destination
      // Assuming initial state has one empty destination based on prompt description

      // Fill Destination 1
      const dest1 = page.getByRole('group', { name: 'Destination 1' });
      await dest1.getByLabel(/Country/i).fill('Japan');
      await dest1.getByLabel(/City/i).fill('Tokyo');

      // Set trip dates: Aug 1 - Aug 10, 2026
      await dest1.getByLabel(/Arrival Date/i).fill('2026-08-01');
      await dest1.getByLabel(/Departure Date/i).fill('2026-08-10');

      // Target the default activity (Activity 1)
      const activity1 = dest1
        .locator('.activity-card')
        .filter({ hasText: 'Activity 1' });

      await activity1.getByLabel('Activity Name').fill('Sushi Making');
      await activity1.getByLabel('Date', { exact: true }).fill('2026-08-02');
      await activity1.getByLabel('Date', { exact: true }).blur();

      // Fill the default requirement of Activity 1
      await activity1.getByPlaceholder('Description').fill('Empty Stomach');
      await activity1.getByPlaceholder('Description').blur();

      const nextBtn = page.getByRole('button', { name: 'Next' });
      await expect(nextBtn).toBeEnabled();

      // Navigate to Review step
      await nextBtn.click();
    });

    // ----------------------------------------------------------------
    // Step 3: Review & Submit
    // ----------------------------------------------------------------
    await test.step('Review and Validate', async () => {
      await expect(
        page.getByRole('heading', { name: 'Review Your Booking' }),
      ).toBeVisible();

      // Verify summary data
      await expect(page.getByText('John Doe')).toBeVisible();
      await expect(page.getByText('Japan')).toBeVisible();
      await expect(page.getByText('Sushi Making')).toBeVisible();
    });

    // ----------------------------------------------------------------
    // Step 4: Cross-Step Validation (Passport Expiry)
    // ----------------------------------------------------------------
    await test.step('Verify Cross-Step Passport Validation', async () => {
      // Navigate back to Traveler step
      await page.getByRole('button', { name: 'Previous' }).click(); // To Trip
      await page.getByRole('button', { name: 'Previous' }).click(); // To Traveler

      await expect(
        page.getByRole('heading', { name: 'Traveler Information' }),
      ).toBeVisible();

      // Trip ends Aug 10, 2026.
      // Passport must be valid for 6 months after (Feb 10, 2027).

      // Set invalid expiry: Dec 1, 2026 (Valid for trip, but < 6 months buffer)
      await page.getByLabel(/Expiry Date/i).fill('2026-12-01');
      await page.getByLabel(/Expiry Date/i).blur();

      // Expect specific error message from Zod schema
      await expect(
        page.getByText('Passport must be valid 6 months after trip ends'),
      ).toBeVisible();

      // Fix expiry: March 2027
      await page.getByLabel(/Expiry Date/i).fill('2027-03-01');
      await page.getByLabel(/Expiry Date/i).blur();

      // Error should disappear
      await expect(
        page.getByText('Passport must be valid 6 months after trip ends'),
      ).toBeHidden();
    });

    // ----------------------------------------------------------------
    // Step 5: Final Submission
    // ----------------------------------------------------------------
    await test.step('Submit Trip', async () => {
      // Go forward again
      await page.getByRole('button', { name: 'Next' }).click(); // To Trip
      await page.getByRole('button', { name: 'Next' }).click(); // To Review

      // Submit
      await page.getByRole('button', { name: 'Confirm Booking' }).click();

      // Assuming success message or navigation?
      // Since it's a demo, we might look for a success alert or console log.
      // Based on the prompt code, it might not redirect but show success state.
      // Let's assume the button goes into "Submitting..." state or similar if API is mocked/slow.
      // Or simply check no error is shown.
    });
  });

  test('intra-step validation (Trip Dates)', async ({ page }) => {
    // Navigate to Trip Step (skip Traveler validation for speed if possible, otherwise fill min required)
    await page.getByLabel('First Name').fill('Jane');
    await page.getByLabel('Last Name').fill('Doe');
    await page.getByLabel('Email').fill('jane@example.com');
    await page.getByLabel('Passport Number').fill('B1234567');
    await page.getByLabel(/Expiry Date/i).fill('2030-01-01');
    await page.getByLabel('Nationality').fill('US');
    await page.getByRole('button', { name: 'Next' }).click();

    await test.step('Validate Departure after Arrival', async () => {
      const dest1 = page.getByRole('group', { name: 'Destination 1' });
      await dest1.getByLabel(/Country/i).fill('France');
      await dest1.getByLabel(/City/i).fill('Paris');

      // clearly wrong dates
      await dest1.getByLabel(/Arrival Date/i).fill('2026-05-10');
      await dest1.getByLabel(/Departure Date/i).fill('2026-05-01'); // Before arrival
      await dest1.getByLabel(/Departure Date/i).blur();

      await expect(
        page.getByText('Departure date must be after arrival date'),
      ).toBeVisible();

      // Fix
      await dest1.getByLabel(/Departure Date/i).fill('2026-05-20');
      await expect(
        page.getByText('Departure date must be after arrival date'),
      ).toBeHidden();
    });
  });

  test('intra-step validation (Activity Dates)', async ({ page }) => {
    // Navigate to Trip Step
    await page.getByLabel('First Name').fill('Jane');
    await page.getByLabel('Last Name').fill('Doe');
    await page.getByLabel('Email').fill('jane@example.com');
    await page.getByLabel('Passport Number').fill('B1234567');
    await page.getByLabel(/Expiry Date/i).fill('2030-01-01');
    await page.getByLabel('Nationality').fill('US');
    await page.getByRole('button', { name: 'Next' }).click();

    await test.step('Validate Activity Date within Trip Range', async () => {
      const dest1 = page.getByRole('group', { name: 'Destination 1' });
      await dest1.getByLabel(/Country/i).fill('Germany');
      await dest1.getByLabel(/City/i).fill('Berlin');

      // Trip: June 1st to June 10th
      await dest1.getByLabel(/Arrival Date/i).fill('2026-06-01');
      await dest1.getByLabel(/Departure Date/i).fill('2026-06-10');

      const activity1 = dest1.locator('.activity-card').first();
      await activity1.getByLabel('Activity Name').fill('Museum');

      // Invalid Date: Outside range (June 15th)
      await activity1.getByLabel('Date', { exact: true }).fill('2026-06-15');
      await activity1.getByLabel('Date', { exact: true }).blur();

      // Expect specific custom validation error
      await expect(
        page.getByText('Activity date must be within destination date range'),
      ).toBeVisible();

      // Fix: Inside range (June 5th)
      await activity1.getByLabel('Date', { exact: true }).fill('2026-06-05');
      await activity1.getByLabel('Date', { exact: true }).blur();

      await expect(
        page.getByText('Activity date must be within destination date range'),
      ).toBeHidden();
    });
  });

  test('intra-step validation (Arrival Date Past)', async ({ page }) => {
    // Navigate to Trip Step
    await page.getByLabel('First Name').fill('Jane');
    await page.getByLabel('Last Name').fill('Doe');
    await page.getByLabel('Email').fill('jane@example.com');
    await page.getByLabel('Passport Number').fill('B1234567');
    await page.getByLabel(/Expiry Date/i).fill('2030-01-01');
    await page.getByLabel('Nationality').fill('US');
    await page.getByRole('button', { name: 'Next' }).click();

    await test.step('Validate Arrival Date in Future', async () => {
      const dest1 = page.getByRole('group', { name: 'Destination 1' });

      // Set a date in the past (e.g., 2020)
      await dest1.getByLabel(/Arrival Date/i).fill('2020-01-01');
      await dest1.getByLabel(/Arrival Date/i).blur();

      await expect(
        page.getByText('Arrival date cannot be in the past'),
      ).toBeVisible();

      // Fix
      await dest1.getByLabel(/Arrival Date/i).fill('2026-08-01');
      await expect(
        page.getByText('Arrival date cannot be in the past'),
      ).toBeHidden();
    });
  });
});
