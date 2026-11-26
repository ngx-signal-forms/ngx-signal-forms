import { join } from 'node:path';
import { workspaceRoot } from '@nx/devkit';
import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4700/ngx-signal-forms/';

export default defineConfig({
  testDir: './production',
  outputDir: '../../dist/.playwright/apps/demo-e2e-production',
  use: { ...devices['Desktop Chrome'], baseURL },
  webServer: {
    command: 'pnpm exec vite preview --strictPort --base=/ngx-signal-forms/',
    url: baseURL,
    cwd: join(workspaceRoot, 'apps/demo'),
    timeout: 60_000,
  },
});
