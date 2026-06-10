import { defineConfig, devices } from '@playwright/test';

import baseConfig from './playwright.config';

/**
 * Accessibility scan config for demo-e2e.
 *
 * Reuses the base config's `webServer` and shared `use` options but runs only
 * `accessibility.spec.ts`, which performs WCAG 2.2 AA axe audits across every
 * demo route in both Chromium and Firefox. No visual baselines are involved,
 * so neither project ignores specs. Wired to the `a11y` Nx target and the CI
 * `a11y` job; see tools/scripts/a11y-report-violations.mjs for the
 * baseline-diff + auto-issue step that consumes the results.
 */
export default defineConfig({
  ...baseConfig,
  testIgnore: undefined,
  // Anchored on a path separator so it matches src/accessibility.spec.ts only,
  // not the existing forms/**/*-accessibility.spec.ts behavioral specs.
  testMatch: /[\\/]accessibility\.spec\.ts$/,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
