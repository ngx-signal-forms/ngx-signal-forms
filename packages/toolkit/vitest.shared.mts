/// <reference types='vitest' />

import { resolve } from 'node:path';
import angular from '@analogjs/vite-plugin-angular';
import { type UserWorkspaceConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

process.env['NX_DAEMON'] ??= 'false';

export const toolkitSpecRoots =
  '{src,core,form-field,headless,assistive,testing,vest,scripts}';
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
    find: /^@ngx-signal-forms\/toolkit\/form-field$/,
    replacement: resolve(__dirname, 'form-field/index.ts'),
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
    find: /^@ngx-signal-forms\/toolkit\/testing$/,
    replacement: resolve(__dirname, 'testing/index.ts'),
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
  plugins: [angular(), tsconfigPaths()],
  resolve: {
    // The tsconfig paths plugin resolves the package tsconfig first during Vitest runs.
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
    maxConcurrency: process.env['CI'] === 'true' ? 2 : 5,
    maxWorkers: process.env['CI'] === 'true' ? 2 : undefined,
    ...sharedProjectTestConfig,
    // Coverage is intentionally absent here. Vitest treats `coverage` as a
    // root-only option and silently ignores it in a project config, so the
    // merged settings live in `vitest.coverage.config.mts` at the workspace
    // root. See https://vitest.dev/guide/projects.html#unsupported-options
  } satisfies NonNullable<UserWorkspaceConfig['test']>,
  define: {
    'import.meta.vitest': true,
  },
} satisfies UserWorkspaceConfig;
