/// <reference types='vitest' />
import { defineConfig } from 'vitest/config';

/**
 * Root Vitest Configuration (Vitest 4)
 *
 * Uses the modern `test.projects` approach (recommended since Vitest 3.2)
 * instead of the deprecated `vitest.workspace.ts` file.
 *
 * This configuration explicitly defines which projects contain Vitest tests,
 * preventing the test explorer from loading Playwright E2E specs from demo-e2e
 * or defaulting unit-test runs into Vitest browser mode.
 *
 * @see https://vitest.dev/blog/vitest-3-2.html#workspace-is-deprecated
 * @see https://vitest.dev/guide/migration.html#vitest-4
 */
export default defineConfig({
  test: {
    /**
     * Projects array replaces the deprecated vitest.workspace.ts
     * Only includes projects that should participate in default headless test runs.
     * Browser-mode coverage stays available through the explicit Nx target.
     */
    projects: [
      'packages/demo-shared/vitest.config.mts',
      'packages/toolkit/vitest.jsdom.config.mts',
    ],
  },
});
