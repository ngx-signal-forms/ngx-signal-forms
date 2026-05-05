import { isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { AppComponent } from './app/app';
import { provideNgxPrimeForms } from './app/form-field';

// Wrap in async IIFE so the dev compiler import only loads in dev builds.
// oxlint-disable-next-line unicorn/prefer-top-level-await -- async IIFE is intentional for build-target compatibility
void (async () => {
  if (isDevMode()) {
    try {
      await import('@angular/compiler');
    } catch {
      // Compiler not available in this build flavour; ignore.
    }
  }

  await bootstrapApplication(AppComponent, {
    providers: [
      provideZonelessChangeDetection(),
      provideAnimationsAsync(),
      providePrimeNG({
        theme: {
          preset: Aura,
          options: {
            // Keep the demo theme uncustomised — the README documents that
            // CSS-token overrides are intentionally out of scope.
            prefix: 'p',
            darkModeSelector: 'system',
            cssLayer: false,
          },
        },
      }),
      provideNgxSignalFormsConfig({
        defaultErrorStrategy: 'on-touch',
        autoAria: true,
      }),
      // Single bootstrap entry point for the PrimeNG reference renderers.
      // Registers both NGX_FORM_FIELD_ERROR_RENDERER and
      // NGX_FORM_FIELD_HINT_RENDERER with the Prime-flavoured components,
      // mirroring `provideNgxMatForms()` in the Material reference.
      provideNgxPrimeForms(),
    ],
  });
})();
