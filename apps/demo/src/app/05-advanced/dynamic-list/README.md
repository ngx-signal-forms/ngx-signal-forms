# Dynamic Lists (Form Arrays)

## Overview

Demonstrates dynamic array handling with Signal Forms, including add/remove actions and per-item validation.

## Form model

- Signal model via `signal<TasksModel>()`.
- Form instance created with `form(model, tasksSchema)`.

## Validation overview

**Errors**

- Team name: required.
- Task title: required for each task.

**Warnings**

- None.

## Toolkit usage

- `NgxSignalFormToolkit` for auto-ARIA and form context.
- `NgxFormField` wrapper with `outline` appearance.

## Other tools

- None.

## Key files

- `dynamic-list.form.ts` — array mutations and schema.
- `dynamic-list.page.ts` — demo wrapper and debugger.

## How to test

1. Run the demo app.
2. Navigate to `/advanced-scenarios/dynamic-list`.
3. Add and remove tasks to see array validation.
4. Submit with empty task titles to see errors.
