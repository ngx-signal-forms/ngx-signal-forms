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

  test('keeps comparison wrappers present and accessible across appearance/orientation variants', async () => {
    await expect(page.comparisonSection).toBeVisible();
    await expect(page.comparisonLabelledWrapper).toBeVisible();
    await expect(page.comparisonLabellessWrapper).toBeVisible();

    const standardHeights = await Promise.all([
      page.comparisonLabelledWrapper.evaluate((el) =>
        Math.round((el as HTMLElement).offsetHeight),
      ),
      page.comparisonLabellessWrapper.evaluate((el) =>
        Math.round((el as HTMLElement).offsetHeight),
      ),
    ]);
    expect(standardHeights[0]).toBeGreaterThan(standardHeights[1]);

    await page.horizontalOrientationButton.click();
    await expect(page.comparisonSection).toBeVisible();

    const horizontalOffset = await page.comparisonLabellessWrapper.evaluate(
      (el) => {
        const wrapperRect = el.getBoundingClientRect();
        const input = el.querySelector('input');
        const inputRect = input?.getBoundingClientRect();

        return inputRect ? inputRect.left - wrapperRect.left : null;
      },
    );

    expect(horizontalOffset).not.toBeNull();
    expect(horizontalOffset ?? 0).toBeLessThan(64);

    await page.outlineAppearanceButton.click();
    await expect(page.comparisonSection).toBeVisible();
    await expect(page.outlineAppearanceButton).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const outlineHeights = await Promise.all([
      page.comparisonLabelledWrapper.evaluate((el) =>
        Math.round((el as HTMLElement).offsetHeight),
      ),
      page.comparisonLabellessWrapper.evaluate((el) =>
        Math.round((el as HTMLElement).offsetHeight),
      ),
    ]);
    expect(outlineHeights[0]).toBeGreaterThanOrEqual(outlineHeights[1]);

    await page.ageInput.fill('5');
    await page.ageInput.blur();
    await expect(page.form.getByText('Must be 18 or older')).toBeVisible();
    await expect(page.narrowInputsSection).toBeVisible();
  });
});
