# Headless Fieldset + Utilities

## Overview

Demonstrates headless fieldset grouping plus the `createErrorState` and `createCharacterCount` utilities for fully custom UI layouts.

## Form model

- Signal model via `signal<HeadlessDeliveryModel>()`.
- Form instance created with `form(model, deliverySchema)`.

## Validation overview

**Errors**

- Contact email: required + email format.
- Address: street, city, postal code required; minimum lengths for street and city.
- Delivery notes: maximum length 200.

**Warnings**

- Postal code: format suggestion (ZIP pattern).
- Delivery notes: short note length (less than 20 characters).

## Toolkit usage

- `NgxHeadlessToolkit` bundle for headless directives.
- `ngxSignalFormHeadlessFieldset` for group state and aggregated errors.
- `ngxSignalFormHeadlessErrorState` for per-field error state.
- `ngxSignalFormHeadlessFieldName` for field-name resolution.
- `createErrorState()` and `createCharacterCount()` utilities for custom sections.

## Other tools

- None.

## Key files

- `fieldset-utilities.form.ts` — headless directives and utility usage.
- `fieldset-utilities.page.ts` — demo wrapper and debugger.

## How to test

1. Run the demo app.
2. Navigate to `/headless/fieldset-utilities`.
3. Trigger postal code and delivery note warnings.
4. Submit to see aggregated fieldset errors.
