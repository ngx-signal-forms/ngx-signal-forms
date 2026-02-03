import { provideHttpClient } from '@angular/common/http';
import {
  importProvidersFrom,
  isDevMode,
  provideZonelessChangeDetection,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  withComponentInputBinding,
  withEnabledBlockingInitialNavigation,
  withViewTransitions,
} from '@angular/router';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

// Enable MSW mocking in development
async function enableMocking(): Promise<void> {
  if (!isDevMode()) {
    return;
  }

  const { worker } = await import('./mocks/browser');

  // Start the worker with service worker options
  await worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  });

  console.log('🔧 MSW: Mock Service Worker started');
}

// Wrap in async IIFE to support top-level await in all build targets
(async () => {
  // Enable debug logging globally
  (
    window as unknown as { __DEBUG_SHOW_ERRORS__?: boolean }
  ).__DEBUG_SHOW_ERRORS__ = true;
  console.log('🐛 Debug logging enabled for error strategies');

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

  // Start MSW before bootstrapping the app
  await enableMocking();

  await bootstrapApplication(AppComponent, {
    providers: [
      provideZonelessChangeDetection(),
      importProvidersFrom(),
      provideHttpClient(),
      provideNgxSignalFormsConfig({
        defaultErrorStrategy: 'on-touch',
        autoAria: true,
        strictFieldResolution: false,
        debug: true,
      }),
      provideRouter(
        appRoutes,
        withEnabledBlockingInitialNavigation(),
        withComponentInputBinding(),
        withViewTransitions(),
      ),
    ],
  });
})();
