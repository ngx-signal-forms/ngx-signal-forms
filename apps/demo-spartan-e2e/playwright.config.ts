import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';

// Socket Firewall (sfw) and similar wrappers inject http_proxy into child
// processes; without NO_PROXY the webServer availability poll to 127.0.0.1 is
// routed through that proxy (which answers 405) and never sees the dev server.
process.env['NO_PROXY'] ??= 'localhost,127.0.0.1';

const baseURL = process.env['BASE_URL'] ?? 'http://127.0.0.1:4621';
const isCI = Boolean(process.env['CI']);

const preset = nxE2EPreset(__filename, { testDir: './src' });

export default defineConfig({
  ...preset,
  // The dedicated `a11y` target owns src/accessibility.spec.ts; keep it out of
  // the functional e2e run. The slash anchor avoids matching any other
  // *-accessibility.spec.ts files.
  testIgnore: /[\\/]accessibility\.spec\.ts$/,
  updateSnapshots: isCI ? 'none' : 'missing',
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
    command: 'pnpm nx serve demo-spartan',
    url: 'http://127.0.0.1:4621',
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
