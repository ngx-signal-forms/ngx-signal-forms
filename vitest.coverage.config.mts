/// <reference types='vitest' />
import { defineConfig } from 'vitest/config';

/**
 * Merged Coverage Configuration (Vitest 4)
 *
 * One run, one number. Vitest instruments once across every project listed
 * below and emits a single merged report — no external merge step is needed.
 *
 * Why this config exists separately from `vite.config.mts`:
 *
 * 1. `coverage` is a **root-only** option. Vitest ignores a `coverage` block
 *    declared inside a project config, so the settings have to live here.
 *    @see https://vitest.dev/guide/projects.html#unsupported-options
 * 2. The default root config deliberately omits the browser project to keep
 *    plain unit runs out of Vitest browser mode. Coverage needs it, because
 *    jsdom and browser specs cover different halves of the source tree.
 *
 * Run it through Nx: `pnpm nx run workspace:coverage`.
 */
export default defineConfig({
  test: {
    /**
     * Every project whose specs exercise toolkit source, including the demo
     * app's own unit specs. `toolkit-browser` runs
     * through the Playwright provider; the demo-e2e Playwright suite is not
     * a Vitest project and is intentionally absent — see the coverage docs.
     *
     * `demo-shared` is excluded on purpose: its single spec covers route
     * metadata rather than any toolkit code.
     *
     * Note the `--maxWorkers=2` in the `workspace:coverage` target. Vitest
     * refuses to run two projects that share a `sequence.groupOrder` but
     * resolve different `maxWorkers`, which these configs otherwise do under
     * CI. A CLI value applies to every project at the highest priority and
     * removes the divergence; a percentage does not, because it resolves
     * per project.
     */
    projects: [
      'packages/toolkit/vitest.jsdom.config.mts',
      'packages/toolkit/vitest.browser.config.mts',
      'apps/demo/vitest.config.mts',
    ],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      /**
       * `lcov` feeds badge/reporting services, `text-summary` keeps the
       * terminal readable, `html` is for local drill-down.
       */
      reporter: ['text-summary', 'html', 'lcov'],
      /**
       * Paths resolve from the workspace root here, not from the package.
       * Scoped to shipped toolkit source: demo apps and build scripts are
       * not part of the published surface and would dilute the number.
       */
      include: [
        'packages/toolkit/core/**/*.ts',
        'packages/toolkit/assistive/**/*.ts',
        'packages/toolkit/form-field/**/*.ts',
        'packages/toolkit/headless/**/*.ts',
        'packages/toolkit/testing/**/*.ts',
        'packages/toolkit/vest/**/*.ts',
      ],
      exclude: [
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/index.ts',
        '**/public_api.ts',
        '**/test-setup*.ts',
      ],
      /**
       * Thresholds apply once, to the merged result. Never gate an individual
       * project: the browser suite alone reports ~70% simply because its
       * specs are a subset measured against the whole tree.
       */
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
