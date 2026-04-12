# Vest-Only Validation

## Overview

This demo shows how to use `@ngx-signal-forms/toolkit/vest` when your form rules are mostly business policy.
Vest v6+ is required for Standard Schema support.
Every blocking rule comes from a single Vest suite, while Angular Signal Forms and the toolkit still handle field state, error timing, and rendering.
The first-class Vest adapter maps both blocking errors and advisory warnings from the same suite run.
The demo also enables Vest `warn()` output so non-blocking guidance appears through the same form-field wrappers.

If you are migrating from `ngx-vest-forms`, see
[`docs/MIGRATING_FROM_NGX_VEST_FORMS.md`](../../../../../docs/MIGRATING_FROM_NGX_VEST_FORMS.md)
for the quick API mapping and the advanced cases that still need deliberate review.

Warnings are displayed through `ngx-signal-form-field-wrapper`, which uses the same
`ngx-form-field-error` assistive component for both blocking errors and polite
warning status messages.

## Key files

- `vest-validation.form.ts` — demo form and wrapper integration.
- `vest-validation.validations.ts` — Vest suite with blocking rules plus warn-only guidance.
- `vest-validation.model.ts` — model types and initial values.
- `vest-validation.page.ts` — demo wrapper and debugger.

## How to test

1. Run the demo app.
2. Navigate to `/advanced-scenarios/vest-validation`.
3. Switch to `Business` and choose `DE`, `NL`, or `BE` without entering a VAT number.
4. Keep `Personal` and enter a team size above `10`.
5. Try `STARTER100` with more than `3` seats to trigger the referral policy.
6. Use a `gmail.com` address or more than `50` seats to trigger warnings that still allow submission.

## Submission pattern

This demo intentionally uses Angular Signal Forms declarative `submission` support
with `<form [formRoot]="accountForm">` instead of the toolkit
`submitWithWarnings()` helper.

Because Angular currently treats all `ValidationError`s as blocking, the demo configures
`submission: { ignoreValidators: 'all', action }` and then gates the action with
`hasOnlyWarnings(form().errorSummary())`.

With `[formRoot]`, Angular already sets `novalidate`, prevents the browser's default
submit behavior, and triggers the configured submission flow.

That keeps the example aligned with Angular 21.2 while still preserving the toolkit's
`warn:*` convention for advisory feedback and the adapter's single-run warning mapping.
