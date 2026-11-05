/// <reference types='vitest' />

import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/demo-spartan',
  plugins: [
    angular({
      tsconfig: './tsconfig.spec.json',
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'demo-spartan',
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
    reporters: ['default'],
  },
});
