/// <reference types='vitest' />
import angular from '@analogjs/vite-plugin-angular';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
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
      '{src,core,form-field,headless,testing}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    setupFiles: ['./test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/toolkit',
      provider: 'v8' as const,
    },
    /**
     * Pool configuration for Angular + Vitest 4
     *
     * Using 'forks' pool with full isolation for Angular TestBed compatibility.
     * Each test file runs in a true subprocess ensuring TestBed is properly
     * initialized fresh for each file.
     *
     * @see https://vitest.dev/config/#pool
     */
    pool: 'forks',
    // Optimize for CI performance
    maxConcurrency: process.env['CI'] ? 2 : 5,
    maxWorkers: process.env['CI'] ? 2 : undefined,
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
}));
