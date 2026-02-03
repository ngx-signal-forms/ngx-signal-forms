# Outline Form Field Example

## Overview

Demonstrates the default outlined form field styling (no custom overrides) with a complex, nested form for Dutch legal case entry.

## Form model

- Signal model via `signal<OutlineFormFieldModel>()`.
- Form instance created with `form(model, outlineFormFieldSchema)`.

## Validation overview

**Errors**

- Commit date and country required for each fact.
- Municipality required when country is `NL`.
- Abroad location required when country is not `NL`.
- Location description must be at least 10 characters if provided.
- Each offense requires a qualification with minimum length 3.
- Each offense must include at least one article.
- Each article is required.
- Duplicate articles within an offense are rejected.
- At least one offense required per fact.

**Warnings**

- Missing place description (suggestion).
- Article format suggestion for `SR-###` values.

## Toolkit usage

- `NgxSignalFormToolkit` for auto-ARIA and form context.
- `NgxFormField` wrapper for outlined appearance.
- `provideNgxSignalFormsConfigForComponent({ defaultFormFieldAppearance: 'outline' })` to enable outline styling.

## Other tools

- None.

## Key files

- `outline-form-field.model.ts` — nested data model.
- `outline-form-field.validations.ts` — schema with nested array rules.
- `outline-form-field.form.ts` — dynamic array handlers.
- `outline-form-field.html` — template layout.
- `outline-form-field.page.ts` — demo wrapper and debugger.

## How to test

1. Run the demo app.
2. Navigate to `/form-field-wrapper/outline-form-field`.
3. Add offenses and articles to trigger nested validations.
4. Set country to `NL` vs non-`NL` to see conditional requirements.
