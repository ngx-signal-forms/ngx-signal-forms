import { test } from '@playwright/test';

import { scanRoute } from '@ngx-signal-forms/a11y-testing';

/**
 * WCAG 2.2 AA accessibility audit for demo-spartan-e2e.
 *
 * Scans the single-page app's home route (`/`) with axe-core (WCAG 2.2 AA
 * ruleset) in Chromium and Firefox. Results are written to
 * `dist/.a11y/demo-spartan-e2e/` and diffed against
 * `apps/demo-spartan-e2e/a11y-baseline.json` by the CI report step — pull
 * requests fail on any new violation not in the baseline, and scans on `main`
 * open GitHub issues (ADR-0013). The toolkit's own Vitest browser specs are
 * the zero-violation WCAG gate.
 */
test.describe('demo-spartan-e2e — WCAG 2.2 AA accessibility', () => {
  test('home (/)', async ({ page }, testInfo) => {
    await scanRoute({ page, testInfo, app: 'demo-spartan-e2e', route: '/' });
  });
});
