import { isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { AppComponent } from './app/app';
import { provideNgxMatForms } from './app/wrapper';

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
      // Angular Material 22's animations are CSS-based — no
      // `@angular/animations` peer dependency and no animation provider
      // required (unlike Material 21 and earlier).
      provideNgxSignalFormsConfig({
        defaultErrorStrategy: 'on-touch',
        autoAria: true,
      }),
      // Registers the Material feedback renderer for both error and hint
      // slots once for the entire app — the recommended path per
      // ADR-0002 §5.
      provideNgxMatForms(),
      // App-wide `<mat-form-field>` defaults, set once instead of repeated
      // on every field (best-practices.md #1 — "configure at the highest
      // tier that's true"). Individual fields can still override any of
      // these per-field when a genuine exception is needed.
      {
        provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
        useValue: {
          appearance: 'outline',
          floatLabel: 'always',
          subscriptSizing: 'dynamic',
        },
      },
    ],
  });
})();
