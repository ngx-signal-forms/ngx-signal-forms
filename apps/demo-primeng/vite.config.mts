import { defineConfig } from 'vite';
import analog from '@analogjs/vite-plugin-angular';
import { join } from 'node:path';

const appDir = import.meta.dirname;

export default defineConfig(({ command }) => ({
  root: join(appDir, 'src'),
  publicDir: join(appDir, 'public'),
  cacheDir: '../../node_modules/.vite/apps/demo-primeng',
  resolve: {
    tsconfigPaths: true,
  },
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
      // Analog skips type checking by default. A build turns it on, so
      // TypeScript and template errors fail the build. The dev server keeps
      // the fast path.
      disableTypeChecking: command !== 'build',
    }),
  ],
}));
