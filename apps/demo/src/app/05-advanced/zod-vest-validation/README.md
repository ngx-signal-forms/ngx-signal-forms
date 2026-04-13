# Zod + Vest Validation

## Overview

This demo shows a practical layered strategy (requires Vest v6+ for Standard Schema):

- `validateStandardSchema(path, zodVestAccountSchema)` for structural and contract rules
- `validateVest(path, zodVestBusinessSuite, { includeWarnings: true })` for business policy and warnings

The toolkit renders both layers through the same field wrappers and error timing controls.
The first-class Vest adapter also maps blocking errors and advisory warnings from the same Vest suite run.

Warnings are displayed through `ngx-signal-form-field-wrapper`, which internally uses
`ngx-form-field-error` to render blocking messages as alerts and Vest warnings as
polite status updates.

## Key files

- `zod-vest-validation.form.ts` — layered form setup and toolkit integration.
- `zod-vest-validation.schemas.ts` — Zod schema and typed initial model.
- `zod-vest-validation.rules.ts` — Vest business rules.
- `zod-vest-validation.page.ts` — demo wrapper and debugger.

## How to test

1. Run the demo app.
2. Navigate to `/advanced-scenarios/zod-vest-validation`.
3. Leave fields empty to trigger Zod structural errors.
4. Choose `Business` and enter a `gmail.com`, `yahoo.com`, or `outlook.com` address.
5. Include your first or last name in the password.
6. Choose `Business` with `DE`, `NL`, or `BE` and leave VAT empty.
7. Keep the password long enough but remove symbols, or omit the VAT country prefix, to trigger warnings that do not block submission.

## Submission pattern

This demo uses Angular Signal Forms declarative `submission` support and keeps
warnings advisory by combining `ignoreValidators: 'all'` with a post-submit
`hasOnlyWarnings(...)` check.

With `[formRoot]`, Angular already disables native browser validation, prevents the
default form submission, and invokes the configured submission flow.

That matches Angular 21.2's native API while still demonstrating the toolkit warning
convention used by `validateVest(..., { includeWarnings: true })` and the adapter's
shared-run behavior.
