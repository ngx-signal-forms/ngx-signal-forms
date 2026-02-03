# Accessibility Comparison

## Overview

Side-by-side comparison of a minimal toolkit setup versus full toolkit usage to highlight accessibility and boilerplate differences.

## Form model

- Signal model in both forms using `signal<AccessibilityFormModel>()`.
- Form instance created via `form(model, accessibilityValidationSchema)`.

## Validation overview

**Errors**

- Email: required + email format.
- Password: required + minimum length 8.
- Confirm password: required.
- Cross-field: confirm password must match password.

**Warnings**

- None.

## Toolkit usage

- `NgxSignalFormToolkit` for auto-ARIA and `novalidate`.
- `NgxFormField` wrapper for automatic error display.
- Minimal form runs without `[ngxSignalForm]` to show default `on-touch` behavior.
- Full form uses `[ngxSignalForm]` and `focusFirstInvalid()` for submission UX.

## Other tools

- None.

## Key files

- `accessibility-comparison.minimal.form.ts` — minimal toolkit variant.
- `accessibility-comparison.toolkit.form.ts` — full toolkit variant.
- `accessibility-comparison.validations.ts` — shared schema.
- `accessibility-comparison.page.ts` — comparison page.

## How to test

1. Run the demo app.
2. Navigate to `/toolkit-core/accessibility-comparison`.
3. Compare error behavior between minimal and full implementations.
4. Submit invalid data to see `focusFirstInvalid()` in action.
