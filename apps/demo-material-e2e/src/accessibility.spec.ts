import { test } from '@playwright/test';

import { scanRoute } from '@ngx-signal-forms/a11y-testing';

/**
 * WCAG 2.2 AA accessibility audit for demo-material-e2e.
 *
 * Scans the app's home route with axe-core (WCAG 2.2 AA ruleset) in Chromium
 * and Firefox. Results are written to `dist/.a11y/demo-material-e2e/` and diffed
 * against `apps/demo-material-e2e/a11y-baseline.json` by the CI report step — new
 * violations open GitHub issues. The suite does not hard fail (themed demo
 * apps may inherit violations from their UI layer); the toolkit's own Vitest
 * browser specs are the hard WCAG gate.
 */
test.describe('demo-material-e2e — WCAG 2.2 AA accessibility', () => {
  test('home (/)', async ({ page }, testInfo) => {
    await scanRoute({ page, testInfo, app: 'demo-material-e2e', route: '/' });
  });
});
