# Your First Form (Toolkit Intro)

## Overview

This demo is your introduction to **@ngx-signal-forms/toolkit**. It takes a standard contact form and enhances it with the toolkit's core directives to solve the accessibility boilerplate problems shown in the "Pure Signal Forms" demo.

## Feature Spotlight: `NgxSignalFormToolkit`

### What is it?
The `NgxSignalFormToolkit` is a directive applied to the `<form>` element. It acts as the "brain" for your form's template logic.

### Key Powers:
1.  **Auto-ARIA**: automatically syncs `aria-invalid` and `aria-describedby` on your inputs by matching them to their computed signal state.
2.  **Validation Context**: Provides a registry for error messages so child components (like `NgxSignalFormError`) know what to display without you passing strings down.
3.  **NoValidate**: Automatically adds `novalidate` to the form element to disable native browser bubbles, giving you full control over the UI.

### Usage
```html
<!-- Just add the directive and bind the form signal -->
<form [ngxSignalForm]="contactForm" (submit)="onSubmit($event)">
  <!-- Clean inputs, no manual aria bindings needed! -->
  <input [formField]="contactForm.name" />
  
  <!-- Reusable error component -->
  <ngx-signal-form-error [formField]="contactForm.name" />
</form>
```

## Feature Spotlight: `NgxSignalFormError`

Instead of writing `at @if (touched && invalid)` blocks, use this component. It:
-   Automatically detects the error strategy (default: "on touch").
-   Finds the correct error message (Validator -> Registry -> Default).
-   Renders with `role="alert"`.

## Key Files

-   [your-first-form.form.ts](your-first-form.form.ts): Basic setup.
-   [your-first-form.page.ts](your-first-form.page.ts): Shows the `ErrorDisplayModeSelectorComponent`.

## How to Test

1.  **Auto-ARIA**: Inspect the inputs. Notice `aria-required="true"` and `aria-invalid` appear automatically.
2.  **Error Strategies**: Use the dropdown at the top to switch between "On Touch", "On Submit", and "Immediate". Notice how `NgxSignalFormError` respects this global setting instantly without code changes.
