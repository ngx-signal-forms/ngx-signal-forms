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
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

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

  await bootstrapApplication(AppComponent, {
    providers: [
      provideZonelessChangeDetection(),
      importProvidersFrom(),
      provideHttpClient(),
      provideEnvironmentNgxMask({ validation: false }),
      provideNgxSignalFormsConfig({
        defaultErrorStrategy: 'on-touch',
        autoAria: true,
        strictFieldResolution: false,
        debug: true, // Enable debug logging
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
