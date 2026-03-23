/// <reference types='vitest' />

import { defineConfig } from 'vitest/config';
import {
  toolkitBrowserSpecFiles,
  toolkitSharedConfig,
  toolkitSpecFiles,
} from './vitest.shared.mts';

export default defineConfig({
  ...toolkitSharedConfig,
  test: {
    ...toolkitSharedConfig.test,
    name: 'toolkit-jsdom',
    setupFiles: ['./test-setup.ts'],
    environment: 'jsdom',
    include: [toolkitSpecFiles],
    exclude: [toolkitBrowserSpecFiles],
    /**
     * Angular TestBed stays most predictable when jsdom specs run in isolated forks.
     */
    pool: 'forks',
  },
});
