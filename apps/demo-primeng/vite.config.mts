import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import analog from '@analogjs/vite-plugin-angular';
import { join } from 'node:path';

const appDir = import.meta.dirname;

export default defineConfig({
  root: join(appDir, 'src'),
  publicDir: join(appDir, 'public'),
  cacheDir: '../../node_modules/.vite/apps/demo-primeng',
  server: {
    port: 4620,
    host: '127.0.0.1',
  },
  preview: {
    port: 4720,
    host: '127.0.0.1',
  },
  build: {
    outDir: '../../../dist/apps/demo-primeng',
    emptyOutDir: true,
  },
  plugins: [
    analog({
      tsconfig: '../tsconfig.app.json',
    }),
    nxViteTsPaths(),
  ],
});
