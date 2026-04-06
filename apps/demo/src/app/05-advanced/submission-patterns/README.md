# Submission Patterns

## Overview

Handling form submission manually requires juggling state: disabling buttons, showing loading spinners, catching errors, resetting flags.

This demo showcases **declarative submission via `form(..., { submission })` + `[formRoot]`** and best practices for server integration.

## Feature Spotlight: Declarative Submission with `[formRoot]`

The form is configured with a `submission` action in `form(...)`, and the `<form [formRoot]="...">` directive orchestrates submit behavior.

### What it handles for you

1. **`event.preventDefault()`**: No manual submit plumbing needed.
2. **Loading State**: Automatically sets a `submitting` signal while async action runs.
3. **Invalid Submit Handling**: `onInvalid` can focus the first invalid field and mark visibility state.
4. **Consistent UX**: Submission lifecycle is centralized in one place.

### Usage Example

```typescript
readonly myForm = form(this.#model, schema, {
  submission: {
    action: async (data) => {
      await this.apiService.save(data().value());
      return null;
    },
    onInvalid: createOnInvalidHandler(),
  },
});
```

## Feature Spotlight: Error Summary (GOV.UK Pattern)

This demo includes a `<ngx-signal-form-error-summary>` at the top of the form. It aggregates all field errors into a clickable list — each entry focuses the associated control when clicked.

- **Strategy-aware**: Inherits `errorStrategy` from the form context (works with `on-touch`, `on-submit`, `immediate`)
- **Explicit public API showcase**: Passes `[submittedStatus]` explicitly while still reading the value from toolkit form context
- **Click-to-focus**: Uses Angular's `focusBoundControl()` under the hood
- **Deduplicated**: Same error shown only once even if multiple fields produce it
- **WCAG 2.2**: Uses `role="alert"` with `aria-live="assertive"` for screen readers

```html
<ngx-signal-form-error-summary
  [formTree]="registrationForm"
  [submittedStatus]="explicitSubmittedStatus()"
  summaryLabel="Please fix the following errors before submitting:"
/>
```

Field names shown in the summary (e.g. `Username`, `Password`) are resolved
via `humanizeFieldPath` by default. Use `provideFieldLabels()` to customize
them for i18n or project-specific labels — see the
[toolkit README](../../../../../packages/toolkit/README.md#field-label-customization).

## Feature Spotlight: "On Submit" Error Strategy

Some forms shouldn't show inline errors immediately (while typing) or even on blur. They should stay quiet until the user hits "Save".

This demo binds the strategy as `[errorStrategy]="errorDisplayMode()"` (defaults to `on-touch`, can be switched from the page control):

- **Before Submit**: Behavior follows the currently selected strategy.
- **After Failed Submit**: Invalid fields appear according to that strategy.

## Key Files

- [submission-patterns.form.ts](submission-patterns.form.ts): Declarative submission and invalid handling.
- [submission-patterns.page.ts](submission-patterns.page.ts): Demo wrapper.

## How to Test

1. **Toggle Server Error**: Check the "Simulate Server Error" box.
2. **Click Submit**:
   - Observe the button become disabled while `submitting()` is true.
   - Observe the loading state text.
   - See the server error banner when the simulated request fails.
3. **Validation Check**: Clear a required field and submit. Errors are shown according to the selected error display strategy.
4. **Error Summary**: With errors present, observe the error summary at the top of the form. Click any entry to jump to the corresponding field.
