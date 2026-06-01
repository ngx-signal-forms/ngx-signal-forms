/// <reference types='vitest' />

import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/demo',
  plugins: [angular({ tsconfig: './tsconfig.spec.json' }), nxViteTsPaths()],
  optimizeDeps: {
    include: [
      '@analogjs/vitest-angular/setup-serializers',
      '@analogjs/vitest-angular/setup-snapshots',
      '@angular/compiler',
      '@angular/platform-browser/testing',
    ],
  },
  test: {
    name: 'demo',
    globals: true,
    setupFiles: ['./test-setup.ts'],
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    /**
     * Angular TestBed stays most predictable when specs run in isolated forks.
     */
    pool: 'forks',
  },
  define: {
    'import.meta.vitest': true,
  },
});
