# Nested Form Groups

## Overview

Demonstrates nested object structures with grouped fields for personal info and multiple addresses.

## Form model

- Signal model via `signal<UserProfile>()`.
- Form instance created with `form(model, profileSchema)`.

## Validation overview

**Errors**

- Personal info: first name and last name required; email required with email format.
- Shipping address: street, city, ZIP required; ZIP min length 5.
- Billing address: street, city, ZIP required.

**Warnings**

- None.

## Toolkit usage

- `NgxSignalFormToolkit` for auto-ARIA and form context.
- `NgxFormField` wrapper with `outline` appearance.

## Other tools

- None.

## Key files

- `nested-groups.form.ts` — nested form structure and copy action.
- `nested-groups.page.ts` — demo wrapper and debugger.

## How to test

1. Run the demo app.
2. Navigate to `/advanced-scenarios/nested-groups`.
3. Use “Copy from Shipping” to populate the billing address.
4. Submit with missing fields to see grouped validation errors.
