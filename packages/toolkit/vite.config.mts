/// <reference types='vitest' />

import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      resolve(__dirname, 'vitest.jsdom.config.mts'),
      resolve(__dirname, 'vitest.browser.config.mts'),
    ],
  },
});
