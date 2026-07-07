import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import analog from '@analogjs/vite-plugin-angular';
import { join } from 'node:path';

const appDir = import.meta.dirname;

export default defineConfig({
  root: join(appDir, 'src'),
  publicDir: join(appDir, 'public'),
  cacheDir: '../../node_modules/.vite/apps/demo-material',
  server: {
    port: 4601,
    host: '127.0.0.1',
  },
  preview: {
    port: 4701,
    host: '127.0.0.1',
  },
  build: {
    outDir: '../../../dist/apps/demo-material',
    emptyOutDir: true,
  },
  plugins: [
    analog({
      tsconfig: '../tsconfig.app.json',
    }),
    nxViteTsPaths(),
  ],
});
