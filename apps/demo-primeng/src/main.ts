import { isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideFormFieldErrorRenderer,
  provideFormFieldHintRenderer,
  provideNgxSignalFormsConfig,
} from '@ngx-signal-forms/toolkit';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { AppComponent } from './app/app';
import { PrimeFieldErrorComponent } from './app/form-field/prime-field-error';
import { PrimeFieldHintComponent } from './app/form-field/prime-field-hint';

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
      // Renderer tokens registered for both error and hint slots so the
      // toolkit's wrapper authoring contract is exercised in CI. The wrapper
      // in this app is custom (PrimeFormFieldComponent), but the same Prime
      // idioms are also surfaced through the toolkit's default wrapper
      // anywhere it might be used.
      provideFormFieldErrorRenderer({ component: PrimeFieldErrorComponent }),
      provideFormFieldHintRenderer({ component: PrimeFieldHintComponent }),
    ],
  });
})();
