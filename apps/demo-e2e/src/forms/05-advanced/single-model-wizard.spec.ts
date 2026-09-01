import { expect, test } from '@playwright/test';
import { SingleModelWizardPage } from '../../page-objects/single-model-wizard.page';

/**
 * Single-Model Wizard - E2E Tests
 * Route: /advanced-scenarios/single-model-wizard
 *
 * One `form()` model spans every step, using the shared `ngx-wizard`'s
 * built-in Previous/Next/Submit navigation. Its `canNavigate` guard calls
 * a shared `#validateStep` helper to validate the subtree of the step
 * being LEFT, for both the built-in Next button and progress-header
 * clicks alike.
 */
test.describe('Advanced Scenarios - Single-Model Wizard', () => {
  let wizard: SingleModelWizardPage;

  test.beforeEach(async ({ page }) => {
    wizard = new SingleModelWizardPage(page);
    await wizard.goto();
  });

  test('should display the account step first', async () => {
    await expect(wizard.stepHeading).toHaveText(/Step 1 of 3: Account/);
    await expect(wizard.fullNameInput).toBeVisible();
    await expect(wizard.outlineAppearanceButton).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(wizard.standardAppearanceButton).toBeVisible();
    await expect(wizard.plainAppearanceButton).toBeVisible();
    await expect(wizard.verticalOrientationButton).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('blocks Next on an invalid step and surfaces touched errors', async () => {
    await wizard.nextButton.click();

    // Still on step 1 — navigation was blocked.
    await expect(wizard.stepHeading).toHaveText(/Step 1 of 3: Account/);
    await expect(wizard.errorAlerts.first()).toBeVisible();
  });

  test('advances to Shipping once the Account step is valid', async () => {
    await wizard.fillAccountStep('Ada Lovelace', 'ada@acme.example');
    await wizard.nextButton.click();

    await expect(wizard.stepHeading).toHaveText(/Step 2 of 3: Shipping/);
    // Focus should land on the new step's heading.
    await expect(wizard.stepHeading).toBeFocused();
  });

  test("Next validates only the active step's subtree, not the sibling step", async () => {
    await test.step("a blocked Next on Account never renders Shipping's fields at all", async () => {
      await wizard.nextButton.click();

      await expect(wizard.stepHeading).toHaveText(/Step 1 of 3: Account/);
      await expect(wizard.errorAlerts.first()).toBeVisible();
      // Only the active step's template is instantiated (NgTemplateOutlet
      // in the shared wizard), so Shipping's own fields can't be showing
      // errors — they aren't even in the DOM to check.
      await expect(wizard.streetInput).toHaveCount(0);
      await expect(wizard.postalCodeInput).toHaveCount(0);
    });

    await test.step('arriving on Shipping (untouched) shows zero errors, even though its fields are required', async () => {
      await wizard.fillAccountStep('Ada Lovelace', 'ada@acme.example');
      await wizard.nextButton.click();

      await expect(wizard.stepHeading).toHaveText(/Step 2 of 3: Shipping/);
      // markAsTouched() on leaving Account only cascaded within Account's
      // own subtree — Shipping's required street/city/postalCode are
      // untouched, so on-touch error display keeps them silent even
      // though they are, technically, currently invalid (empty).
      await expect(wizard.errorAlerts).toHaveCount(0);
    });
  });

  test("runs the cross-step express-shipping rule against step 1's email", async () => {
    await test.step('advance with a free-email address', async () => {
      await wizard.fillAccountStep('Ada Lovelace', 'ada@gmail.com');
      await wizard.nextButton.click();
      await expect(wizard.stepHeading).toHaveText(/Step 2 of 3: Shipping/);
    });

    await test.step('checking express shipping surfaces the cross-step error', async () => {
      await wizard.fillShippingStep('1 Infinite Loop', 'Cupertino', '95014');
      await wizard.expressShippingCheckbox.check();
      await wizard.expressShippingCheckbox.blur();

      const error = wizard.page.locator('[role="alert"]', {
        hasText: /work email address \(step 1\)/i,
      });
      await expect(error).toBeVisible();
    });

    await test.step('fixing the email on step 1 clears the error without touching step 2 again', async () => {
      await wizard.previousButton.click();
      await expect(wizard.stepHeading).toHaveText(/Step 1 of 3: Account/);

      await wizard.emailInput.fill('ada@acme.example');
      await wizard.nextButton.click();
      await expect(wizard.stepHeading).toHaveText(/Step 2 of 3: Shipping/);

      const error = wizard.page.locator('[role="alert"]', {
        hasText: /work email address \(step 1\)/i,
      });
      await expect(error).toHaveCount(0);
      await expect(wizard.expressShippingCheckbox).toBeChecked();
    });
  });

  test('completes the full wizard and submits the whole form once', async () => {
    await test.step('fill and advance through Account', async () => {
      await wizard.fillAccountStep('Grace Hopper', 'grace@navy.example');
      await wizard.nextButton.click();
    });

    await test.step('fill and advance through Shipping', async () => {
      await wizard.fillShippingStep('1 Compiler Way', 'Arlington', '22202');
      await wizard.nextButton.click();
      await expect(wizard.stepHeading).toHaveText(/Step 3 of 3: Review/);
      // Review has no fields of its own, but reaching it already required
      // Account and Shipping to be valid — treated as completed so the
      // progress bar reaches 100% on step 3 of 3 rather than maxing out
      // at 2/3 (~67%).
      await expect(wizard.progressFill).toHaveAttribute(
        'style',
        /width:\s*100%/,
      );
      await expect(wizard.progressFill).toHaveAttribute('aria-valuenow', '100');
    });

    await test.step('review reflects the exact values entered on earlier steps', async () => {
      await expect(wizard.orderSummary).toContainText('Grace Hopper');
      await expect(wizard.orderSummary).toContainText('grace@navy.example');
      await expect(wizard.orderSummary).toContainText('1 Compiler Way');
    });

    await test.step('confirm order runs the whole-form submit()', async () => {
      await wizard.confirmOrderButton.click();
      await expect(wizard.successMessage).toBeVisible();
    });
  });

  test('per-subtree gating makes reaching Confirm with an invalid earlier step unreachable', async () => {
    // See single-model-wizard.form.ts's `confirmOrder()` comment: submit()
    // re-validating the WHOLE form is a safety net for exactly the state
    // this test tries (and fails) to construct. This test pins that the
    // safety net is currently unreachable through the UI, not merely
    // untested — every forward transition, whether through the shared
    // wizard's built-in Next button or a progress-header click, runs
    // through the same `canNavigate` guard, which re-validates the
    // subtree of the step being left. So an invalid step can never be
    // left forward, and Confirm only ever renders on Review, the last
    // step.
    await test.step('complete the wizard once, validly, reaching Review', async () => {
      await wizard.fillAccountStep('Grace Hopper', 'grace@navy.example');
      await wizard.nextButton.click();
      await wizard.fillShippingStep('1 Compiler Way', 'Arlington', '22202');
      await wizard.nextButton.click();
      await expect(wizard.stepHeading).toHaveText(/Step 3 of 3: Review/);
    });

    await test.step('go back and invalidate Shipping without re-leaving it forward', async () => {
      await wizard.previousButton.click(); // Review -> Shipping
      await expect(wizard.stepHeading).toHaveText(/Step 2 of 3: Shipping/);
      await wizard.postalCodeInput.fill('');
    });

    await test.step('Next re-validates the step being left and blocks forward progress', async () => {
      await wizard.nextButton.click();

      // Still on Shipping: the invalid subtree can never be left forward,
      // so Review — and therefore the Confirm button, which only renders
      // on Review — is unreachable from this state.
      await expect(wizard.stepHeading).toHaveText(/Step 2 of 3: Shipping/);
      await expect(wizard.errorAlerts.first()).toBeVisible();
      await expect(wizard.confirmOrderButton).toHaveCount(0);
    });

    await test.step("the progress header can't be used to route around the block either", async () => {
      // Review WAS visited earlier in this test (step 1's "reaching
      // Review" transition marks it visited via the shared wizard's
      // `#visitedSteps`), so its header button stays enabled here — the
      // built-in `canNavigateToStep()` gate only cares whether a step was
      // ever visited, not whether the CURRENT step is valid. But clicking
      // it still routes through `goToStep()` -> the same `canNavigate`
      // guard, which re-validates the subtree being LEFT (Shipping, now
      // invalid). So the click is refused and the wizard stays put — the
      // guard, not a disabled button, is what makes Confirm unreachable.
      await wizard.stepNavButton('Review').click();

      await expect(wizard.stepHeading).toHaveText(/Step 2 of 3: Shipping/);
      await expect(wizard.errorAlerts.first()).toBeVisible();
      await expect(wizard.confirmOrderButton).toHaveCount(0);
    });
  });
});
