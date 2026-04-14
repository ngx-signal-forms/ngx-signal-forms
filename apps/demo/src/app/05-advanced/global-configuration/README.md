# Global Toolkit Configuration

## Overview

Shows how global toolkit defaults and app-level control-family presets (set in `apps/demo/src/main.ts`) affect form behavior, while one form can still override the error strategy locally.

## Form model

- Signal model via `signal<GlobalConfigModel>()`.
- Form instance created with `form(model, globalConfigSchema)`.

## Validation overview

### Errors

- Email: required + email format.
- Phone: required + `123-456-7890` format.
- Website: optional but must be a valid URL when provided.
- Accept terms: must be checked before submission.

### Warnings

- None.

## Toolkit usage

- `provideNgxSignalFormsConfig()` in `apps/demo/src/main.ts` sets defaults.
- `provideNgxSignalFormControlPresets()` in `apps/demo/src/main.ts` sets the app-wide switch preset to `layout: 'inline-control'` and `ariaMode: 'auto'`.
- `NgxSignalFormToolkit` for auto-ARIA and form context.
- `NgxFormField` wrapper for layout and errors.
- Bound control `id` values provide deterministic field identity for ARIA linkage.

## Other tools

- MSW is enabled globally in `apps/demo/src/main.ts` for other demos, but this form does not call APIs.

## Key files

- `global-configuration.form.ts` — form and UI.
- `global-configuration.validations.ts` — schema rules.
- `global-configuration.page.ts` — demo wrapper and debugger.
- `apps/demo/src/main.ts` — global toolkit configuration.

## How to test

1. Run the demo app.
2. Navigate to `/advanced-scenarios/global-configuration`.
3. Inspect the configuration panel and error strategy override.
4. Blur the accept-terms switch to verify the app-level preset keeps the row inline while auto-ARIA remains active.
5. Enter invalid phone or URL values to see validation output.
