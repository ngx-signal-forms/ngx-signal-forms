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
 * tolerance has a chance to absorb it. Locking the capture to the baseline's
 * exact size via `clip` keeps dimension comparison deterministic and lets the
 * configured pixel-ratio threshold do its job on content drift.
 *
 * Pass the baseline's intrinsic pixel dimensions (width × height) — they must
 * match the committed PNG exactly, otherwise Playwright will still fail on
 * dimension mismatch.
 */
export async function matchesVisualBaseline(
  locator: Locator,
  snapshotName: string,
  dimensions: VisualBaselineDimensions,
): Promise<void> {
  await expect(locator).toHaveScreenshot(snapshotName, {
    clip: { x: 0, y: 0, width: dimensions.width, height: dimensions.height },
  });
}
