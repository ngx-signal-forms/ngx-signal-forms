# Error Display Modes

This example demonstrates how the toolkit’s error display strategies affect when validation feedback appears. It uses a realistic product feedback form and lets you switch strategies at runtime.

## What this demo shows

- **Error strategies**: `immediate`, `on-touch`, `on-submit`, `manual`
- **Signal Forms + Toolkit**: `NgxSignalFormToolkit` + `NgxSignalFormErrorComponent`
- **Realistic form**: personal info, product feedback, and preferences
- **Helper usage**: `showErrors()` and `injectFormContext()` for custom visibility logic

## Strategies in practice

- **immediate**: errors show as the user types
- **on-touch**: errors show after blur or submit (recommended)
- **on-submit**: errors show only after submit attempt
- **manual**: no automatic error visibility

## Try it

1. Switch between strategies with the selector.
2. Type in **Name** or **Email** and blur the field.
3. Submit with missing required fields.
4. Watch the helper panel react to `showErrors()` and form submission state.

## Key files

- `error-display-modes.page.ts` — page shell and mode selector
- `error-display-modes.form.ts` — form implementation
- `error-display-modes.validations.ts` — schema and validation rules
- `error-display-modes.content.ts` — demo card content
