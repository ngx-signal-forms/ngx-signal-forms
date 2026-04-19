import { expect, Locator } from '@playwright/test';

export interface VisualBaselineDimensions {
  readonly width: number;
  readonly height: number;
}

/**
 * Compare a locator to a visual baseline with a deterministic capture size.
 *
 * Baselines are generated on macOS and replayed on Linux CI Chromium. Subpixel
 * text rendering and font-metric differences can shift the rendered height of
 * a form-shaped element by ~1 px between OSes, which trips Playwright's
 * dimension-mismatch guard before the global `maxDiffPixelRatio: 0.05`
 * tolerance has a chance to absorb it.
 *
 * `clip` is NOT supported on `expect(locator).toHaveScreenshot(...)` (only on
 * the `expect(page)` variant), so we can't use it to shrink the capture. The
 * reliable workaround is to lock the locator's element to the baseline's
 * exact dimensions via an inline style override before the capture. With
 * dimensions pinned, the comparison proceeds and `maxDiffPixelRatio`
 * absorbs pixel-level drift inside the clipped area.
 *
 * Pass the baseline's intrinsic pixel dimensions (width × height) — they
 * must match the committed PNG exactly.
 *
 * Caveat: this pins the element for the remainder of the test. Call it as
 * the final step of the test (or the step that immediately precedes
 * teardown), not before assertions that depend on the element's natural size.
 */
export async function matchesVisualBaseline(
  locator: Locator,
  snapshotName: string,
  dimensions: VisualBaselineDimensions,
): Promise<void> {
  await locator.evaluate((element, { width, height }) => {
    const el = element as HTMLElement;
    el.style.setProperty('width', `${width}px`, 'important');
    el.style.setProperty('height', `${height}px`, 'important');
    el.style.setProperty('overflow', 'hidden', 'important');
  }, dimensions);
  await expect(locator).toHaveScreenshot(snapshotName);
}
