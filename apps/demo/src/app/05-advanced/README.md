# Advanced Scenarios

> **Production Ready:** Patterns for real applications — configuration, submission, async state, cross-field rules, and multi-step wizards.

## 🎯 Purpose

This is the production frontier of the demo app. Each demo here stands on its own and targets a concrete real-world pattern you'd hit when shipping a non-trivial form: app-wide configuration, declarative submission UX, async server-backed validation, dependent fields, and multi-step flows with shared store state.

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
- **[field-state-patterns](./field-state-patterns/README.md)** — dynamic `hidden`, `disabled`, and `readonly` state driven by the same `{ when }` syntax as validation rules.
  - What you'll learn: choosing the right state for conditional workflows · state-driven UX without manual DOM branching.
- **[cross-field-validation](./cross-field-validation/README.md)** — validators that read sibling values via `ctx.valueOf(path.*)`.
  - What you'll learn: schema-level cross-field rules · reactive re-validation · field-vs-group error placement.

## 🧠 Core concepts

- **Declarative submission** — `form(model, schema, { submission: { action, onInvalid } })` with `[formRoot]` removes manual `preventDefault`, submitting flags, and invalid-focus plumbing. See [toolkit README](../../../../../packages/toolkit/README.md).
- **Async validators** — `validateHttp(path, { request, onSuccess, onError })` cancels in-flight work on value change; the toolkit reflects `pending()` in its rendering surface.
- **Global configuration** — `provideNgxSignalFormsConfig()` and `provideNgxSignalFormControlPresets()` apply to every form unless locally overridden.
- **Warning-tolerant submission** — two supported paths: `submitWithWarnings()` (manual) and declarative `ignoreValidators: 'all'` + `hasOnlyWarnings()` (preferred when using `{ submission }`).
- **Validation strategies** — Standard Schema (Zod/OpenAPI) and Vest now have a dedicated Validation section when you want to compare contract vs. policy layers directly. Full guide: [docs/VALIDATION_STRATEGY.md](../../../../../docs/VALIDATION_STRATEGY.md).

## 🤔 When to use this section

- Use each demo à la carte — they are independent patterns, not a progression.
- Use `global-configuration` + `submission-patterns` together as the foundation of any production form.
- Visit the dedicated Validation section before this one when you are deciding between Standard Schema baselines, Vest policy rules, or a layered approach.
- Use `advanced-wizard` as the reference when cross-step validation, draft state, or lazy step loading is on the table.

## ➡️ Next steps

- You're at the end of the guided path. Browse the package docs for deeper reference:
  - [Core toolkit](../../../../../packages/toolkit/README.md)
  - [Form field wrapper](../../../../../packages/toolkit/form-field/README.md)
  - [Headless primitives](../../../../../packages/toolkit/headless/README.md)
  - [Vest integration](../../../../../packages/toolkit/vest/README.md)
- Or revisit the [root README](../../../../../README.md) for the full "which part do I need" decision table.
