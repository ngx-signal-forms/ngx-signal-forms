# Advanced Scenarios

> **Production Ready:** Patterns for real applications — configuration, submission, async, cross-field, business rules, and multi-step wizards.

## 🎯 Purpose

This is the production frontier of the demo app. Each demo here stands on its own and targets a concrete real-world pattern you'd hit when shipping a non-trivial form: app-wide configuration, declarative submission UX, async server-backed validation, dependent fields, layered validation libraries, and multi-step flows with shared store state.

**Adoption level:** 100% toolkit.

**Prereqs:** familiarity with [02-toolkit-core](../02-toolkit-core/README.md) (strategies + warnings) and ideally [04-form-field-wrapper](../04-form-field-wrapper/README.md) (wrapper).

## 📂 Demos in this section

- **[global-configuration](./global-configuration/README.md)** — `provideNgxSignalFormsConfig()` + control-family presets with a local override.
  - What you'll learn: app-level defaults · reading resolved config at runtime · form-level override semantics.
- **[submission-patterns](./submission-patterns/README.md)** — declarative submission via `form(..., { submission })` + `[formRoot]`.
  - What you'll learn: `createOnInvalidHandler()` · submitting state · GOV.UK-style error summary with click-to-focus.
- **[advanced-wizard](./advanced-wizard/README.md)** — canonical multi-step wizard with NgRx Signal Store, Zod schemas, and lazy step loading.
  - What you'll learn: form-per-step architecture · draft vs. committed state · cross-step validation · `@defer` lazy loading.
- **[async-validation](./async-validation/README.md)** — `validateHttp` with automatic cancellation and pending state.
  - What you'll learn: `pending()` / `status()` signals · suffix projection for loading indicators · gating submission on pending validators.
- **[cross-field-validation](./cross-field-validation/README.md)** — validators that read sibling values via `ctx.valueOf(path.*)`.
  - What you'll learn: schema-level cross-field rules · reactive re-validation · field-vs-group error placement.
- **[vest-validation](./vest-validation/README.md)** — Vest v6+ suites via `validateVest()` from `@ngx-signal-forms/toolkit/vest`.
  - What you'll learn: Standard Schema support · blocking + `warn()` from one suite run · warning-tolerant submission.
- **[zod-vest-validation](./zod-vest-validation/README.md)** — layered strategy: Zod for contract rules, Vest for business policy.
  - What you'll learn: composing `validateStandardSchema` + `validateVest` on the same path · separation of concerns.

## 🧠 Core concepts

- **Declarative submission** — `form(model, schema, { submission: { action, onInvalid } })` with `[formRoot]` removes manual `preventDefault`, submitting flags, and invalid-focus plumbing. See [toolkit README](../../../../../packages/toolkit/README.md).
- **Layered validation** — Angular validators, Standard Schema (Zod/OpenAPI), and Vest are complementary. Full guide: [docs/VALIDATION_STRATEGY.md](../../../../../docs/VALIDATION_STRATEGY.md).
- **Async validators** — `validateHttp(path, { request, onSuccess, onError })` cancels in-flight work on value change; the toolkit reflects `pending()` in its rendering surface.
- **Global configuration** — `provideNgxSignalFormsConfig()` and `provideNgxSignalFormControlPresets()` apply to every form unless locally overridden.
- **Warning-tolerant submission** — two supported paths: `submitWithWarnings()` (manual) and declarative `ignoreValidators: 'all'` + `hasOnlyWarnings()` (preferred when using `{ submission }`).

## 🤔 When to use this section

- Use each demo à la carte — they are independent patterns, not a progression.
- Use `global-configuration` + `submission-patterns` together as the foundation of any production form.
- Use `vest-validation` / `zod-vest-validation` when rules read more naturally as a rulebook than a schema.
- Use `advanced-wizard` as the reference when cross-step validation, draft state, or lazy step loading is on the table.

## ➡️ Next steps

- You're at the end of the guided path. Browse the package docs for deeper reference:
  - [Core toolkit](../../../../../packages/toolkit/README.md)
  - [Form field wrapper](../../../../../packages/toolkit/form-field/README.md)
  - [Headless primitives](../../../../../packages/toolkit/headless/README.md)
  - [Vest integration](../../../../../packages/toolkit/vest/README.md)
- Or revisit the [root README](../../../../../README.md) for the full "which part do I need" decision table.
