import type { Page } from '@playwright/test';

const LAYOUT_SNAPSHOT_VIEWPORT = {
  width: 1280,
  height: 2200,
} as const;

export async function stabilizeLayoutSnapshotViewport(
  page: Page,
): Promise<void> {
  await page.setViewportSize(LAYOUT_SNAPSHOT_VIEWPORT);
}
