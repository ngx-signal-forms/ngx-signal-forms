import { defineConfig, type Plugin } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import analog from '@analogjs/vite-plugin-angular';
import { join } from 'node:path';

const appDir = import.meta.dirname;

// Vite rewrites asset URLs for the configured `base` but leaves the
// `<base href>` element alone, which breaks Angular's router on subpath
// deployments (e.g. GitHub Pages at /ngx-signal-forms/). Align the tag.
function alignBaseHref(): Plugin {
  let base = '/';
  return {
    name: 'ngx-align-base-href',
    configResolved(resolved) {
      base = resolved.base;
    },
    transformIndexHtml(html) {
      return html.replace(
        /<base href="[^"]*"\s*\/?>/,
        `<base href="${base}" />`,
      );
    },
  };
}

export default defineConfig({
  root: join(appDir, 'src'),
  publicDir: join(appDir, 'public'),
  cacheDir: '../../node_modules/.vite/apps/demo',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  build: {
    outDir: '../../../dist/apps/demo',
    emptyOutDir: true,
  },
  plugins: [
    analog({
      tsconfig: '../tsconfig.app.json',
    }),
    nxViteTsPaths(),
    alignBaseHref(),
  ],
});
