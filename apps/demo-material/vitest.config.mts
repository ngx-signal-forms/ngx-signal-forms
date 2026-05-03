/// <reference types='vitest' />

import { resolve } from 'node:path';
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

const distToolkit = resolve(__dirname, '../../dist/packages/toolkit');

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/demo-material',
  resolve: {
    // Smoke specs deliberately resolve `@ngx-signal-forms/toolkit/*` to the
    // **built** toolkit (`dist/packages/toolkit`), not the source paths used
    // by `tsconfig.base.json`. Two reasons:
    //   1. The acceptance criteria for #47 require the demo to consume the
    //      toolkit's published surface — the spec exercises the same module
    //      shape as a real consumer.
    //   2. The Analog vitest sourcemap plugin re-parses every `.ts` it sees
    //      with oxc as `lang: 'js'`, which trips on TS-only barrels in the
    //      toolkit (`export type *`). Building the toolkit first sidesteps
    //      the issue.
    //
    // Run `pnpm nx build toolkit` (or rely on `pnpm nx test demo-material`
    // pulling a freshly built toolkit via Nx target dependencies) before
    // executing the smoke spec.
    alias: [
      {
        find: /^@ngx-signal-forms\/toolkit\/headless$/,
        replacement: resolve(
          distToolkit,
          'fesm2022/ngx-signal-forms-toolkit-headless.mjs',
        ),
      },
      {
        find: /^@ngx-signal-forms\/toolkit\/assistive$/,
        replacement: resolve(
          distToolkit,
          'fesm2022/ngx-signal-forms-toolkit-assistive.mjs',
        ),
      },
      {
        find: /^@ngx-signal-forms\/toolkit$/,
        replacement: resolve(
          distToolkit,
          'fesm2022/ngx-signal-forms-toolkit.mjs',
        ),
      },
    ],
  },
  // Don't apply the Analog Angular plugin to dist files — they are already
  // compiled. Limit the plugin to the demo's own src tree.
  plugins: [angular()],
  test: {
    name: 'demo-material',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
  },
});
