import { isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { AppComponent } from './app/app';

// Wrap in async IIFE so the JIT compiler import only loads in dev (Angular
// Vite builder needs it for templateUrl/styleUrls during local dev).
// oxlint-disable-next-line unicorn/prefer-top-level-await -- async IIFE is intentional for build-target compatibility
void (async () => {
  try {
    if (isDevMode()) {
      await import('@angular/compiler');
    }
  } catch {
    // production builds don't need it
  }

  await bootstrapApplication(AppComponent, {
    providers: [
      provideZonelessChangeDetection(),
      provideNgxSignalFormsConfig({
        defaultErrorStrategy: 'on-touch',
        autoAria: true,
      }),
    ],
  });
})();
