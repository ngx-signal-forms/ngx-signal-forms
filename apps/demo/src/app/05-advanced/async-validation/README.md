# Async Validation

## Overview

Validating against a server (e.g., "Is this username taken?") introduces complexity: race conditions, debouncing typeahead, and loading indicators. 

This demo highlights how Angular Signal Forms handles this elegantly via **Async Validators**.

## Feature Spotlight: `validateHttp` & Debouncing

### Handling Race Conditions
When a user types quickly ("u" -> "us" -> "use" -> "user"), you don't want 4 concurrent requests. Signal Forms automatically cancels pending validations when the value changes.

### Configurable Debounce
You can control *when* the request fires.

```typescript
validateHttp(path.username, async (val) => {
  return api.checkUsername(val);
}, { debounce: 300 })
```

### The `pending` State
While validation is in flight:
-   `form.username.status()` becomes `'pending'`.
-   `form.username.pending()` signal becomes `true`.
-   You can show a spinner easily:
    ```html
    @if (form.username.pending()) { <spinner /> }
    ```

## Feature Spotlight: Wrapper Integration

The `NgxFormField` wrapper notices this pending state. If you inspect the `async-validation.form.html`, you might see it automatically provides feedback or styles (depending on configuration) without extra template logic.

## Key Files

-   [async-validation.form.ts](async-validation.form.ts): The validator definition.

## How to Test

1.  **Type Fast**: Type "admin" quickly. Notice only one request fires at the end.
2.  **Observe**: See the "Checking..." indicator (or visual state change) while the request simulates network latency.
3.  **Taken Username**: Enter "admin". Wait for the simulated API to return 409/Error. See the error message appear.
