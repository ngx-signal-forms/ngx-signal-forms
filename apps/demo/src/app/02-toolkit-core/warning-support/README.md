# Warning Support (Non-Blocking Validation)

## Overview

Standard validation is binary: valid or invalid. But real-world forms often need **Warnings**—suggestions that alert the user (e.g., "Password is weak") but **do not block submission**. 

This demo highlights the toolkit's native support for "Soft Validation".

## Feature Spotlight: Warnings in Schema

### Defining Warnings
You define warnings in your schema just like errors, but you wrap them or use specific warning utilities. (Note: In strict schema definitions, this often involves specific return types or metadata).

### The "Valid but with Warnings" State
When a field has a warning:
-   `form.field.valid()` remains **true**.
-   `form.field.status()` might report `'warning'` (implementation dependent).
-   Submission is **allowed**.

## Feature Spotlight: Warning-Aware Submission

The toolkit provides helpers to handle submission UX when warnings are present:

```typescript
// Check if we should block or proceed
if (this.form.valid()) {
  if (hasWarnings(this.form)) {
    // Maybe show a confirmation dialog?
  }
  submit(this.form);
}
```

## Toolkit Visualization

The `NgxSignalFormError` component (and the Wrapper) automatically handles styling differentiation:
-   **Errors**: Render in **Red** with `role="alert"`.
-   **Warnings**: Render in **Yellow/Orange** (often with a different icon).

## Key Files

-   [warning-support.validations.ts](warning-support.validations.ts): Look for the warning rule definitions.
-   [warning-support.form.ts](warning-support.form.ts): Handling the submission flow.

## How to Test

1.  **Trigger Warning**: Enter a password like "password123". It's valid length, but might trigger a "Weak password" warning.
2.  **Submit**: Notice the button is **not disabled**.
3.  **UI Feedback**: Observe the visual distinction between the "Required" error (Red) and the "Weak Password" warning (Orange).
