/// <reference types='vitest' />

import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import {
  toolkitBrowserSpecFiles,
  toolkitSharedConfig,
} from './vitest.shared.mts';

export default defineConfig({
  ...toolkitSharedConfig,
  test: {
    ...toolkitSharedConfig.test,
    name: 'toolkit-browser',
    setupFiles: ['./test-setup.browser.ts'],
    include: [toolkitBrowserSpecFiles],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: Boolean(process.env.CI),
      instances: [{ browser: 'chromium' }],
    },
  },
});
