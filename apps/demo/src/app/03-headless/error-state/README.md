# Headless Error State

## Overview

Custom markup built with headless directives to control error visibility and character count without the prebuilt wrapper components.

## Form model

- Signal model via `signal<HeadlessProfile>()`.
- Form instance created with `form(model, headlessSchema)`.

## Validation overview

**Errors**

- Email: required + email format.
- Bio: required + maximum length 160.

**Warnings**

- None.

## Toolkit usage

- `NgxHeadlessErrorStateDirective` for error visibility state and IDs.
- `NgxHeadlessCharacterCountDirective` for character counting.
- Manual ARIA bindings using `errorId()` and `showErrors()` from the headless directive.

## Other tools

- None.

## Key files

- `error-state.form.ts` — form and headless directive usage.
- `error-state.page.ts` — demo wrapper and debugger.

## How to test

1. Run the demo app.
2. Navigate to `/headless/error-state`.
3. Blur fields to show error output through headless helpers.
4. Type in the bio to see character count updates.
