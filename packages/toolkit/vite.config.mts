/// <reference types='vitest' />
import angular from '@analogjs/vite-plugin-angular';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/toolkit',
  plugins: [angular(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  test: {
    name: 'toolkit',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: [
      '{src,core,form-field,testing}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    setupFiles: ['./test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/toolkit',
      provider: 'v8' as const,
    },
    browser: {
      enabled: true,
      provider: playwright({
        launchOptions: {
          headless: true,
        },
      }),
      instances: [
        {
          name: 'toolkit-chrome',
          browser: 'chromium',
        },
      ],
      // Hide Vite's error overlay element in Vitest Browser runner to avoid click interception
      scripts: [
        {
          id: 'disable-vite-error-overlay.js',
          content: `
            try {
              const style = document.createElement('style');
              style.textContent = 'vite-error-overlay { display: none !important; pointer-events: none !important; }';
              document.head.appendChild(style);
              const overlay = document.querySelector('vite-error-overlay');
              if (overlay && overlay.style) {
                overlay.style.display = 'none';
                overlay.style.pointerEvents = 'none';
              }
            } catch (e) {
              // ignore
            }
          `,
        },
      ],
    },
    /**
     * Test isolation configuration for Angular projects
     *
     * **Why isolation is disabled:**
     * Per Marmicode's guidance, Angular's TestBed provides sufficient isolation
     * for test files. TestBed.resetTestingModule() (called in global afterEach)
     * ensures proper cleanup between tests.
     *
     * Disabling Vitest's isolation improves performance significantly:
     * - Faster test execution (no VM/thread overhead per file)
     * - Lower memory usage
     * - Still maintains proper test independence via TestBed
     *
     * This is the same pattern used with Karma, which ran all tests in a
     * single browser window successfully.
     *
     * @see https://cookbook.marmicode.io/angular/testing/why-vitest#vitest-isolation-modes
     */
    isolate: false,
    // Optimize for CI performance
    maxConcurrency: process.env['CI'] ? 2 : 5,
    maxWorkers: process.env['CI'] ? 2 : undefined,
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
}));
