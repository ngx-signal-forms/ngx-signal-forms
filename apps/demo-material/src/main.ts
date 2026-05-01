import { isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { AppComponent } from './app/app';

// Async IIFE so we can lazy-import the JIT compiler when running the dev
// server (matches `apps/demo`). Production builds skip this branch entirely.
// oxlint-disable-next-line unicorn/prefer-top-level-await -- async IIFE for build-target compatibility
void (async () => {
  try {
    if (isDevMode()) {
      await import('@angular/compiler');
    }
  } catch {
    // ignored — production builds do not need the compiler
  }

  await bootstrapApplication(AppComponent, {
    providers: [
      provideZonelessChangeDetection(),
      // Material's animation hooks. `noop` keeps the demo zoneless-friendly
      // (no animations module pulled in) while still satisfying Material's
      // animation provider contract.
      provideAnimationsAsync('noop'),
      provideNgxSignalFormsConfig({
        defaultErrorStrategy: 'on-touch',
        autoAria: true,
      }),
    ],
  });
})();
