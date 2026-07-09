import { expect, test } from '@playwright/test';

/**
 * fill -> blur -> observe-error
 *
 * The single E2E spec for the Spartan reference. Covers the same surface as
 * the smoke spec but through the real Vite-compiled bundle, so any broken
 * provider wiring (renderer-token registration, hint-registry projection,
 * auto-ARIA selector matching against `[hlmInput]`) surfaces here.
 *
 * Pre-interaction `aria-invalid` IS asserted for both the text input and the
 * plan combobox (audit #148 finding 2). `BrnSelectTrigger` host-binds
 * `aria-invalid` off the raw, ungated `FieldState.invalid` — with `plan`
 * required and empty, that would fire `aria-invalid="true"` on first paint
 * regardless of the demo's `on-touch` default, on a form nobody has touched
 * yet. `HlmSelectTrigger` (`libs/spartan/ui/select`) now gates its own
 * `aria-invalid` write off `BrnFieldControl.spartanInvalid()` — the same
 * touched-aware signal driving the destructive-ring styling — so both
 * controls agree on "no errors before touch".
 *
 * `aria-describedby` is the contract that the wrapper-scoped
 * `BrnFieldA11yService` factory in
 * {@link `apps/demo-spartan/src/app/wrapper/spartan-form-field.ts`}
 * mediates: Brain's `BrnFieldControlDescribedBy` host directive owns the
 * attribute on `[hlmInput]`, but the factory-installed bridge service feeds
 * it from the toolkit's composition so the toolkit-managed `<fieldName>-error`
 * id reaches the helm input host element. This spec asserts that contract
 * end-to-end (the smoke spec covers the same path through jsdom).
 */
