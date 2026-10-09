/// <reference types='vitest' />

import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import type { BrowserCommand } from 'vitest/node';
import {
  toolkitBrowserSpecFiles,
  toolkitReporters,
  toolkitSharedConfig,
} from './vitest.shared.mts';

/**
 * Sets the emulated OS color scheme (`prefers-color-scheme`) for the test
 * page. `'reset'` clears the emulation (`test-setup.browser.ts` sends it for a
 * `null` argument, which Vitest 5.0.3 cannot pass to a command). Vitest's
 * `page` API has no media emulation, so specs call this through
 * `commands.emulateColorScheme(...)`. It runs in Node, where the Playwright
 * page is available.
 */
const emulateColorScheme: BrowserCommand<['light' | 'dark' | 'reset']> = async (
  context,
  colorScheme,
) => {
  await context.page.emulateMedia({
    colorScheme: colorScheme === 'reset' ? null : colorScheme,
  });
};

/**
 * Sets the emulated `forced-colors` media feature. `'reset'` clears the
 * emulation. Same rationale as {@link emulateColorScheme}: Vitest's `page`
 * API has no media emulation of its own.
 */
const emulateForcedColors: BrowserCommand<
  ['active' | 'none' | 'reset']
> = async (context, forcedColors) => {
  await context.page.emulateMedia({
    forcedColors: forcedColors === 'reset' ? null : forcedColors,
  });
};

/**
 * Sets the emulated `prefers-reduced-motion` media feature. `'reset'` clears
 * the emulation.
 */
const emulateReducedMotion: BrowserCommand<
  ['reduce' | 'no-preference' | 'reset']
> = async (context, reducedMotion) => {
  await context.page.emulateMedia({
    reducedMotion: reducedMotion === 'reset' ? null : reducedMotion,
  });
};

export default defineConfig({
  ...toolkitSharedConfig,
  test: {
    ...toolkitSharedConfig.test,
    name: 'toolkit-browser',
    reporters: toolkitReporters('browser'),
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
      // Experimental. The traces are embedded in the CI `html` report.
      traceView: Boolean(process.env.CI),
      screenshotFailures: true,
      locators: {
        errorFormat: 'aria',
      },
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
