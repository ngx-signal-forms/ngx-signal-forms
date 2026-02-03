# Error Messages & Global Configuration

## Overview

This demo showcases the **3-tier error message priority system** provided by `@ngx-signal-forms/toolkit`. It demonstrates how to manage error messages efficiently at different levels of your application, from specific form fields to global defaults.

The priority system resolves messages in this order:

1.  **Validator Message (Tier 1)**: Defines a specific message for a single field instance.
2.  **Registry / Provider (Tier 2)**: Overrides messages for a specific validator type (e.g., all `required` errors) within a component tree.
3.  **Toolkit Default (Tier 3)**: The built-in English fallback if no other message is found.

## Feature Spotlight: `provideErrorMessages`

### What is it?

`provideErrorMessages` is a toolkit function that registers a custom error message dictionary in the Angular dependency injection system. It allows you to define centralized messages for validation keys (like `required`, `email`, `minLength`).

### Why use it?

- **Consistency**: Ensure "This field is required" looks the same across your entire app.
- **Maintainability**: Change a message in one place (e.g., `main.ts`) to update it everywhere.
- **Flexibility**: You can override these defaults at the component level for specific forms.
- **Dynamic Messages**: Supports function-based messages for parameterized validators (e.g., showing the specific length required).

### How to use it?

Registers providers in your `appConfig` (global) or `Component` (local):

```typescript
// Local override example
providers: [
  provideErrorMessages({
    required: 'This field is required',
    email: 'Please use a valid corporate email',
    // Dynamic message using validation params
    minLength: (params) => `Needs at least ${params.minLength} chars`,
  }),
];
```

## Implementation Details

This demo implements the 3 tiers to show how they interact:

### Tier 1: Validator Message

**Highest Priority.** Used when a specific field needs a unique message (e.g., "You must accept the terms" vs just "Required").

```typescript
// In validation schema
email(path.email, { message: 'Valid email required' });
```

### Tier 2: Registry Override

**Context Priority.** Used to set the tone for a specific form or feature area. In this demo, the `ErrorMessagesComponent` provides its own dictionary.

```typescript
// In component providers
provideErrorMessages({
  minLength: (p) => `Minimum ${p.minLength} characters required`,
});
```

### Tier 3: Default Fallback

**Lowest Priority.** If you don't provide a message in the schema OR the registry, the toolkit uses its built-in defaults (e.g., "required" -> "This field is required").

## Toolkit Usage in this Demo

| Feature                    | Use Case                                                                                               |
| :------------------------- | :----------------------------------------------------------------------------------------------------- |
| **`provideErrorMessages`** | Registers the custom message dictionary for this form.                                                 |
| **`NgxSignalFormToolkit`** | Provides the injection context to resolve these messages automatically.                                |
| **`NgxFormField`**         | improved UX element that automatically displays the resolved error message without manual `if` blocks. |

## Key Files

- [error-messages.form.ts](error-messages.form.ts): Contains the `providers` setup and form configuration.
- [error-messages.validations.ts](error-messages.validations.ts): Defines the schema with Tier 1 overrides.
- [error-messages.content.ts](error-messages.content.ts): Explains the learning concepts.

## How to Test

1.  **Tier 1 (Email)**: Enter an invalid email. Notice the message "Valid email required" comes directly from the schema definition.
2.  **Tier 2 (Password)**: Enter a short password. Notice the message "Minimum 8 characters required". This is dynamically generated from the _provider function_ configured in the component.
3.  **Tier 3 (Bio)**: Leave empty and blur. Notice the generic "This field is required". This comes from the `required` key in the provider (acting as the default for this scope).
