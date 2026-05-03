import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['BASE_URL'] ?? 'http://localhost:4201';
const isCI = Boolean(process.env['CI']);

const preset = nxE2EPreset(__filename, { testDir: './src' });

export default defineConfig({
  ...preset,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    ...preset.use,
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // The demo-material app reuses the toolkit demo's harness; serving it
    // straight via Vite (port 4201) keeps the spec deterministic without
    // touching the main demo's webServer (port 4200).
    command: 'pnpm nx serve demo-material',
    url: 'http://localhost:4201',
    reuseExistingServer: !isCI,
    cwd: workspaceRoot,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
