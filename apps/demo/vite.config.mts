import { defineConfig, type Plugin } from 'vite';
import analog from '@analogjs/vite-plugin-angular';
import { join } from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';

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

// GitHub Pages cannot send response headers, so production builds carry the
// Content-Security-Policy as a meta tag. A meta CSP cannot set
// `frame-ancestors`. The dev server gets no policy, because Angular's JIT
// compiler needs `eval` in dev and e2e runs. Inline styles stay allowed for
// Angular component styles.
const productionContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function productionCsp(): Plugin {
  return {
    name: 'ngx-production-csp',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: productionContentSecurityPolicy,
          },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

export default defineConfig({
  root: join(appDir, 'src'),
  publicDir: join(appDir, 'public'),
  cacheDir: '../../node_modules/.vite/apps/demo',
  server: {
    port: 4600,
    host: '127.0.0.1',
  },
  preview: {
    port: 4700,
    host: '127.0.0.1',
  },
  build: {
    outDir: '../../../dist/apps/demo',
    emptyOutDir: true,
  },
  plugins: [
    analog({
      tsconfig: '../tsconfig.app.json',
    }),
    tsconfigPaths(),
    alignBaseHref(),
    productionCsp(),
  ],
});
