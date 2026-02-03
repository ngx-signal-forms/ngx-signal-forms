# Pure Signal Forms (No Toolkit)

## Overview

This demo serves as a **baseline comparison**. It implements a registration form using *standard* Angular Signal Forms APIs, without any help from `@ngx-signal-forms/toolkit`.

The purpose is to highlight **"The Pain of Manual Wiring"**—specifically regarding accessibility and code verbosity—so you can appreciate what the toolkit automates in other demos.

## Feature Spotlight: Manual Accessibility

In a pure implementation, you are responsible for the entire accessibility lifecycle. Look at the template code in this demo and notice the heavy attribute binding:

### 1. Manual ARIA Binding
You must explicitly bind `aria-invalid` and `aria-describedby` to the signal state:

```html
<input
  [value]="form.email()"
  [attr.aria-invalid]="form.email().invalid()"
  [attr.aria-describedby]="form.email().invalid() ? 'email-error' : null"
/>
```

### 2. Manual ID generation
You have to manually generate IDs to link inputs to their error messages (e.g., `id="email-error"`).

### 3. Manual Error Visibility
You must write the condition for *when* to show an error (usually "touched AND invalid") for every single field:

```html
@if (form.email().touched() && form.email().invalid()) {
  <div id="email-error" role="alert">...</div>
}
```

## Toolkit Comparison

| Feature | Pure Signal Forms (This Demo) | With Toolkit |
| :--- | :--- | :--- |
| **ARIA Attributes** | Manual binding required | **Automated** by `NgxSignalFormToolkit` |
| **Error Visibility** | Manual `if` blocks | **Managed** by `NgxSignalFormError` / Wrapper |
| **ID Linking** | Manual string concatenation | **Auto-generated** & linked |
| **Boilerplate** | High (verbose templates) | Low (clean HTML) |

## Key Files

-   [pure-signal-form.form.ts](pure-signal-form.form.ts): The component logic.
-   [pure-signal-form.validations.ts](pure-signal-form.validations.ts): Standard validation schema.

## How to Test

1.  **Inspect DOM**: Open DevTools. Notice the `aria` attributes updating as you type. This is valid code, but expensive to write.
2.  **Blur Fields**: Trigger the "touched" state to see manual error logic in action.
3.  **Cross-Field Error**: Enter mismatching passwords. Notice you have to manually handle where to display this form-level error.
