# Field States (Dirty, Touched, Pending)

## Overview

Understanding the lifecycle of a form field is crucial for UX. When should you show an error? When should you enable the save button?

This demo visualizes the **State Signals** available on every field.

## Feature Spotlight: The State Signals

Every field exposes these reactive signals:

-   **`pristine` / `dirty`**: Has the user changed the value? (Useful for "Unsaved Changes" checks).
-   **`untouched` / `touched`**: Has the user focused and blurred? (Useful for delaying error messages).
-   **`valid` / `invalid`**: Does the value satisfy the schema?
-   **`pending`**: Is an async validator running?

## Feature Spotlight: `NgxSignalFormDebugger`

This demo heavily relies on the debugger to visualize these invisible states. It's a developer tool exported by the toolkit/debugger package.

## UX Patterns

-   **Disable Save**: `[disabled]="!form.dirty() || form.invalid()"` -> Only save if changed AND valid.
-   **Show Error**: `!form.pristine() && form.invalid()` -> Show immediate errors once they start typing.

## Key Files

-   [field-states.form.ts](field-states.form.ts): Buttons to manually toggle states.

## How to Test

1.  **Touch**: Click inside the input and clicking out (Blur). Watch `touched` go `true`.
2.  **Type**: Type a character. Watch `dirty` go `true`.
3.  **Reset**: specific button to reset state. See them revert.
