# Zod-Only Validation

## Intent

This route is the smallest advanced baseline for Zod validation with Angular Signal Forms. It demonstrates structural contract checks only, using `validateStandardSchema(path, zodSchema)` without additional policy layers.

## Toolkit features showcased

- `validateStandardSchema(path, zodSchema)` — Standard Schema adapter consuming Zod.
- `form(model, schema, { submission })` with declarative submit handling.
- `ngx-form-field-wrapper` rendering for baseline structural errors.
- Display controls that let you compare timing (`on-touch`, `on-dirty`, `always`) and wrapper appearance.

## Form model

- Signal model typed from Zod: `signal<z.input<typeof zodBaselineAccountSchema>>()`.
- Schema: one Zod object defining required fields, format, and minimum length.

## Validation rules

### Errors (from Zod)

- First name and last name are required.
- Email is required and must be valid.
- Password must be at least 12 characters.
- Account type and country must be selected.

## Strong suites

- Canonical baseline for Zod + Angular Signal Forms integration.
- Useful as a teaching and regression reference before layering Vest.
- Makes separation of concerns explicit when compared to `zod-vest-validation`.

## Key files

- [zod-validation.schemas.ts](zod-validation.schemas.ts) — Zod schema and model factory.
- [zod-validation.form.ts](zod-validation.form.ts) — form wiring and baseline UI.
- [zod-validation.page.ts](zod-validation.page.ts) — page wrapper and debugger.
- [zod-validation.content.ts](zod-validation.content.ts) — educational cards.

## Related

- [Vest-Only Validation](../vest-validation/README.md)
- [Zod + Vest Validation](../zod-vest-validation/README.md)
