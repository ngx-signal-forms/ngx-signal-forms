# Async Validation

## Intent

Validating against a server ("is this username taken?") is notoriously tricky: race conditions, debouncing, loading indicators, and canceling stale requests. This demo shows how Angular Signal Forms' `validateHttp` and the toolkit's wrapper handle the lifecycle declaratively.

## Toolkit features showcased

- `validateHttp(path, { request, onSuccess, onError })` — built-in async validator with automatic cancellation on value change.
- `pending()` / `status()` signals — exposed per-field so you can show spinners or "Checking…" text with `@if`.
- `NgxFormField` wrapper — picks up pending state and renders consistent feedback.
- Suffix projection (`<span suffix>`) inside the wrapper — pattern for loading indicators next to the input.
- `createOnInvalidHandler()` — focus-first-invalid on submit.
- Declarative `submission` wiring — submit stays disabled while validation is `pending()`.

## Form model

- Signal model: `signal<Registration>({ username: '' })`.
- Schema: `form(model, registrationSchema, { submission })`.

## Validation rules

### Errors

- Username — required.
- Username — `validateHttp` hits `fake-api/check-user/:value`; if `response.available === false`, emits `usernameTaken` with a dynamic message.

### Warnings

- None.

## Strong suites

- Canonical async validation reference: no manual `switchMap`, no manual cancellation, no manual pending flag.
- Integrates cleanly with submission — button is disabled while `pending()` is true so you cannot submit an unresolved check.
- Shows the suffix projection pattern for loading indicators inside the wrapper.

## Key files

- [async-validation.form.ts](async-validation.form.ts) — `validateHttp` setup, submission wiring, state debugger.
- [async-validation.page.ts](async-validation.page.ts) — page wrapper.

## How to test

1. Run the demo and navigate to `/advanced-scenarios/async-validation`.
2. Type `admin` quickly — confirm only one request fires at the end (stale requests cancelled).
3. Watch the "Checking…" suffix appear while the simulated request is in flight.
4. Leave the value as `admin` and wait — confirm the `usernameTaken` error renders once the response arrives.
5. Change to a different value and confirm the error clears as the new validation succeeds.
6. Click submit while validation is still pending — confirm the button stays disabled.

## Related

- [Cross-Field Validation](../cross-field-validation/README.md) — synchronous validators that read sibling fields.
- [Submission Patterns](../submission-patterns/README.md) — declarative submission paired with async rules.
