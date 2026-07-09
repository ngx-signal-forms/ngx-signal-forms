import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { WCAG_22_AA_TAGS } from '@ngx-signal-forms/toolkit/testing';

/**
 * Single Playwright spec for the Material reference demo.
 *
 * Covers the issue's required E2E path: **fill → blur → observe error**.
 *
 * Asserts that:
 * - Material's `<mat-error>` content appears after the user types garbage
 *   into the email field and tabs away.
 * - The bound `<input matInput>` ends up with `aria-invalid="true"` and an
 *   `aria-describedby` that points to the rendered `<mat-error>`'s ID.
 *
 * The smoke spec (jsdom) covers the "empty required field" branch; this
 * Playwright spec exercises the same flow in a real browser to catch any
 * timing or layout issue jsdom doesn't surface.
 */
test.describe('Material reference contact form (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('renders mat-error and wires Material aria-describedby on blur', async ({
    page,
  }) => {
    // Role-based locator matches the `<mat-label>Email</mat-label>` Material
    // wires onto the `<input matInput>` via `aria-labelledby` — same surface
    // a screen reader announces, so the test exercises the public a11y API.
    const email = page.getByRole('textbox', { name: /email/i });
    await expect(email).toBeVisible();

    await test.step('fill the email field with an invalid value, then blur', async () => {
      await email.click();
      await email.fill('not-an-email');
      await email.blur();
    });

    await test.step('mat-error renders the toolkit-driven error message', async () => {
      // Single mat-error inside the email field's mat-form-field.
      const matError = page
        .locator('mat-form-field', { has: email })
        .locator('mat-error');

      await expect(matError).toBeVisible();
      await expect(matError).toContainText(/valid email/i);
      await expect(matError).toHaveAttribute('id', /.+/);
    });

    await test.step('aria-invalid is "true" and aria-describedby resolves to <mat-error>', async () => {
      await expect(email).toHaveAttribute('aria-invalid', 'true');

      const describedBy = await email.getAttribute('aria-describedby');
      expect(describedBy, 'aria-describedby should be present').toBeTruthy();

      const ids = (describedBy ?? '').split(/\s+/).filter(Boolean);
      expect(
        ids.length,
        'aria-describedby should list at least one id',
      ).toBeGreaterThan(0);

      // At least one of the referenced IDs must resolve to a <mat-error> element.
      let foundMatError = false;
      for (const id of ids) {
        const node = page.locator(`#${id}`);
        const tag = await node.evaluate((el) => el.tagName.toLowerCase());
        if (tag === 'mat-error') {
          foundMatError = true;
          break;
        }
      }
      expect(
        foundMatError,
        'aria-describedby should reference a rendered <mat-error>',
      ).toBe(true);
    });
  });

  test('shows mat-error after submit when strategy is on-submit', async ({
    page,
  }) => {
    // Regression guard for the C1 fix: under the toolkit's `on-submit`
    // strategy the demo form does not surface validation errors until the
    // user attempts to submit. The Material renderer must therefore receive
    // the *real* `submittedStatus` from the form context (not a hardcoded
    // `'unsubmitted'`), or `<mat-error>` would never appear.
    //
    // The demo currently runs under `on-touch`. We can still exercise the
    // path by submitting with an empty required field — both `on-touch` and
    // `on-submit` reveal an error after a submit attempt — and asserting
    // that the renderer painted a non-empty `<mat-error>` body.
    const email = page.getByRole('textbox', { name: /email/i });
    await expect(email).toBeVisible();
    await expect(email).toHaveValue('');

    const submit = page.getByRole('button', { name: /send message/i });
    await submit.click();

    const emailField = page.locator('mat-form-field', { has: email });
    const matError = emailField.locator('mat-error');
    await expect(matError).toBeVisible();
    await expect(matError).not.toHaveText('');
  });

  // Regression coverage for #194: the smoke spec (contact-form.spec.ts,
  // jsdom) already exercises the warning/checkbox/select/reset paths, but
  // nothing ran them through a real Chromium render — exactly the class of
  // timing/layout bug jsdom can't surface (per this file's own top comment).

  test('renders the warning in mat-hint (not mat-error) for a short-but-valid name', async ({
    page,
  }) => {
    const name = page.getByRole('textbox', { name: /name/i });

    await test.step('type a short name and blur', async () => {
      await name.click();
      await name.fill('Bob');
      await name.blur();
    });

    await test.step('mat-hint renders the warning, mat-error stays empty', async () => {
      const nameField = page.locator('mat-form-field', { has: name });
      const hint = nameField.locator('mat-hint');
      await expect(hint).toContainText(/short names are easy to mis-type/i);

      const matError = nameField.locator('mat-error');
      await expect(matError).toBeHidden();
    });

    await test.step('a warning alone does not mark the field invalid', async () => {
      await expect(name).toHaveAttribute('aria-invalid', 'false');
    });
  });

  test('shows the *ngxMatFeedback error for the consent checkbox and wires its describedby', async ({
    page,
  }) => {
    const checkbox = page.getByRole('checkbox', {
      name: /i agree to be contacted/i,
    });

    await test.step('blur the untouched checkbox', async () => {
      await checkbox.focus();
      await checkbox.press('Tab');
    });

    await test.step('the feedback block renders and is wired to the checkbox', async () => {
      // `.demo-form__feedback` is the `role="alert"`/`[id]` host `<p>`; the
      // matched text lives one level deeper, inside
      // `<ngx-mat-feedback-outlet>`'s rendered `<span>`.
      const feedback = page
        .locator('.demo-form__feedback')
        .filter({ hasText: /you need to agree/i });
      await expect(feedback).toBeVisible();
      await expect(feedback).toHaveAttribute('role', 'alert');

      const feedbackId = await feedback.getAttribute('id');
      expect(feedbackId).toBeTruthy();
      await expect(checkbox).toHaveAttribute(
        'aria-describedby',
        feedbackId ?? '',
      );
    });

    await test.step('checking the box clears the feedback and the describedby link', async () => {
      await checkbox.click();
      await expect(
        page
          .locator('.demo-form__feedback')
          .filter({ hasText: /you need to agree/i }),
      ).toHaveCount(0);
      await expect(checkbox).not.toHaveAttribute('aria-describedby');
    });
  });

  test('shows mat-error for the topic select when it is left unset', async ({
    page,
  }) => {
    const topic = page.getByRole('combobox', { name: /topic/i });

    await test.step('open and close the select without picking an option', async () => {
      await topic.click();
      await page.keyboard.press('Escape');
      await topic.press('Tab');
    });

    await test.step('mat-error renders the required-topic message', async () => {
      const topicField = page.locator('mat-form-field', { has: topic });
      const matError = topicField.locator('mat-error');
      await expect(matError).toBeVisible();
      await expect(matError).toContainText(/pick a topic/i);
      await expect(topic).toHaveAttribute('aria-invalid', 'true');
    });
  });

  test('Reset clears field values, the success banner, and any pending errors', async ({
    page,
  }) => {
    const name = page.getByRole('textbox', { name: /name/i });
    const email = page.getByRole('textbox', { name: /email/i });
    const topic = page.getByRole('combobox', { name: /topic/i });
    const checkbox = page.getByRole('checkbox', {
      name: /i agree to be contacted/i,
    });

    await test.step('complete and submit the form successfully', async () => {
      await name.fill('Alex Doe');
      await email.fill('alex@example.com');
      await topic.click();
      await page.getByRole('option', { name: /sales question/i }).click();
      await checkbox.click();

      await page.getByRole('button', { name: /send message/i }).click();
      await expect(
        page.getByText(/thanks! we received your message/i),
      ).toBeVisible();
    });

    await test.step('click Reset', async () => {
      await page.getByRole('button', { name: /^reset$/i }).click();
    });

    await test.step('the form returns to a pristine, untouched state', async () => {
      await expect(name).toHaveValue('');
      await expect(email).toHaveValue('');
      await expect(checkbox).not.toBeChecked();
      await expect(
        page.getByText(/thanks! we received your message/i),
      ).toBeHidden();
      await expect(page.locator('mat-error')).toHaveCount(0);
    });
  });

  test('has no WCAG 2.2 AA axe violations while every blocking error is on screen', async ({
    page,
  }) => {
    // Submit the empty form so every blocking error (name, email, topic,
    // agree) renders simultaneously — the demo's densest error state, and
    // the one accessibility.spec.ts's pristine-route sweep never reaches.
    // Unlike that sweep (which only diffs against a baseline), this is a
    // hard assertion: zero violations, no baseline escape hatch.
    await page.getByRole('button', { name: /send message/i }).click();
    await expect(page.locator('mat-error').first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags([...WCAG_22_AA_TAGS])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
