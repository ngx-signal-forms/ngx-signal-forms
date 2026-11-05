/// <reference types='vitest' />

import { resolve } from 'node:path';
import angular from '@analogjs/vite-plugin-angular';
import { type UserWorkspaceConfig } from 'vitest/config';

process.env['NX_DAEMON'] ??= 'false';

export const toolkitSpecRoots =
  '{src,core,form-field,headless,assistive,testing,vest,scripts}';
export const toolkitSpecFiles = `${toolkitSpecRoots}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`;
export const toolkitBrowserSpecFiles = `${toolkitSpecRoots}/**/*.browser.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`;

export const toolkitEntryAliases = [
  {
    find: /^@ngx-signal-forms\/toolkit\/assistive$/,
    replacement: resolve(import.meta.dirname, 'assistive/index.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit\/core$/,
    replacement: resolve(import.meta.dirname, 'core/index.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit\/form-field$/,
    replacement: resolve(import.meta.dirname, 'form-field/index.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit\/headless$/,
    replacement: resolve(import.meta.dirname, 'headless/src/index.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit\/vest$/,
    replacement: resolve(import.meta.dirname, 'vest/src/index.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit\/testing$/,
    replacement: resolve(import.meta.dirname, 'testing/index.ts'),
  },
  {
    find: /^@ngx-signal-forms\/toolkit$/,
    replacement: resolve(import.meta.dirname, 'index.ts'),
  },
];

/**
 * Reporters for one toolkit Vitest run. CI adds a self-contained HTML report
 * under `.vitest/report-<run>/`. Each run gets its own directory so the jsdom
 * and browser runs do not overwrite each other's `index.html`.
 */
export const toolkitReporters = (run: string) =>
  process.env['CI'] === 'true'
    ? [
        'default',
        ['html', { singleFile: true, outputDir: `.vitest/report-${run}` }],
      ]
    : ['default'];

const sharedProjectTestConfig = {
  alias: toolkitEntryAliases,
  globals: true,
  reporters: ['default'],
};

export const toolkitSharedConfig = {
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/toolkit',
  plugins: [angular()],
  resolve: {
    tsconfigPaths: true,
    // Vite resolves the package tsconfig paths first during Vitest runs.
    // These explicit self-import aliases keep toolkit secondary entrypoints stable.
    alias: toolkitEntryAliases,
  },
  optimizeDeps: {
    include: [
      '@analogjs/vitest-angular/setup-serializers',
      '@analogjs/vitest-angular/setup-snapshots',
      '@angular/compiler',
      '@angular/platform-browser/testing',
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
