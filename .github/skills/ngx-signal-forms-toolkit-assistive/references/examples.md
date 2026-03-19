# Toolkit Assistive Reference Map

## Portability note

This file is safe to copy outside this repository.

- Treat the assistive patterns below as portable guidance.
- Treat any repository paths as optional examples that only exist in `ngx-signal-forms`.
- When those paths do not exist, use the installed package docs or the public GitHub repository instead.

## Portable patterns

- Use the assistive entry point for standalone errors, hints, character counts, and assistive layout rows.
- Keep error and warning semantics distinct so blocking feedback remains assertive and guidance remains polite.
- Use assistive components when reusable feedback markup is wanted without adopting the full wrapper.

## Repository docs and demo map (optional)

Use these paths only when working inside this repository.

- `.github/instructions/ngx-signal-forms-toolkit.instructions.md`
- `packages/toolkit/assistive/README.md`
- `packages/toolkit/README.md`
- `apps/demo/src/app/01-getting-started/your-first-form/`
  - Shows the simplest upgrade from manual checks to toolkit-managed error display.
- `apps/demo/src/app/02-toolkit-core/warning-support/`
  - Shows why warning semantics matter and how non-blocking guidance fits into accessible validation.
- `apps/demo/src/app/04-form-field-wrapper/basic-usage/`
  - Shows assistive pieces inside a styled wrapper context.
- `apps/demo/src/app/05-advanced/error-messages/`
  - Shows how assistive rendering benefits from centralized message resolution.

## Why this feature family exists

- Separate feedback rendering from the core form logic so consumers can add accessible helper text and validation output without rebuilding live-region behavior.
- Provide reusable building blocks that sit between headless primitives and the full field wrapper.
