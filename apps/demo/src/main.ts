import '@fontsource-variable/inter/wght.css';
import { provideHttpClient } from '@angular/common/http';
import {
  ErrorHandler,
  isDevMode,
  provideZonelessChangeDetection,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  withAutoCleanupInjectors,
  withComponentInputBinding,
  withEnabledBlockingInitialNavigation,
  withErrorBoundaries,
  withViewTransitions,
} from '@angular/router';
import {
  provideNgxSignalFormControlPresets,
  provideNgxSignalFormsConfig,
} from '@ngx-signal-forms/toolkit';
import { z } from 'zod';
import { AppComponent } from './app/app';
import { appRoutes } from './app/app.routes';
import { DemoErrorHandler, logRouteError } from './app/ui/render-error';

// The production build's CSP blocks `eval`. Without `jitless`, Zod probes
// `new Function` and the browser reports a CSP violation, even though Zod
// catches the error and falls back.
z.config({ jitless: true });

async function enableMocking(): Promise<void> {
  const { worker } = await import('./mocks/browser');

  await worker.start({
    onUnhandledFrame: 'bypass',
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
  });
}

// Wrap in async IIFE to support top-level await in all build targets
// oxlint-disable-next-line unicorn/prefer-top-level-await -- async IIFE is intentional: broad build-target compatibility (see comment above)
void (async () => {
  // Ensure JIT compiler is available in dev server (Angular Vite builder) for components
  // that rely on templateUrl/styleUrls during E2E and local dev.
  // Use isDevMode() to avoid importing the compiler in production builds.
  try {
    if (isDevMode()) {
      await import('@angular/compiler');
    }
  } catch {
    // Ignore if not available; production builds don't need it
  }

  // GitHub Pages also needs the mock API. Start it before routes make requests.
  try {
    await enableMocking();
  } catch (error) {
    console.error('Could not start the demo mock API.', error);
  }

  await bootstrapApplication(AppComponent, {
    providers: [
      provideZonelessChangeDetection(),
      { provide: ErrorHandler, useClass: DemoErrorHandler },
      provideHttpClient(),
      provideNgxSignalFormsConfig({
        defaultErrorStrategy: 'on-touch',
      }),
      provideNgxSignalFormControlPresets({
        switch: { layout: 'inline-control', ariaMode: 'auto' },
      }),
      provideRouter(
        appRoutes,
        withEnabledBlockingInitialNavigation(),
        withComponentInputBinding(),
        withAutoCleanupInjectors(),
        withViewTransitions({ skipInitialTransition: true }),
        // A route with an `errorComponent` shows it in place of a routed
        // component that throws. A route without one keeps the fallback of
        // the app shell's `@boundary`.
        withErrorBoundaries({ onError: logRouteError }),
      ),
    ],
  });
})();
