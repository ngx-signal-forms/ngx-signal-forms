/// <reference types='vitest' />
import { defineConfig } from 'vitest/config';

/**
 * Root Vitest Configuration (Vitest 4)
 *
 * Uses the modern `test.projects` approach (recommended since Vitest 3.2)
 * instead of the deprecated `vitest.workspace.ts` file.
 *
 * This configuration explicitly defines which projects contain Vitest tests,
 * preventing the test explorer from loading Playwright E2E specs from demo-e2e.
 *
 * @see https://vitest.dev/blog/vitest-3-2.html#workspace-is-deprecated
 * @see https://vitest.dev/guide/migration.html#vitest-4
 */
export default defineConfig({
  test: {
    /**
     * Projects array replaces the deprecated vitest.workspace.ts
     * Only includes projects with actual Vitest unit/component tests
     */
    projects: ['apps/demo/vite.config.mts', 'packages/toolkit/vite.config.mts'],
  },
});
