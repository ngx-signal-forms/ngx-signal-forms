/// <reference types='vitest' />

import { resolve } from 'node:path';
import angular from '@analogjs/vite-plugin-angular';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { type UserWorkspaceConfig } from 'vitest/config';

process.env.NX_DAEMON ??= 'false';

export const toolkitSpecRoots =
  '{src,core,form-field,headless,assistive,testing,debugger,vest}';
export const toolkitSpecFiles = `${toolkitSpecRoots}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`;
export const toolkitBrowserSpecFiles = `${toolkitSpecRoots}/**/*.browser.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`;

export const toolkitEntryAliases = [
  {
    find: /^@ngx-signal-forms\/toolkit\/assistive$/,
    replacement: resolve(__dirname, 'assistive/index.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit\/core$/,
    replacement: resolve(__dirname, 'core/index.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit\/debugger$/,
    replacement: resolve(__dirname, 'debugger/index.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit\/form-field$/,
    replacement: resolve(__dirname, 'form-field/public_api.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit\/headless$/,
    replacement: resolve(__dirname, 'headless/src/index.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit\/vest$/,
    replacement: resolve(__dirname, 'vest/src/index.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit$/,
    replacement: resolve(__dirname, 'index.ts'),
  },
];

const sharedProjectTestConfig = {
  alias: toolkitEntryAliases,
  globals: true,
  reporters: ['default'],
};

export const toolkitSharedConfig = {
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/toolkit',
  plugins: [angular(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  resolve: {
    // Nx's ts-paths plugin resolves the package tsconfig first during Vitest runs.
    // These explicit self-import aliases keep toolkit secondary entrypoints stable.
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
    maxConcurrency: process.env.CI ? 2 : 5,
    maxWorkers: process.env.CI ? 2 : undefined,
    ...sharedProjectTestConfig,
  } satisfies NonNullable<UserWorkspaceConfig['test']>,
  define: {
    'import.meta.vitest': true,
  },
} satisfies UserWorkspaceConfig;