test.describe('Spartan account preferences form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('keeps the plan select closed until the user opens it', async ({
    page,
  }) => {
    const plan = page.getByRole('combobox', { name: 'Plan' });

    await test.step('Verify the select starts collapsed with no inline options', async () => {
      await expect(plan).toHaveAttribute('aria-expanded', 'false');
      await expect(page.getByRole('option', { name: 'Starter' })).toHaveCount(
        0,
      );
    });

    await test.step('Open the select and verify options are rendered in the overlay', async () => {
      await plan.focus();
      await plan.press('ArrowDown');

      await expect(page.getByRole('option', { name: 'Starter' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Pro' })).toBeVisible();
      await expect(
        page.getByRole('option', { name: 'Enterprise' }),
      ).toBeVisible();
    });
  });

  test('does not mark either required-and-empty control aria-invalid before it is touched', async ({
    page,
  }) => {
    const displayName = page.getByLabel('Display name');
    const plan = page.getByRole('combobox', { name: 'Plan' });

    await expect(displayName).not.toHaveAttribute('aria-invalid', 'true');
    await expect(plan).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('threads the newsletter hint into the checkbox button, not its display:contents host', async ({
    page,
  }) => {
    const checkbox = page.getByRole('checkbox', {
      name: 'Send me product updates',
    });

    await expect(checkbox).toHaveAttribute(
      'aria-describedby',
      /\bnewsletter-hint\b/,
    );
  });

  test('shows blocking errors and wires aria-describedby after touch', async ({
    page,
  }) => {
    const displayName = page.getByLabel('Display name');

    await test.step('Blur the empty field to trigger on-touch validation', async () => {
      await displayName.click();
      await displayName.press('Tab');
    });

    await test.step('Verify error rendering and aria linkage', async () => {
      await expect(displayName).toHaveAttribute('aria-invalid', 'true');

      const error = page.locator('#display-name-error');
      await expect(error).toContainText(/display name is required/i);
      await expect(displayName).toHaveAttribute(
        'aria-describedby',
        /\bdisplay-name-error\b/,
      );
    });
  });

  test('renders warnings without marking the field invalid and still submits', async ({
    page,
  }) => {
    const displayName = page.getByLabel('Display name');
    const plan = page.getByRole('combobox', { name: 'Plan' });

    await test.step('Enter a short-but-valid display name to trigger the warning path', async () => {
      await displayName.fill('Ada');
      await displayName.press('Tab');

      const warning = page.locator('#display-name-warning');
      await expect(warning).toContainText(
        /short names are accepted but easy to confuse with handles/i,
      );
      await expect(displayName).toHaveAttribute('aria-invalid', 'false');
      await expect(displayName).toHaveAttribute(
        'aria-describedby',
        /\bdisplay-name-warning\b/,
      );
    });

    await test.step('Choose a plan and submit successfully with warnings only', async () => {
      await plan.focus();
      await plan.press('ArrowDown');
      await page.getByRole('option', { name: 'Starter' }).click();
      await page.getByTestId('submit-button').click();

      await expect(page.getByTestId('last-submission')).toContainText(
        '"displayName": "Ada"',
      );
      await expect(page.getByTestId('last-submission')).toContainText(
        '"plan": "starter"',
      );
    });
  });

  // Regression coverage for #194 (a): no test previously submitted/touched
  // the plan select empty and asserted the required error, or that its id
  // chains into the trigger button's aria-describedby the same way the text
  // input's error does.
  test('shows the plan required error on blur and chains it into the trigger button aria-describedby', async ({
    page,
  }) => {
    const plan = page.getByRole('combobox', { name: 'Plan' });

    await test.step('Open and close the select without choosing an option, then blur', async () => {
      await plan.focus();
      await plan.press('ArrowDown');
      await expect(page.getByRole('option', { name: 'Starter' })).toBeVisible();
      await plan.press('Escape');
      await plan.press('Tab');
    });

    await test.step('The required error renders at #plan-error and is wired to the trigger', async () => {
      const error = page.locator('#plan-error');
      await expect(error).toContainText(/choose a plan/i);

      await expect(plan).toHaveAttribute('aria-describedby', /\bplan-error\b/);
      await expect(plan).toHaveAttribute('aria-invalid', 'true');
    });

    await test.step('Choosing a plan clears the error', async () => {
      await plan.press('ArrowDown');
      await page.getByRole('option', { name: 'Starter' }).click();

      await expect(page.locator('#plan-error')).toBeHidden();
      await expect(plan).not.toHaveAttribute('aria-invalid', 'true');
    });
  });

  // Regression coverage for #194 (b): the existing describedby test only
  // asserts the static attribute after page load. This exercises the
  // checkbox from the keyboard (a real <button role="checkbox">, so Space
  // toggles it natively) and confirms the hint stays wired across state
  // changes rather than only on first render.
  test('the newsletter checkbox is keyboard-toggleable and keeps its describedby link while doing so', async ({
    page,
  }) => {
    const checkbox = page.getByRole('checkbox', {
      name: 'Send me product updates',
    });

    await checkbox.focus();
    await expect(checkbox).not.toBeChecked();
    await expect(checkbox).toHaveAttribute(
      'aria-describedby',
      /\bnewsletter-hint\b/,
    );

    await test.step('Space checks it', async () => {
      await page.keyboard.press('Space');
      await expect(checkbox).toBeChecked();
      await expect(checkbox).toHaveAttribute(
        'aria-describedby',
        /\bnewsletter-hint\b/,
      );
    });

    await test.step('Space again unchecks it', async () => {
      await page.keyboard.press('Space');
      await expect(checkbox).not.toBeChecked();
      await expect(checkbox).toHaveAttribute(
        'aria-describedby',
        /\bnewsletter-hint\b/,
      );
    });
  });

  // Regression coverage for #194 (c): every existing interaction with the
  // plan select ends in a mouse `.click()` on the option. `BrnSelectTrigger`
  // hosts a real listbox `ActiveDescendantKeyManager` (arrow keys +
  // Enter-to-select) — this drives the whole flow without ever clicking.
  //
  // Kept to a single open/close cycle: reopening the select re-highlights
  // whichever item currently matches `value()` via an internal effect, which
  // races any manually-pressed arrow key right before a second `Enter` — so
  // this asserts one full open → navigate → commit pass instead of chaining
  // a reopen. Each ArrowDown press also waits for `[data-highlighted]` (the
  // keyManager's active-descendant marker, `BrnSelectItem`) to land on the
  // expected option before sending the next key — the highlight update is
  // driven by an effect, not synchronous with the keydown itself.
  test('the plan select is fully operable from the keyboard, never clicking an option', async ({
    page,
  }) => {
    const plan = page.getByRole('combobox', { name: 'Plan' });
    const starter = page.getByRole('option', { name: 'Starter' });
    const pro = page.getByRole('option', { name: 'Pro' });
    const enterprise = page.getByRole('option', { name: 'Enterprise' });

    await test.step('Open with ArrowDown — opening auto-highlights the first item (Starter)', async () => {
      await plan.focus();
      await plan.press('ArrowDown');
      await expect(starter).toHaveAttribute('data-highlighted', '');
    });

    await test.step('Arrow down twice more to Enterprise and commit with Enter', async () => {
      await plan.press('ArrowDown'); // Starter -> Pro
      await expect(pro).toHaveAttribute('data-highlighted', '');

      await plan.press('ArrowDown'); // Pro -> Enterprise
      await expect(enterprise).toHaveAttribute('data-highlighted', '');

      await plan.press('Enter');

      // BrnSelectValue's default itemToString renders the raw option value
      // (not the item's projected "Enterprise" label content) when no
      // custom itemToString is configured — the same value shown in the
      // submitted JSON payload elsewhere in this spec.
      await expect(plan).toHaveText('enterprise');
      await expect(page.getByRole('option')).toHaveCount(0);
    });
  });
});
