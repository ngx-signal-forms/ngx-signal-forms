# Field State Patterns

## Intent

Angular 22 made `{ when }` the consistent shape for driving dynamic field state — the same context object validators already use. This demo shows when to reach for `hidden`, `disabled`, or `readonly` on a visible field, and how the toolkit wrappers keep each state legible without hand-rolled ARIA.

## Toolkit features showcased

- `hidden(path, { when })` — drops the invite-code field out of the form entirely until invite-only onboarding is active.
- `disabled(path, { when })` — keeps the mobile-number field visible but inert until SMS notifications are selected.
- `readonly(path, { when })` — locks the work-email field for display/copy once it's identity-provider managed, without hiding it.
- Consistent `{ when }` syntax — the same context (`ctx.valueOf(path.*)`) drives both these state functions and ordinary `required(path, { when, message })` rules.
- `NgxSignalFormToolkit` (`ngxSignalForm`) + `NgxFormField` wrapper — hidden/disabled/readonly states render correctly without custom ARIA plumbing.
- `ngxSignalFormControl="checkbox"` — explicit control semantics for the two toggles.
- `form(model, schema, { submission: { action, onInvalid } })` with `createOnInvalidHandler()` — declarative submission lifecycle.

## Form model

- Signal model: `signal<FieldStatePatternsModel>()` with `workEmail`, `contactPreference` (`'email' | 'sms'`), `mobileNumber`, `inviteOnly`, `inviteCode`, `managedByIdentityProvider`.
- Initial state: `workEmail` prefilled (`ada@company.com`), `contactPreference` set to `'email'`, all other fields empty/`false`.
- Schema: `form(model, fieldStatePatternsSchema, { submission })`.

## Validation rules

### Errors

- Work email — required; must be a valid email address; `readonly` when `managedByIdentityProvider` is checked.
- Mobile number — `disabled` unless `contactPreference` is `'sms'`; required with message "SMS notifications need a mobile number" when it is.
- Invite code — `hidden` unless `inviteOnly` is checked; required with message "Enter the invite code from your onboarding email" when it is.

### Warnings

- None.

## Strong suites

- The canonical reference for choosing between `hidden`, `disabled`, and `readonly` for a conditional workflow field.
- Makes the shared `{ when }` shape between field-state functions and validators concrete in one schema.
- The live state readout under the form shows exactly how each signal flips as inputs change.

## Key files

- [field-state-patterns.form.ts](field-state-patterns.form.ts) — schema with `hidden`/`disabled`/`readonly` rules, the form component, and the state-readout panel.
- [field-state-patterns.page.ts](field-state-patterns.page.ts) — page wrapper, appearance/orientation controls, and debugger.

## How to test

1. Run the demo and navigate to `/advanced-scenarios/field-state-patterns`.
2. Switch **Notification preference** to `SMS` → Mobile number becomes editable and `mobileNumber.disabled()` flips to `false`; submit with it empty → "SMS notifications need a mobile number".
3. Check **Invite-only onboarding** → the Invite code field appears and `inviteCode.hidden()` flips to `false`; submit empty → "Enter the invite code from your onboarding email".
4. Check **Managed by identity provider** → Work email locks (visible but uneditable) and `workEmail.readonly()` flips to `true`.
5. Uncheck it, clear **Work email** → "Work email is required"; type `ada@` → "Enter a valid work email address".
6. Click **Reset** → everything returns to the initial state (email prefilled, SMS off, invite code hidden).

## Related

- [Cross-Field Validation](../cross-field-validation/README.md) — dependent, sibling-aware validation rules.
- [Zod + Vest Validation](../zod-vest-validation/README.md) — layering structural and policy validation on top of field-state rules.
