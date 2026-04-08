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
      screenshotDirectory: '__screenshots__',
      screenshotFailures: true,
      instances: [
        {
          browser: 'chromium',
          viewport: { width: 1280, height: 720 },
        },
      ],
      expect: {
        toMatchScreenshot: {
          comparatorName: 'pixelmatch',
          comparatorOptions: {
            threshold: 0.2,
            allowedMismatchedPixelRatio: 0.01,
          },
        },
      },
    },
  },
});
