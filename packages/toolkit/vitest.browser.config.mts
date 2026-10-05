/// <reference types='vitest' />

import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import type { BrowserCommand } from 'vitest/node';
import {
  toolkitBrowserSpecFiles,
  toolkitSharedConfig,
} from './vitest.shared.mts';

/**
 * Sets the emulated OS color scheme (`prefers-color-scheme`) for the test
 * page. `null` clears the emulation. Vitest's `page` API has no media emulation, so specs call this
 * through `commands.emulateColorScheme(...)`. It runs in Node, where the
 * Playwright page is available.
 */
const emulateColorScheme: BrowserCommand<['light' | 'dark' | null]> = async (
  context,
  colorScheme,
) => {
  await context.page.emulateMedia({ colorScheme });
};

/**
 * Sets the emulated `forced-colors` media feature. `null` clears the
 * emulation. Same rationale as {@link emulateColorScheme}: Vitest's `page`
 * API has no media emulation of its own.
 */
const emulateForcedColors: BrowserCommand<['active' | 'none' | null]> = async (
  context,
  forcedColors,
) => {
  await context.page.emulateMedia({ forcedColors });
};

/**
 * Sets the emulated `prefers-reduced-motion` media feature. `null` clears
 * the emulation.
 */
const emulateReducedMotion: BrowserCommand<
  ['reduce' | 'no-preference' | null]
> = async (context, reducedMotion) => {
  await context.page.emulateMedia({ reducedMotion });
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
      provider: playwright({
        launchOptions: {
          channel: process.env['PLAYWRIGHT_BROWSER_CHANNEL'],
        },
      }),
      headless: Boolean(process.env.CI),
      screenshotDirectory: '__screenshots__',
      screenshotFailures: true,
      commands: {
        emulateColorScheme,
        emulateForcedColors,
        emulateReducedMotion,
      },
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
