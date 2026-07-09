import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

async function fillTravelerStep(
  page: Page,
  overrides: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    passport: string;
    expiry: string;
    nationality: string;
  }> = {},
): Promise<void> {
  const data = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    passport: 'A1234567',
    expiry: '2030-01-01',
    nationality: 'Dutch',
    ...overrides,
  };

  await page.getByLabel('First Name').fill(data.firstName);
  await page.getByLabel('Last Name').fill(data.lastName);
  await page.getByLabel('Email').fill(data.email);
  await page.getByLabel('Passport Number').fill(data.passport);
  await page.getByLabel(/Expiry Date/i).fill(data.expiry);
  await page.getByLabel('Nationality').fill(data.nationality);
}

async function fillTripStepMinimal(page: Page): Promise<void> {
  const dest1 = page.getByRole('group', { name: 'Destination 1' });
  await dest1.getByLabel(/Country/i).fill('Japan');
  await dest1.getByLabel(/City/i).fill('Tokyo');
  await dest1.getByLabel(/Arrival Date/i).fill('2026-08-01');
  await dest1.getByLabel(/Departure Date/i).fill('2026-08-10');

  const activity1 = dest1
    .locator('.activity-card')
    .filter({ hasText: 'Activity 1' });
  await activity1.getByLabel('Activity Name').fill('Sushi Making');
  await activity1.getByLabel('Date', { exact: true }).fill('2026-08-02');
  await activity1.getByLabel('Date', { exact: true }).blur();
  await activity1.getByPlaceholder('Description').fill('Empty Stomach');
  await activity1.getByPlaceholder('Description').blur();
}

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

      await expect(
        page.getByRole('heading', { name: 'Trip Details', exact: true }),
      ).toBeFocused();
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

      await expect(
        page.getByRole('heading', { name: 'Review Your Booking' }),
      ).toBeFocused();

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

      await expect(
        page.getByRole('heading', { name: 'Traveler Information' }),
      ).toBeFocused();

      // Trip ends Aug 10, 2026.
      // Passport must be valid for 6 months after (Feb 10, 2027).

      // Set invalid expiry: Dec 1, 2026 (Valid for trip, but < 6 months buffer)
      await page.getByLabel(/Expiry Date/i).fill('2026-12-01');
      await page.getByLabel(/Expiry Date/i).blur();

      // Expect specific error message from Zod schema, scoped to the alert
      // live region — the same text appears in the page's "Try This" guide.
      const passportAlert = page
        .getByRole('alert')
        .filter({ hasText: 'Passport must be valid 6 months after trip ends' });
      await expect(passportAlert).toBeVisible();

      // Fix expiry: March 2027
      await page.getByLabel(/Expiry Date/i).fill('2027-03-01');
      await page.getByLabel(/Expiry Date/i).blur();

      // Error should disappear
      await expect(passportAlert).toBeHidden();
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

      const successMessage = page.getByRole('status').filter({
        hasText: 'Booking confirmed',
      });

      await expect(successMessage).toBeVisible({ timeout: 5000 });
      await expect(successMessage).toContainText('Confirmation number');
      await expect(successMessage).toContainText('Booking ID');
      await expect(
        page.getByRole('button', { name: 'Start New Booking' }),
      ).toBeVisible();
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

      // Scoped to the alert live region — the same text appears in the
      // page's "Try This" guide.
      const departureAlert = page
        .getByRole('alert')
        .filter({ hasText: 'Departure date must be after arrival date' });
      await expect(departureAlert).toBeVisible();

      // Fix
      await dest1.getByLabel(/Departure Date/i).fill('2026-05-20');
      await expect(departureAlert).toBeHidden();
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

      // Expect specific custom validation error, scoped to the alert live
      // region — the same text appears in the page's "Try This" guide.
      const activityAlert = page.getByRole('alert').filter({
        hasText: 'Activity date must be within destination date range',
      });
      await expect(activityAlert).toBeVisible();

      // Fix: Inside range (June 5th)
      await activity1.getByLabel('Date', { exact: true }).fill('2026-06-05');
      await activity1.getByLabel('Date', { exact: true }).blur();

      await expect(activityAlert).toBeHidden();
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

      // Scoped to the alert live region — the same text appears in the
      // page's "Try This" guide.
      const arrivalAlert = page
        .getByRole('alert')
        .filter({ hasText: 'Arrival date cannot be in the past' });
      await expect(arrivalAlert).toBeVisible();

      // Fix
      await dest1.getByLabel(/Arrival Date/i).fill('2026-08-01');
      await expect(arrivalAlert).toBeHidden();
    });
  });

  test('autosave surfaces a "Last saved" timestamp after debounce', async ({
    page,
  }) => {
    const statusRow = page.locator('.status-row');

    // Pristine wizard has no persisted timestamp yet.
    await expect(statusRow).not.toContainText('Last saved:');

    // Initial autosave: the store seeds one empty destination on init, which
    // flows through the 2s debounced rxMethod and issues a POST to
    // /api/wizard/draft. We wait on the full network round-trip so the
    // assertion covers the actual pipeline (effect → debounce → mutation →
    // MSW handler), not just a client-side timer.
    const initialSave = await page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/wizard/draft') &&
        response.request().method() === 'POST' &&
        response.status() === 200,
      { timeout: 15000 },
    );
    const initialPayload = (await initialSave.json()) as {
      draftId: string;
      savedAt: string;
    };
    expect(initialPayload.draftId).toBeTruthy();
    expect(Number.isNaN(Date.parse(initialPayload.savedAt))).toBe(false);

    // Once onSuccess fires, store.lastSavedAt drives the DatePipe output in
    // the status row. Format is `Last saved: h:mm a` (e.g., "Last saved: 6:34 PM").
    await expect(statusRow).toContainText(/Last saved: \d{1,2}:\d{2}/);

    // Second autosave: fill the traveler form and navigate. Next commits the
    // form's local linkedSignal to the store via setTraveler(), which
    // re-triggers the autosave effect and produces a PUT with the draftId
    // returned by the initial POST.
    await fillTravelerStep(page);

    const secondSave = page.waitForResponse(
      (response) =>
        response.url().includes('/api/wizard/draft/') &&
        response.request().method() === 'PUT' &&
        response.status() === 200,
      { timeout: 15000 },
    );
    await page.getByRole('button', { name: 'Next' }).click();
    const putResponse = await secondSave;
    const putPayload = (await putResponse.json()) as { draftId: string };
    expect(putPayload.draftId).toBe(initialPayload.draftId);

    // Timestamp remains visible after the second save round-trip.
    await expect(statusRow).toContainText(/Last saved: \d{1,2}:\d{2}/);
  });

  test('review step shows all entered details', async ({ page }) => {
    await fillTravelerStep(page, {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice.smith@example.com',
      nationality: 'British',
    });
    await page.getByRole('button', { name: 'Next' }).click();

    await fillTripStepMinimal(page);
    await page.getByRole('button', { name: 'Next' }).click();

    const reviewHeading = page.getByRole('heading', {
      name: 'Review Your Booking',
    });
    await expect(reviewHeading).toBeVisible();
    await expect(reviewHeading).toBeFocused();

    // Traveler summary
    const travelerSection = page.locator('.review-section', {
      has: page.getByRole('heading', { name: /Traveler Information/ }),
    });
    await expect(travelerSection).toContainText('Alice Smith');
    await expect(travelerSection).toContainText('alice.smith@example.com');
    await expect(travelerSection.getByText('✓ Valid')).toBeVisible();

    // Trip overview summary: 1 destination, ≥1 activity, ≥1 requirement
    const tripSection = page.locator('.review-section', {
      has: page.getByRole('heading', { name: /Trip Overview/ }),
    });
    await expect(tripSection).toContainText(/1 destinations/);
    await expect(tripSection).toContainText(/1 activities/);
    await expect(tripSection).toContainText(/1 requirements/);

    // Destinations detail
    const destinationsSection = page.locator('.review-section', {
      has: page.getByRole('heading', { name: /^Destinations$/ }),
    });
    await expect(destinationsSection).toContainText(/Japan|Tokyo/);
    await expect(destinationsSection).toContainText('Sushi Making');
    await expect(destinationsSection.locator('.badge')).toContainText(
      /1 activities/,
    );
  });

  test('final submission posts booking and clears submitting state', async ({
    page,
  }) => {
    await fillTravelerStep(page);
    await page.getByRole('button', { name: 'Next' }).click();
    await fillTripStepMinimal(page);
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(
      page.getByRole('heading', { name: 'Review Your Booking' }),
    ).toBeVisible();

    const bookingRequest = page.waitForRequest(
      (request) =>
        request.url().endsWith('/api/wizard/booking') &&
        request.method() === 'POST',
    );
    const bookingResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/wizard/booking') &&
        response.request().method() === 'POST',
    );

    const confirmBtn = page.getByRole('button', { name: 'Confirm Booking' });
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // Button flips to the submitting state synchronously.
    await expect(
      page.getByRole('button', { name: 'Submitting...' }),
    ).toBeVisible();

    // Request body must contain the committed tripData from the store.
    const request = await bookingRequest;
    const body = request.postDataJSON() as {
      traveler: { firstName: string };
      destinations: { city: string }[];
    };
    expect(body.traveler.firstName).toBe('John');
    expect(body.destinations[0]?.city).toBe('Tokyo');

    const response = await bookingResponse;
    expect(response.status()).toBe(200);
    const payload = (await response.json()) as {
      bookingId: string;
      status: string;
    };
    expect(payload.status).toBe('confirmed');
    expect(payload.bookingId).toBeTruthy();

    // After the mutation resolves, the wizard exposes visible booking
    // confirmation details and swaps the submit CTA for a reset path.
    const successMessage = page.getByRole('status').filter({
      hasText: 'Booking confirmed',
    });

    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('Confirmation number');
    await expect(successMessage).toContainText(payload.bookingId);
    await expect(
      page.getByRole('button', { name: 'Start New Booking' }),
    ).toBeVisible();
    await expect(page.locator('.error-message')).toHaveCount(0);
  });

  test('progress-header step click cannot skip validation on an invalid current step (#166 finding #3)', async ({
    page,
  }) => {
    await test.step('Complete Traveler and Trip steps so both are committed and valid', async () => {
      await fillTravelerStep(page);
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(
        page.getByRole('heading', { name: 'Trip Details', exact: true }),
      ).toBeVisible();

      await fillTripStepMinimal(page);
      // Advancing to Review commits the Trip step's local form data into the
      // store (WizardContainerComponent#commitCurrentStep), which is what
      // actually marks `trip` as valid/navigable from the header — merely
      // being the active step makes the header button non-disabled too, so
      // this commit is required for a faithful repro of forward navigation
      // *away* from an invalid current step.
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(
        page.getByRole('heading', { name: 'Review Your Booking' }),
      ).toBeVisible();
    });

    await test.step('Navigate back to Traveler via the progress header', async () => {
      await page
        .locator('.wizard-step-button')
        .filter({ hasText: 'Traveler Info' })
        .click();
      await expect(
        page.getByRole('heading', { name: 'Traveler Information' }),
      ).toBeVisible();
    });

    await test.step('Invalidate the current (Traveler) step', async () => {
      await page.getByLabel('First Name').fill('');
      await page.getByLabel('First Name').blur();
    });

    await test.step('Click "Trip Details" in the progress header', async () => {
      await page
        .locator('.wizard-step-button')
        .filter({ hasText: 'Trip Details' })
        .click();

      // The buggy implementation set `currentStep` synchronously (before the
      // container's `await`-based validation resolved), so the DOM briefly
      // *still* shows Traveler right after the click and only flips to Trip
      // Details once the async validation's (too-late) `preventDefault()`
      // has already been ignored. Give that microtask/render race a moment
      // to fully settle before asserting the final state below — asserting
      // immediately after the click can catch the transient pre-flip frame
      // and produce a false pass.
      await page.waitForTimeout(300);
    });

    await test.step('Wizard stays on the invalid Traveler step instead of navigating away', async () => {
      await expect(
        page.getByRole('heading', { name: 'Traveler Information' }),
      ).toBeVisible();
      await expect(
        page
          .locator('.wizard-step-button')
          .filter({ hasText: 'Traveler Info' }),
      ).toHaveAttribute('aria-current', 'step');
      await expect(
        page.locator('.wizard-step-button').filter({ hasText: 'Trip Details' }),
      ).not.toHaveAttribute('aria-current', 'step');
    });

    await test.step('Validation error is visible on the empty required field', async () => {
      await expect(page.getByLabel('First Name')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });
  });

  // Regression coverage for #194: the only existing header-click spec proves
  // navigation is *blocked* from an invalid current step. Nothing asserted
  // the "happy path" contract in wizard.ts's `canNavigateToStep` — that
  // unvisited future steps are disabled, and that a click on an already
  // visited step (forward OR backward) actually jumps there directly,
  // without going through Next/Previous.
  test('disables header buttons for unvisited future steps', async ({
    page,
  }) => {
    const tripStep = page
      .locator('.wizard-step-button')
      .filter({ hasText: 'Trip Details' });
    const reviewStep = page
      .locator('.wizard-step-button')
      .filter({ hasText: 'Review' });

    await expect(tripStep).toBeDisabled();
    await expect(reviewStep).toBeDisabled();

    await test.step('Advancing to Trip marks it visited and enables its header button', async () => {
      await fillTravelerStep(page);
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(
        page.getByRole('heading', { name: 'Trip Details', exact: true }),
      ).toBeVisible();

      await expect(tripStep).toBeEnabled();
      // Review has still never been visited.
      await expect(reviewStep).toBeDisabled();
    });
  });

  test('header-click navigates directly between already-visited steps, forward and backward', async ({
    page,
  }) => {
    await test.step('Walk forward to Review via Next so every step is visited', async () => {
      await fillTravelerStep(page);
      await page.getByRole('button', { name: 'Next' }).click();
      await fillTripStepMinimal(page);
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(
        page.getByRole('heading', { name: 'Review Your Booking' }),
      ).toBeVisible();
    });

    const travelerStep = page
      .locator('.wizard-step-button')
      .filter({ hasText: 'Traveler Info' });
    const tripStep = page
      .locator('.wizard-step-button')
      .filter({ hasText: 'Trip Details' });
    const reviewStep = page
      .locator('.wizard-step-button')
      .filter({ hasText: 'Review' });

    await test.step('Header-click jumps backward two steps, straight to Traveler', async () => {
      await travelerStep.click();
      await expect(
        page.getByRole('heading', { name: 'Traveler Information' }),
      ).toBeVisible();
      await expect(travelerStep).toHaveAttribute('aria-current', 'step');
    });

    await test.step('Header-click jumps forward two steps, straight to Review, skipping Trip', async () => {
      await reviewStep.click();
      await expect(
        page.getByRole('heading', { name: 'Review Your Booking' }),
      ).toBeVisible();
      await expect(reviewStep).toHaveAttribute('aria-current', 'step');
      await expect(tripStep).not.toHaveAttribute('aria-current', 'step');
    });

    await test.step('Trip stays enabled and marked completed after being skipped over', async () => {
      await expect(tripStep).toBeEnabled();
      await expect(tripStep).toHaveClass(/completed/);
    });
  });
});
