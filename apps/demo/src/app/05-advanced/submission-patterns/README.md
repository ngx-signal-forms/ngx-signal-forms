# Submission Patterns

## Overview

Handling form submission manually requires juggling state: disabling buttons, showing loading spinners, catching errors, resetting flags. 

This demo showcases the **`submit` helper utility** and best practices for server integration.

## Feature Spotlight: The `submit()` Helper

This utility function wraps your submission logic to automate the boring parts.

### What it handles for you:
1.  **e.preventDefault()**: No need to manually call it.
2.  **Loading State**: Automatically sets a `pending` signal on the form while your async action runs.
3.  **Error Handling**: Can catch rejected Promises and set form-level errors.
4.  **Touched State**: Automatically marks all fields as touched if submission fails due to validation.

### Usage Example
```typescript
protected async save(event: Event) {
  // One-liner to handle the lifecycle
  await submit(this.form, async () => {
    await this.apiService.save(this.form.value());
    // Success!
  });
}
```

## Feature Spotlight: "On Submit" Error Strategy

Some forms shouldn't show inline errors immediately (while typing) or even on blur. They should stay quiet until the user hits "Save".

This demo configures the form with `[errorStrategy]="'on-submit'"`:
-   **Before Submit**: Invalid fields look clean.
-   **After Failed Submit**: All invalid fields light up red at once.

## Key Files

-   [submission-patterns.form.ts](submission-patterns.form.ts): Heavily commented submission logic.
-   [submission-patterns.page.ts](submission-patterns.page.ts): Demo wrapper.

## How to Test

1.  **Toggle Server Error**: Check the "Simulate Server Error" box.
2.  **Click Submit**: 
    -   Observe the button goes disabled (pending state).
    -   Observe the loading spinner.
    -   See the error banner appear when the "fake" request fails.
3.  **Validation Check**: Clear a required field. Click Submit. Notice it creates a "Validation Failed" state and marks fields dirty.
