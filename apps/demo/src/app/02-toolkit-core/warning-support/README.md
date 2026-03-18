# Warning Support (Non-Blocking Validation)

## Overview

Standard validation is binary: valid or invalid. But real-world forms often need **Warnings**—suggestions that alert the user (e.g., "Password is weak") but **do not block submission**.

This demo highlights the toolkit's native support for "Soft Validation".

## Feature Spotlight: Warnings in Schema

### Defining Warnings

You define warnings in your schema just like errors, but you wrap them or use specific warning utilities. (Note: In strict schema definitions, this often involves specific return types or metadata).

### The "Warnings present" State

Angular Signal Forms still treats validation results as errors at the form-state level.
This demo shows the toolkit's warning convention on top of that baseline:

- Warnings are identified by `kind` values prefixed with `warn:`.
- The UI renders warnings separately from blocking errors.
- Submission is allowed when you opt into the toolkit's warning-aware submission helper.

## Feature Spotlight: Warning-Aware Submission

The toolkit provides helpers to handle submission UX when warnings are present:

```typescript
await submitWithWarnings(this.form, async () => {
  // Continue with submission even when only warn:* messages are present.
});
```

This demo keeps submission manual on purpose. Angular's native `submit()` still
treats all validation results as blocking, so the warning-aware path is shown
with a plain `<form novalidate>` plus `submitWithWarnings(...)`.

## Toolkit Visualization

The `NgxSignalFormError` component (and the Wrapper) automatically handles styling differentiation:

- **Errors**: Render in **Red** with `role="alert"`.
- **Warnings**: Render in **Yellow/Orange** (often with a different icon).

## Key Files

- [warning-support.validations.ts](warning-support.validations.ts): Look for the warning rule definitions.
- [warning-support.form.ts](warning-support.form.ts): Handling the submission flow.

## How to Test

1. **Trigger Warning**: Enter a password like "password123". It's valid length, but might trigger a "Weak password" warning.
2. **Submit**: Notice the button is **not disabled** by warnings alone.
3. **UI Feedback**: Observe the visual distinction between the "Required" error (Red) and the "Weak Password" warning (Orange).
