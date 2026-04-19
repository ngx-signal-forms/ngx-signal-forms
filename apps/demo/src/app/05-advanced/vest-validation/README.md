# Vest-Only Validation

## Intent

When your form rules are mostly business policy (tier-specific limits, referral codes, billing thresholds), a Vest suite is more expressive than per-field schema calls. This demo wires a Vest v6+ suite to the toolkit via `validateVest`, so a single suite run produces both blocking errors and `warn:*` advisories, which the toolkit renders with the same components it uses for everything else.

## Toolkit features showcased

- `validateVest(path, suite, { includeWarnings: true })` — first-class Vest adapter from `@ngx-signal-forms/toolkit/vest`.
- Shared-run semantics — a single Vest suite invocation emits both errors and warnings, mapped to matching fields.
- Warning rendering through `ngx-form-field-wrapper` (shared with `ngx-form-field-error`).
- Declarative submission with `ignoreValidators: 'all'` + `hasOnlyWarnings()` gating — warning-tolerant submission under Angular 21.2's native API.
- `[formRoot]` directive — auto-applies `novalidate` and orchestrates submit.

## Form model

- Signal model: `signal<VestValidationModel>({ accountType, country, workEmail, teamSize, companyName, vatNumber, referralCode })`.
- Schema: `form(model, schemaThatWraps(validateVest(…, vestOnlyAccountSuite)))`.

## Validation rules

### Errors

- Account type — required.
- Country — required.
- Work email — required; valid format.
- Team size — required integer between 1 and 200.
- Company name — required for `business` accounts.
- Team size — personal accounts capped at 10 seats.
- VAT number — required for business accounts in `DE`, `NL`, or `BE`.
- Referral code — `STARTER100` valid only for personal accounts with ≤ 3 seats.

### Warnings

- `warn` — work email on a free provider (`gmail.com`, `outlook.com`, `yahoo.com`) — suggests a company email.
- `warn` — team size above 50 — suggests annual billing review.

## Strong suites

- The right pick when rules read more naturally as a rulebook than a schema: conditional requirements, policy thresholds, cross-field gating.
- One suite file owns every rule — blocking and advisory — with no duplication between error and warning logic.
- Shows the supported warning-tolerant submission pattern for Angular 21.2 (`ignoreValidators: 'all'` + post-submit gate).

## Key files

- [vest-validation.validations.ts](vest-validation.validations.ts) — Vest suite (blocking + `warn()`).
- [vest-validation.form.ts](vest-validation.form.ts) — form wiring and wrapper integration.
- [vest-validation.model.ts](vest-validation.model.ts) — model type and initial values.
- [vest-validation.page.ts](vest-validation.page.ts) — page wrapper and debugger.

## How to test

1. Run the demo and navigate to `/advanced-scenarios/vest-validation`.
2. Switch to `Business`, choose `DE`, `NL`, or `BE`, leave VAT empty — blocking error.
3. Keep `Personal`, enter a team size above `10` — blocking error.
4. Enter `STARTER100` as referral with more than 3 seats — blocking error.
5. Use a `gmail.com` work email — warning appears but submission stays available.
6. Enter a team size above 50 — warning appears but submission stays available.
7. Submit with only warnings present — confirm the action runs via `hasOnlyWarnings()` gating.

## Migration

If you are coming from `ngx-vest-forms`, see [`docs/MIGRATING_FROM_NGX_VEST_FORMS.md`](../../../../../docs/MIGRATING_FROM_NGX_VEST_FORMS.md) for the API mapping.

## Related

- [Zod + Vest Validation](../zod-vest-validation/README.md) — layered strategy combining structural and policy rules.
- [Warning Support](../../02-toolkit-core/warning-support/README.md) — toolkit-only warning convention without Vest.
