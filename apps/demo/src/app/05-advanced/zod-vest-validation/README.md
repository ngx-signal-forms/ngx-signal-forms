# Zod + Vest Validation

## Intent

Shows the practical layered strategy for non-trivial forms: use **Zod** for structural/contract rules (types, required, format, length) and **Vest** for business policy and advisory warnings. Both layers render through the same toolkit field wrappers and error-strategy controls.

## Toolkit features showcased

- `validateStandardSchema(path, zodSchema)` — Standard Schema adapter consuming Zod 4.
- `validateVest(path, suite, { includeWarnings: true })` — first-class Vest adapter mapping both blocking errors and `warn:*` advisories from the same suite run.
- Layered validators on one `form()` call — errors from both layers are rendered identically by the wrapper.
- `ngx-signal-form-field-wrapper` + `ngx-form-field-error` — uniform rendering of blocking errors and warnings.
- `[formRoot]` declarative submission with `ignoreValidators: 'all'` + `hasOnlyWarnings()` — warning-tolerant submission under Angular 21.2.

## Form model

- Signal model: `signal<ZodVestAccountModel>()` typed from the Zod schema.
- Schema: `form(model, composedSchema)` applying `validateStandardSchema` and `validateVest` on the same `path`.

## Validation rules

### Errors (from Zod — structural)

- Required/format/length rules per field come from `zodVestAccountSchema` (see the schemas file).
- Empty fields trigger Zod errors before the Vest suite runs policy checks.

### Errors (from Vest — policy)

- Business account using a free email (`gmail.com`, `outlook.com`, `yahoo.com`) — rejected.
- Password containing the user's first or last name — rejected.
- Business account in `DE`, `NL`, or `BE` without a VAT number — rejected.

### Warnings (from Vest)

- Password long enough but missing symbols — warning.
- VAT number missing the country prefix — warning.

## Strong suites

- Best reference when you want the type-safety of a schema _and_ the expressiveness of a rulebook in the same form.
- Clear separation of concerns: Zod guards the contract, Vest guards the policy.
- Demonstrates that two independent validation layers can share the toolkit rendering surface without special casing.

## Key files

- [zod-vest-validation.schemas.ts](zod-vest-validation.schemas.ts) — Zod schema and typed initial model.
- [zod-vest-validation.rules.ts](zod-vest-validation.rules.ts) — Vest business rules (errors + warnings).
- [zod-vest-validation.form.ts](zod-vest-validation.form.ts) — layered validator wiring and toolkit integration.
- [zod-vest-validation.page.ts](zod-vest-validation.page.ts) — page wrapper and debugger.

## How to test

1. Run the demo and navigate to `/advanced-scenarios/zod-vest-validation`.
2. Leave fields empty — confirm Zod structural errors render first.
3. Fill the fields, choose `Business`, and enter a `gmail.com` address — confirm the Vest policy error replaces the generic one.
4. Include your first or last name inside the password — confirm the Vest policy error.
5. Choose `Business` with `DE`, `NL`, or `BE` and leave VAT empty — confirm the blocking error.
6. Enter a long password with letters only (no symbols) — warning appears without blocking submission.
7. Enter a VAT number without the country prefix — warning appears without blocking submission.
8. Submit with only warnings present — confirm the action runs via `hasOnlyWarnings()` gating.

## Related

- [Vest-Only Validation](../vest-validation/README.md) — when Vest alone is enough.
- [Warning Support](../../02-toolkit-core/warning-support/README.md) — toolkit-only warning convention.
