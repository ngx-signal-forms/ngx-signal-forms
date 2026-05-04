/// <reference types='vitest' />

import { resolve } from 'node:path';
import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vitest/config';

const toolkitRoot = resolve(__dirname, '../../packages/toolkit');

const toolkitEntryAliases = [
  {
    find: /^@ngx-signal-forms\/toolkit\/assistive$/,
    replacement: resolve(toolkitRoot, 'assistive/index.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit\/core$/,
    replacement: resolve(toolkitRoot, 'core/index.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit\/form-field$/,
    replacement: resolve(toolkitRoot, 'form-field/index.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit\/headless$/,
    replacement: resolve(toolkitRoot, 'headless/src/index.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit$/,
    replacement: resolve(toolkitRoot, 'index.ts'),
  },
];

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/demo-primeng',
  plugins: [
    angular({
      tsconfig: resolve(__dirname, 'tsconfig.spec.json'),
    }),
    nxViteTsPaths(),
  ],
  resolve: {
    alias: toolkitEntryAliases,
  },
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
    name: 'demo-primeng',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    pool: 'forks',
    reporters: ['default'],
  },
});
