# Cross-Field Validation

## Overview

Validating a single field is easy. Validating relationships *between* fields (e.g., "End Date must be after Start Date") is harder because it depends on multiple signals.

This demo shows how to use the **Validation Context** to access sibling values.

## Feature Spotlight: `validate` with Context

In standard validators, you just get the value. In cross-field validators, you get a **context object**.

### Accessing Sibling Values
Use `ctx.value` for the current field, and `ctx.parent.value()` (or similar transversal) to reach others. Or, better yet, rely on the signal model state if accessible, but strict schema validation often prefers the context.

```typescript
validate(path.confirmPassword, (value) => {
  const password = model().password; // Accessing the signal directly
  return value === password ? null : { mismatch: true };
})
```
*Note: The exact API depends on whether you use the functional `validate` or schema-based rules.*

## Feature Spotlight: Where to Attach the Error?

This is a common design decision:
1.  **On the Field**: Attach "Mismatch" error to the `confirmPassword` field. (Shown in this demo).
2.  **On the Group**: Attach "Invalid Date Range" to the parent group.

## Key Files

-   [cross-field-validation.form.ts](cross-field-validation.form.ts): The cross-field logic.

## How to Test

1.  **Date Range**: Pick a Check-Out date *before* the Check-In date. See the error appear.
2.  **Promo Code**: The promo code "SMALLGROUP" is only valid if guests < 5. Change guest count to 6 and watch the promo field invalidating immediately.
