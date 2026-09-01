/// <reference types='vitest' />

import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

process.env['NX_DAEMON'] ??= 'false';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/packages/demo/debugger',
  plugins: [angular(), tsconfigPaths()],
  optimizeDeps: {
    include: [
      '@analogjs/vitest-angular/setup-serializers',
      '@analogjs/vitest-angular/setup-snapshots',
      '@angular/compiler',
      '@angular/platform-browser/testing',
      '@testing-library/jest-dom/vitest',
    ],
  },
  test: {
    name: 'debugger',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    pool: 'forks',
    maxConcurrency: process.env['CI'] === 'true' ? 2 : 5,
    maxWorkers: process.env['CI'] === 'true' ? 2 : undefined,
  },
});
