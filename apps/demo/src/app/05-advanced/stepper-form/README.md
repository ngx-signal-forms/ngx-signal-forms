# Stepper Form

## Overview

Multi-step registration wizard that gates navigation per step and validates step-specific fields before advancing.

## Form model

- Signal model via `signal<WizardData>()`.
- Form instance created with `form(model, wizardSchema)`.

## Validation overview

**Errors**

- Step 1: email required + email format; password required.
- Step 2: full name required; phone required.

**Warnings**

- None.

## Toolkit usage

- `NgxSignalFormToolkit` for auto-ARIA and form context.
- `NgxFormField` wrapper with `outline` appearance.

## Other tools

- None.

## Key files

- `stepper-form.form.ts` — stepper logic and validation gating.
- `stepper-form.page.ts` — demo wrapper and debugger.

## How to test

1. Run the demo app.
2. Navigate to `/advanced-scenarios/stepper-form`.
3. Try advancing with empty fields to see step-level validation.
4. Complete all steps and submit.
