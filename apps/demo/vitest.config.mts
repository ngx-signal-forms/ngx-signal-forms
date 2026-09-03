/// <reference types='vitest' />

import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/demo',
  plugins: [angular({ tsconfig: './tsconfig.spec.json' }), tsconfigPaths()],
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
    /**
     * The custom-control specs drive `userEvent.type()` keystroke by keystroke
     * through a full demo form, so each render pass is real work. That stays
     * near 2s on a developer machine but crosses the 5s default on shared CI
     * runners, which made the legacy-datepicker spec flake.
     */
    testTimeout: 20_000,
  },
});
