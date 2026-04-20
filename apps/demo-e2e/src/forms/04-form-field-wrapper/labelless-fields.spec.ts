import { expect, test } from '@playwright/test';
import { LabellessFieldsPage } from '../../page-objects/labelless-fields.page';

test.describe('Labelless Form Fields', () => {
  let page: LabellessFieldsPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new LabellessFieldsPage(playwrightPage);
    await page.goto();
  });

  test('hides the label slot when no <label> is projected (standard)', async () => {
    const labelSlot = page.labellessSearchWrapper.locator(
      '.ngx-signal-form-field-wrapper__label',
    );

    const display = await labelSlot.evaluate(
      (el) => getComputedStyle(el).display,
    );

    expect(display).toBe('none');
  });

  test('outline appearance shrinks when label is absent', async () => {
    await page.outlineAppearanceButton.click();

    // Amount wrapper is labelless outline; compare it to the labelled
    // comparison wrapper (also outline once the toggle is set).
    const labellessHeight = await page.comparisonLabellessWrapper.evaluate(
      (el) => (el as HTMLElement).offsetHeight,
    );
    const labelledHeight = await page.comparisonLabelledWrapper.evaluate(
      (el) => (el as HTMLElement).offsetHeight,
    );

    // Labelled must be taller — at least the label's line-height worth.
    expect(labelledHeight).toBeGreaterThan(labellessHeight + 8);
  });

  test('horizontal orientation collapses the label column', async () => {
    await page.horizontalOrientationButton.click();

    const { wrapperLeft, inputLeft } =
      await page.labellessSearchWrapper.evaluate((el) => {
        const wrapperRect = el.getBoundingClientRect();
        const input = el.querySelector('input') as HTMLInputElement;
        const inputRect = input.getBoundingClientRect();
        return {
          wrapperLeft: wrapperRect.left,
          inputLeft: inputRect.left,
        };
      });

    // Prefix icon is 16px + padding; input should still start within
    // a tight offset of the wrapper — nothing like an 8rem reserved
    // label column (128px).
    expect(inputLeft - wrapperLeft).toBeLessThan(64);
  });

  test('errors render wider than narrow inputs', async () => {
    // Trigger the age error (below min).
    await page.ageInput.fill('5');
    await page.ageInput.blur();

    const ageError = page.form.getByText('Must be 18 or older');
    await expect(ageError).toBeVisible();

    const { errorWidth, inputWidth, scrollWidth, clientWidth } =
      await ageError.evaluate((el) => {
        const input = document.querySelector('#age') as HTMLInputElement;
        return {
          errorWidth: el.getBoundingClientRect().width,
          inputWidth: input.getBoundingClientRect().width,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        };
      });

    // Input constrained to 5ch (~50px). Error must be wider.
    expect(errorWidth).toBeGreaterThan(inputWidth);
    // And the error must not overflow its own box (no clipping).
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('snapshot: comparison grid and narrow inputs', async () => {
    // Settle layout by focusing then blurring the age input with an
    // invalid value so the narrow-input error is visible in the shot.
    await page.ageInput.fill('5');
    await page.ageInput.blur();

    await expect(
      page.form.locator('.labelless-section').nth(3),
    ).toHaveScreenshot('labelless-comparison-grid.png');
    await expect(
      page.form.locator('.labelless-section').nth(4),
    ).toHaveScreenshot('labelless-narrow-inputs.png');
  });
});
