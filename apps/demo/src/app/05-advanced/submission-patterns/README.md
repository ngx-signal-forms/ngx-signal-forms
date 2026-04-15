# Submission Patterns

## Intent

Manual submission plumbing — disabling buttons, tracking loading, catching errors, focusing the first invalid field — is boilerplate you should not rewrite per form. This demo showcases declarative submission via `form(..., { submission })` + `[formRoot]`, paired with the GOV.UK-style error summary for accessible failure recovery.

## Toolkit features showcased

- `form(model, schema, { submission })` — declarative `action` + `onInvalid` lifecycle.
- `[formRoot]` directive — orchestrates `preventDefault`, `novalidate`, submitting state, and invalid-submit handling.
- `createOnInvalidHandler()` — focuses the first invalid field on failed submit.
- `<ngx-form-field-error-summary>` — strategy-aware, aggregated, clickable error summary (`role="alert"`, `aria-live="assertive"`).
- `focusBoundControl()` — click-to-focus from the summary into the control.
- `humanizeFieldPath` + `provideFieldLabels()` — readable field names in the summary.
- `submitting()` signal — drives the submit button's disabled/loading UI.
- `[submittedStatus]` public binding — shows passing submitted state explicitly while still reading from toolkit context.

## Form model

- Signal model: `signal<RegistrationModel>()`.
- Schema: `form(model, registrationSchema, { submission })`.

## Validation rules

### Errors

- Username — required; min length 3; `invalid-username` when value contains anything outside `[a-zA-Z0-9_]`.
- Password — required; min length 8.
- Confirm password — required.
- Password / confirm password — root-level cross-field validator emits `password-mismatch` when the two values differ.

### Warnings

- None.

## Strong suites

- The reference implementation for production-grade submission UX: no manual `preventDefault`, no manual submitting flags, no per-field focus juggling.
- Error summary pattern is ready-to-copy for any page with a large number of fields.
- Plays well with every error strategy — switch to `on-submit` to see "quiet until save" behavior.

## Key files

- [submission-patterns.form.ts](submission-patterns.form.ts) — declarative submission and `onInvalid` handler.
- [submission-patterns.page.ts](submission-patterns.page.ts) — page wrapper, error-strategy selector, and server-error toggle.

## How to test

1. Run the demo and navigate to `/advanced-scenarios/submission-patterns`.
2. Submit an empty form and observe the error summary at the top with one entry per invalid field.
3. Click any summary entry and confirm focus jumps to the matching control.
4. Check "Simulate Server Error" and submit a valid form — observe the submit button disable, the loading text appear, and the server error banner render.
5. Switch the error-strategy selector to `on-submit` and confirm errors stay hidden until the first submit attempt.
6. Fix errors one at a time and confirm the summary shrinks and clears.

## Related

- [Error Display Modes](../../02-toolkit-core/error-display-modes/README.md) — strategy primer.
- [Headless Fieldset + Utilities](../../03-headless/fieldset-utilities/README.md) — headless equivalent of the error summary.
