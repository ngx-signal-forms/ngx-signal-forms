# Error Display Modes

## Overview

Demonstrates how different error display strategies change when validation feedback appears. The product feedback form can be switched between `immediate`, `on-touch`, `on-submit`, and `manual` strategies.

## Form model

- Signal model via `signal<ProductFeedbackModel>()`.
- Form instance created with `form(model, productFeedbackSchema)`.

## Validation overview

**Errors**

- Name: required, minimum length 2, maximum length 50.
- Email: required + email format.
- Company: maximum length 100.
- Product used: required.
- Overall rating: required, min 1, max 5.
- Improvement suggestions: required when rating ≤ 3, minimum length 10, maximum length 500.
- Detailed feedback: maximum length 1000.

**Warnings**

- None.

## Toolkit usage

- `NgxSignalFormToolkit` for auto-ARIA and form context.
- `NgxSignalFormErrorComponent` for field-level error rendering.
- `injectFormContext()` and `combineShowErrors()` for custom visibility helpers.
- Error strategy set on the form via `[errorStrategy]`.

## Other tools

- None.

## Key files

- `error-display-modes.form.ts` — form and helper component.
- `error-display-modes.validations.ts` — validation schema.
- `error-display-modes.page.ts` — demo wrapper and debugger.

## How to test

1. Run the demo app.
2. Navigate to `/toolkit-core/error-display-modes`.
3. Switch strategies and blur fields to observe timing differences.
4. Choose a low rating to trigger the conditional improvement field.
