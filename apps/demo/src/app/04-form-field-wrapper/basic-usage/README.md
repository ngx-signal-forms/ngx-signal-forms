# Form Field Wrapper - Basic Usage

## Overview

Introduces the `NgxFormField` wrapper for consistent layout and automatic error display across common input types.

## Form model

- Signal model via `signal<BasicUsageModel>()`.
- Form instance created with `form(model, basicUsageSchema)`.

## Validation overview

**Errors**

- Name: required + minimum length 2.
- Email: required + email format.
- Website: must be a valid URL when provided.
- Age: required, min 18, max 119.
- Bio: required, minimum length 20, maximum length 500.
- Country: required.
- Agree to terms: required (custom validation).

**Warnings**

- None.

## Toolkit usage

- `NgxSignalFormToolkit` for auto-ARIA and form context.
- `NgxFormField` wrapper for layout and automatic errors.
- `errorStrategy` configurable via the page selector.

## Other tools

- None.

## Key files

- `basic-usage.form.ts` — form model and handlers.
- `basic-usage.html` — wrapper usage and template structure.
- `basic-usage.validations.ts` — schema rules.
- `basic-usage.page.ts` — demo wrapper and debugger.

## How to test

1. Run the demo app.
2. Navigate to `/form-field-wrapper/basic-usage`.
3. Submit with missing required fields to see wrapper errors.
4. Enter an invalid URL in Website to see optional field validation.
