# Cross-Field Validation

## Intent

Validating a single field is easy; validating _relationships_ between fields ("check-out must be after check-in", "this promo only applies when guest count is small") depends on multiple signals. This demo shows how to use `validate()` with `ctx.valueOf(path.*)` to reach sibling values cleanly.

## Toolkit features showcased

- `validate(path, (ctx) => …)` — schema-level cross-field validator.
- `ctx.valueOf(path.sibling)` — the supported way to read another field's value from inside a validator.
- Custom `kind` strings (`dateRange`, `invalidPromo`) — routed to the matching error messages by the toolkit.
- `NgxFormField` wrapper + `NgxFormFieldHint` — hint text that explains the cross-field rule in-line.
- `createOnInvalidHandler()` — focus-first-invalid on submit.

## Form model

- Signal model: `signal<Booking>({ checkIn, checkOut, guests, promoCode })`.
- Schema: `form(model, bookingSchema, { submission })`.

## Validation rules

### Errors

- Check-in — required.
- Check-out — required; must be strictly after check-in (`dateRange`).
- Guests — required; min 1; max 10.
- Promo code — `STARTER100` / `SMALLGROUP` only valid when guests ≤ 4 (`invalidPromo`).

### Warnings

- None.

## Strong suites

- Cleanest reference for reading sibling values from a validator without touching the signal model directly.
- Shows the design decision point ("attach error to field vs. group") in practice — errors land on the secondary field (`checkOut`, `promoCode`), not the parent group.
- Validators fire reactively when either side of the relationship changes.

## Key files

- [cross-field-validation.form.ts](cross-field-validation.form.ts) — schema, cross-field validators, wrapper wiring.
- [cross-field-validation.page.ts](cross-field-validation.page.ts) — page wrapper.

## How to test

1. Run the demo and navigate to `/advanced-scenarios/cross-field-validation`.
2. Pick a check-out date _before_ the check-in date — confirm the `dateRange` error appears on check-out.
3. Change the check-in date so the range becomes valid — confirm the error clears without touching check-out.
4. Enter promo code `SMALLGROUP` with guests ≤ 4 — no error.
5. Bump the guests count to 6 — confirm the promo field invalidates immediately (validator runs on sibling change).
6. Submit an invalid form and confirm focus lands on the first invalid cross-field error.

## Related

- [Async Validation](../async-validation/README.md) — server-backed validators.
- [Advanced Wizard](../advanced-wizard/README.md) — cross-step (not just cross-field) validation.
