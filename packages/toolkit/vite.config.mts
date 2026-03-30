/// <reference types='vitest' />

import { defineConfig } from 'vitest/config';
import { toolkitSharedConfig } from './vitest.shared.mts';

export default defineConfig({
  ...toolkitSharedConfig,
  test: {
    ...toolkitSharedConfig.test,
    name: 'toolkit-jsdom',
    setupFiles: ['./test-setup.ts'],
    environment: 'jsdom',
    include: [
      '{src,core,form-field,headless,assistive,testing,debugger,vest}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      '{src,core,form-field,headless,assistive,testing,debugger,vest}/**/*.browser.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    pool: 'forks',
  },
});
