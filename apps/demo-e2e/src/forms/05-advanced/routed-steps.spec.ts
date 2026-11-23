import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { expect, test, type Page } from '@playwright/test';

/**
 * Routed Steps - E2E Tests
 * Route: /advanced-scenarios/routed-steps
 *
 * One `form()` lives above the outlet of three step routes. Each step route
 * has an `errorComponent`. These tests cover what needs a real browser and
 * the real app shell: focus, the URL, the history, and the limit of a step
 * failure to the step.
 */

const STEP_FAILED = 'This step could not be shown';

/** The booking form. The form state panel beside it repeats the messages. */
function bookingForm(page: Page) {
  return page.locator('ngx-routed-steps');
}

function stepHeading(page: Page) {
  return bookingForm(page).locator('h2');
}

/** Matches the URL of a step, with any origin and base path before it. */
function stepUrl(step: string): RegExp {
  return new RegExp(`${DEMO_PATHS.routedSteps}/${step}$`, 'u');
}

function timeSlot(page: Page) {
  return page.getByRole('combobox', { name: /Time slot/u });
}

async function fillAttendee(page: Page): Promise<void> {
  await page.getByLabel('Full name').fill('Ada Lovelace');
  await page.getByLabel('Email').fill('ada@example.com');
}

test.describe('Advanced Scenarios - Routed Steps', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_PATHS.routedSteps, { waitUntil: 'domcontentloaded' });
    await expect(stepHeading(page)).toHaveText('Step 1 of 3: Attendee');
  });

  test('opens the first step on its own URL', async ({ page }) => {
    await expect(page).toHaveURL(stepUrl('attendee'));
    await expect(page).toHaveTitle(/^Routed Steps/u);
    await expect(page.getByText('* indicates a required field')).toBeVisible();
  });

  test('keeps the visitor on an invalid step and moves focus to the first invalid field', async ({
    page,
  }) => {
    await page.getByRole('link', { name: 'Next: Time slot' }).click();

    await expect(
      bookingForm(page).getByText('Enter your full name'),
    ).toBeVisible();
    await expect(page).toHaveURL(stepUrl('attendee'));
    await expect(page.getByLabel('Full name')).toBeFocused();
  });

  test('moves focus to the step heading on a step change, not to the page heading', async ({
    page,
  }) => {
    await fillAttendee(page);
    await page.getByRole('link', { name: 'Next: Time slot' }).click();

    await expect(page).toHaveURL(stepUrl('time-slot'));
    await expect(stepHeading(page)).toHaveText('Step 2 of 3: Time slot');
    await expect(stepHeading(page)).toBeFocused();
    await expect(page).toHaveTitle(/^Routed Steps/u);
  });

  test('keeps the entries when the visitor uses the browser history', async ({
    page,
  }) => {
    await fillAttendee(page);
    await page.getByRole('link', { name: 'Next: Time slot' }).click();
    await timeSlot(page).selectOption('11:30');

    await page.goBack();
    await expect(stepHeading(page)).toHaveText('Step 1 of 3: Attendee');
    await expect(page.getByLabel('Full name')).toHaveValue('Ada Lovelace');

    await page.goForward();
    await expect(stepHeading(page)).toHaveText('Step 2 of 3: Time slot');
    await expect(timeSlot(page)).toHaveValue('11:30');
  });

  test('limits a step failure to the step, and recovers with the entries', async ({
    page,
  }) => {
    const failTimeSlots = page.getByRole('checkbox', {
      name: 'Fail the time slot list',
    });

    await fillAttendee(page);
    await page.getByRole('link', { name: 'Next: Time slot' }).click();
    await timeSlot(page).selectOption('14:00');
    await page.getByLabel('Notes for the organiser').fill('Vegetarian lunch');
    await page.getByRole('link', { name: 'Back', exact: true }).click();
    await expect(stepHeading(page)).toHaveText('Step 1 of 3: Attendee');

    await test.step('the fallback replaces only the step', async () => {
      await failTimeSlots.check();
      await page.getByRole('link', { name: 'Next: Time slot' }).click();

      await expect(stepHeading(page)).toHaveText(STEP_FAILED);
      await expect(stepHeading(page)).toBeFocused();
      await expect(
        page.getByText('Reason: The time slot service is unavailable.'),
      ).toBeVisible();
      // The page and the frame of the form are still there.
      await expect(page.locator('main h1')).toHaveText('Routed Steps');
      await expect(
        page.getByRole('navigation', { name: 'Booking steps' }),
      ).toBeVisible();
    });

    await test.step('"Try again" fails again while the service is down', async () => {
      await page.getByRole('button', { name: 'Try again' }).click();

      await expect(stepHeading(page)).toHaveText(STEP_FAILED);
      await expect(stepHeading(page)).toBeFocused();
    });

    await test.step('"Try again" brings the step back with its entries', async () => {
      await failTimeSlots.uncheck();
      await page.getByRole('button', { name: 'Try again' }).click();

      await expect(stepHeading(page)).toHaveText('Step 2 of 3: Time slot');
      await expect(timeSlot(page)).toHaveValue('14:00');
      await expect(page.getByLabel('Notes for the organiser')).toHaveValue(
        'Vegetarian lunch',
      );
    });

    await test.step('the booking can be confirmed', async () => {
      await page.getByRole('link', { name: 'Next: Review' }).click();
      await expect(stepHeading(page)).toHaveText('Step 3 of 3: Review');
      await page.getByRole('button', { name: 'Confirm booking' }).click();

      const confirmation = page.getByText(/Your seat is booked/u);
      await expect(confirmation).toBeVisible();
      await expect(confirmation).toBeFocused();
    });
  });

  test('sends a deep link to a later step back to the first invalid step', async ({
    page,
  }) => {
    await page.goto(`${DEMO_PATHS.routedSteps}/review`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(stepHeading(page)).toHaveText('Step 1 of 3: Attendee');
    await expect(page).toHaveURL(stepUrl('attendee'));
    await expect(
      bookingForm(page).getByText('Enter your full name'),
    ).toHaveCount(0);
  });
});
