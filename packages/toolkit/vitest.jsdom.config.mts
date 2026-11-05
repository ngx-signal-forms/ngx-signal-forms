/// <reference types='vitest' />

import { defineConfig } from 'vitest/config';
import {
  toolkitBrowserSpecFiles,
  toolkitReporters,
  toolkitSharedConfig,
  toolkitSpecFiles,
} from './vitest.shared.mts';

export default defineConfig({
  ...toolkitSharedConfig,
  test: {
    ...toolkitSharedConfig.test,
    name: 'toolkit-jsdom',
    reporters: toolkitReporters('jsdom'),
    setupFiles: ['./test-setup.ts'],
    environment: 'jsdom',
    include: [toolkitSpecFiles],
    exclude: [toolkitBrowserSpecFiles],
    /**
     * `vmThreads` runs each spec file in its own VM context, which keeps
     * Angular TestBed state isolated and cut the toolkit jsdom run from about
     * 30 s to about 13 s. Cross-realm `instanceof` checks against Node
     * built-ins are the known caveat. If a spec fails that way, fix the spec
     * or move it to `forks` rather than switching the whole project back.
     */
    pool: 'vmThreads',
  },
});
