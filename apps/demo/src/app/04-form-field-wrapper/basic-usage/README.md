# Form Field Wrapper - Basic Usage

This example introduces the `NgxFormField` wrapper component, which provides consistent layout and automatic error display for Signal Forms.

## What this demo shows

- **Wrapper component**: `<ngx-signal-form-field-wrapper>`
- **Automatic error display**: no manual error markup needed
- **Content projection**: labels, inputs, hints, and actions
- **Accessible wiring**: ID-based label association and ARIA support

## Why use the wrapper

- Reduces boilerplate for every field
- Keeps layout consistent across inputs
- Applies error strategy automatically
- Works with the toolkit’s auto-ARIA behavior

## Key files

- `basic-usage.form.ts` — form implementation
- `basic-usage.page.ts` — page wrapper and debugger
- `basic-usage.content.ts` — demo card content

## Package reference

- `@ngx-signal-forms/toolkit/form-field`

Use the bundle import:

```ts
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
```
