import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import analog from '@analogjs/vite-plugin-angular';
import { join } from 'node:path';

const appDir = import.meta.dirname;

export default defineConfig({
  root: join(appDir, 'src'),
  publicDir: join(appDir, 'public'),
  cacheDir: '../../node_modules/.vite/apps/demo-spartan',
  server: {
    port: 4220,
    host: 'localhost',
  },
  preview: {
    port: 4320,
    host: 'localhost',
  },
  build: {
    outDir: '../../../dist/apps/demo-spartan',
    emptyOutDir: true,
  },
  plugins: [
    analog({
      tsconfig: '../tsconfig.app.json',
    }),
    nxViteTsPaths(),
  ],
});
