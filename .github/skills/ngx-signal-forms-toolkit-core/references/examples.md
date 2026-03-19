# Toolkit Core Reference Map

## Portability note

This file is safe to copy outside this repository.

- Treat the toolkit concepts below as portable guidance.
- Treat any repository paths as optional examples that only exist in `ngx-signal-forms`.
- When those paths do not exist, use the installed package docs or the public GitHub repository instead.

## Portable patterns

- Use the core entry point for `[formRoot]`, auto-ARIA, error timing, warnings, global config, shared message resolution, and submission helpers.
- Prefer `[formRoot]` when the form needs form context, consistent strategy inheritance, or `'on-submit'` visibility.
- Keep Angular Signal Forms as the source of truth and use the toolkit to remove repeated ARIA and visibility plumbing.

## Repository docs and demo map (optional)

Use these paths only when working inside this repository.

- `.github/instructions/ngx-signal-forms-toolkit.instructions.md`
- `packages/toolkit/README.md`
- `.github/instructions/angular-signal-forms.instructions.md`
- `apps/demo/src/app/01-getting-started/your-first-form/`
  - Shows the first meaningful toolkit adoption: auto-ARIA, error components, and less manual form plumbing.
- `apps/demo/src/app/02-toolkit-core/accessibility-comparison/`
  - Shows why the root entry point exists: ARIA automation, `[formRoot]`, and boilerplate reduction.
- `apps/demo/src/app/02-toolkit-core/error-display-modes/`
  - Shows how `'immediate'`, `'on-touch'`, and `'on-submit'` change UX and validation timing.
- `apps/demo/src/app/02-toolkit-core/warning-support/`
  - Shows why warnings are separate from blockers and how to expose them accessibly.
- `apps/demo/src/app/05-advanced/global-configuration/`
  - Shows stable app-level defaults with `provideNgxSignalFormsConfig()`.
- `apps/demo/src/app/05-advanced/error-messages/`
  - Shows centralized message resolution with `provideErrorMessages()`.
- `apps/demo/src/app/05-advanced/submission-patterns/`
  - Shows submission lifecycle, invalid handling, and focus-first-invalid behavior.

## Why this feature family exists

- Remove repeated Signal Forms boilerplate without changing Angular Signal Forms as the source of truth.
- Centralize validation timing, ARIA wiring, submission helpers, and shared message resolution.
- Keep consumers on stable public APIs instead of internal helpers or removed beta-era surfaces.
