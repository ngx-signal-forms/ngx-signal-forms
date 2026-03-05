# Changelog

## `@ngx-signal-forms/toolkit` `1.0.0-beta.5` (2026-03-02)

This release aligns the toolkit and demos with Angular `21.2.0`, standardizes declarative submission patterns, and introduces important API/behavior changes.

---

## 🚨 Breaking Changes

- `NgxSignalFormDirective` now targets **only** `form[formRoot]`.
  - Implicit selector behavior for `form(submit)` is removed.
- `canSubmit()` and `isSubmitting()` were removed from `@ngx-signal-forms/toolkit`.
  - Use native Angular Signal Forms state instead:
    - `form().valid()`
    - `form().submitting()`

---

## Added

- `createOnInvalidHandler()` utility for declarative invalid-submit handling.
  - Default behavior supports focusing the first invalid field.
- Dedicated migration guide:
  - `docs/archive/MIGRATION_BETA5.md`

---

## Changed

### Angular baseline

- Workspace Angular baseline updated to `21.2.0`.
- Toolkit peer dependency baseline updated to `>=21.2.0` for `@angular/core` and `@angular/forms`.
- Lockfile updated to reflect consistent Angular `21.2.0` resolution.

### Toolkit core behavior

- `NgxSignalFormDirective` now replicates Angular `FormRoot` behavior and requires explicit `[formRoot]` binding.
- Submission flow aligned with Angular `21.2` form lifecycle (`submitting()` / `focusBoundControl()` conventions).
- Error visibility implementation modernized around `showErrors()` internals.
- Validation message defaults extended with parse fallback (`parse` → `Invalid value`).

### Demos and examples

- Demo forms migrated from manual `(submit)` + `event.preventDefault()` patterns to declarative:
  - `<form [formRoot]="form">`
  - `form(..., { submission: { action, onInvalid } })`
- Submission state examples now use native form signals (`form().submitting()`), with inline computed helpers where needed.
- Manual orchestration retained only in explicitly custom flows (e.g. warning/stepper scenarios), while still using `[formRoot]` context.

### Documentation and guidance

- Root and package docs updated to reflect declarative submission as the preferred path.
- Skills/instructions updated to match Angular `21.2` + toolkit `beta.5` patterns.
- Upgrade notes and migration references added to key documentation entry points.

---

## Migration Notes

If upgrading from earlier beta versions:

1. Ensure Angular resolves to `21.2.0`.
2. Replace implicit/manual toolkit form wiring with explicit `[formRoot]` where applicable.
3. Replace `canSubmit()` / `isSubmitting()` usages with native `form().valid()` / `form().submitting()`.
4. Prefer declarative `submission` config in `form()`.
5. Use `createOnInvalidHandler()` for consistent invalid-submit UX.

Full guide: `docs/archive/MIGRATION_BETA5.md`

---

## Commits in this release scope

- `21eca25` — `chore(deps): align workspace to Angular 21.2.0`
- `2a2702e` — `feat(toolkit-core)!: align form directives with Angular 21.2 FormRoot`
- `4aeddee` — `refactor(demo): migrate examples to declarative Signal Forms submission`
- `387a7a7` — `docs(migration): add beta.5 guide and align submission guidance`
