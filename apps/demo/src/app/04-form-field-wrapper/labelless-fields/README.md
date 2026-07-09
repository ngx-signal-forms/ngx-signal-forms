# Labelless Form Fields

## Intent

Not every field needs a visible `<label>`. This demo shows where the `NgxFormField` wrapper's reserved label space can legitimately collapse — search bars, grouped fields under a shared heading, card-labelled inputs — while still exposing an accessible name via `aria-label`.

## Toolkit features showcased

- `NgxSignalFormToolkit` (`ngxSignalForm`) — root directive for auto-ARIA and form context.
- `NgxFormField` wrapper (`ngx-form-field-wrapper`) — collapses the reserved label row (standard/plain) or floating-label padding (outline) when no `<label>` is projected, across both orientations.
- Prefix/suffix projection — search icon prefix, `$` prefix and `.00` suffix on the amount field.
- `role="group"` + `aria-labelledby` — grouping the three phone-number parts under one heading instead of three labels.
- Error messages that keep the wrapper's full width even when the input itself is narrowed via CSS (age, ZIP).
- `createOnInvalidHandler()` — used in the form's `onInvalid` submission handler.

## Form model

- Signal model: `signal<LabellessFieldsModel>()` with `searchQuery`, `phoneCountry` / `phoneNumber` / `phoneExtension`, `amount`, `comparison`, `age`, `zipCode`, `otp`.
- Schema: `form(model, labellessFieldsSchema, { submission })`.

## Validation rules

### Errors

- Phone group — `phoneCountry` required; `phoneNumber` min length 7.
- Amount — `min(path.amount, 1)`, "Amount must be greater than 0".
- Age — required, `min` 18, `max` 120.
- Zip code — pattern `12345` or `12345-6789`.
- OTP — pattern requiring exactly six digits.

### Warnings

- None.

## Strong suites

- The reference for deciding when a label is genuinely redundant versus when omitting one hurts usability.
- Proves the wrapper's layout collapse works identically across all three appearances and both orientations.
- Pairs narrow inputs (`max-width` on the `<input>`, not the wrapper) with deliberately long error copy to show the error region always keeps the wrapper's full width.

## Key files

- [labelless-fields.form.ts](labelless-fields.form.ts) — component, model wiring, and the CSS that narrows individual inputs.
- [labelless-fields.html](labelless-fields.html) — the five labelless patterns (search, grouped phone, card-labelled amount, with/without comparison, narrow inputs).
- [labelless-fields.validations.ts](labelless-fields.validations.ts) — validation schema with the wide error messages.
- [labelless-fields.page.ts](labelless-fields.page.ts) — page wrapper, appearance/orientation controls, and debugger.

## How to test

1. Run the demo and navigate to `/form-field-wrapper/labelless-fields`.
2. Inspect the **Search** input's accessible name (DevTools Accessibility pane) → it's "Search", from `aria-label`, not the placeholder.
3. Type `555` in **phone number**, tab away → "Phone number must be at least 7 digits"; leave country code empty → "Country code is required".
4. Tab off **Amount** and **Age** without values → "Amount must be greater than 0" and "Must be 18 or older" both render at full wrapper width despite the narrow inputs.
5. Type `1234` in **Zip** → "Format: 12345 or 12345-6789"; type `12345` in **passcode** → "Enter all six digits".
6. Switch orientation to horizontal → the label column collapses for every labelless field; compare against section 4's "with vs without label" pair.

## Related

- [Field Marking](../field-marking/README.md) — another per-field wrapper micro-behavior demo (required/optional markers).
- [Submission Patterns](../../05-advanced/submission-patterns/README.md) — declarative submission and the GOV.UK-style error summary.
