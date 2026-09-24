/// <reference types='vitest' />

import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import type { BrowserCommand } from 'vitest/node';
import {
  toolkitBrowserSpecFiles,
  toolkitSharedConfig,
} from './vitest.shared.mts';

/**
 * Sets the emulated OS colour scheme (`prefers-color-scheme`) for the test
 * page. Vitest's `page` API has no media emulation, so specs call this
 * through `commands.emulateColorScheme(...)`. It runs in Node, where the
 * Playwright page is available.
 */
const emulateColorScheme: BrowserCommand<['light' | 'dark']> = async (
  context,
  colorScheme,
) => {
  await context.page.emulateMedia({ colorScheme });
};

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
      commands: { emulateColorScheme },
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
