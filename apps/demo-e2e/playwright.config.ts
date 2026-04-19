import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] ?? 'http://localhost:4200';
const isCI = Boolean(process.env['CI']);

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const preset = nxE2EPreset(__filename, { testDir: './src' });

export default defineConfig({
  ...preset,
  updateSnapshots: isCI ? 'none' : 'missing',
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  expect: {
    toMatchAriaSnapshot: {
      children: 'contain',
      pathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
    },
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      // Tolerance for cross-platform rendering drift. Baselines are
      // generated on macOS and replayed on Linux CI; Chromium's font
      // metrics and subpixel rendering can shift element height by ~1px
      // between OSes (a single height-row delta typically lands in the
      // 3-4% range for a form-shaped image). 5% is a tight upper bound
      // that still catches real layout regressions — anything above this
      // is a structural change, not a rendering artifact.
      maxDiffPixelRatio: 0.05,
      pathTemplate:
        '{testDir}/__screenshots__{/projectName}/{testFilePath}/{arg}{ext}',
    },
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    ...preset.use,
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm nx serve demo',
    url: 'http://localhost:4200',
    reuseExistingServer: !isCI,
    cwd: workspaceRoot,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
