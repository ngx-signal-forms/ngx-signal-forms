# Toolkit Core

> **Deep Dive:** Core toolkit behavior — error timing and warning semantics.

## 🎯 Purpose

This section covers the two UX fundamentals every team meets first: **when** validation feedback appears, and **how** to offer non-blocking guidance without resorting to custom code.

**Adoption level:** 100% toolkit (core directives + assistive components).

**Focus:** error display strategies and the `warn:*` convention.

## 📂 Demos in this section

- **[error-display-modes](./error-display-modes/README.md)** — switch a single form between `immediate`, `on-touch`, and `on-submit`.
  - What you'll learn: strategy inheritance via `[errorStrategy]` · reading the active strategy with `injectFormContext()` · conditional validation (`applyWhen`).
- **[warning-support](./warning-support/README.md)** — `warn:*` validation errors rendered as advisory guidance.
  - What you'll learn: the `warn:*` kind convention · `role="status"` vs `role="alert"` · warning-tolerant submission with `submitWithWarnings()`.

## 🧠 Core concepts

- **Error strategies** — `immediate` / `on-touch` / `on-submit`. See [toolkit README — error strategies](../../../../../packages/toolkit/README.md) and the full [validation strategy guide](../../../../../docs/VALIDATION_STRATEGY.md).
- **Warnings convention** — any `ValidationError` whose `kind` starts with `warn:` is treated as non-blocking. Background in [docs/WARNINGS_SUPPORT.md](../../../../../docs/WARNINGS_SUPPORT.md).
- **Strategy inheritance** — `[errorStrategy]` on `<form>` propagates to every descendant error component via DI; no prop drilling.
- **Submit helpers** — `submitWithWarnings()` is the supported escape hatch for manual submission when you can't use the declarative `{ submission }` option.

## 🤔 When to use this section

- Use when you need to reason about _when_ errors appear (quiet-until-submit vs. inline).
- Use when some rules should guide instead of block (weak passwords, disposable emails, policy thresholds).
- Skip when your form only needs the default `on-touch` strategy and has no advisory rules — [01-getting-started](../01-getting-started/README.md) already covers that case.

## 📦 Consolidated from earlier demos

Older standalone pages (accessibility comparison, field-state inspection) are not routed anymore. Their teaching goals are now covered by:

- [your-first-form](../01-getting-started/your-first-form/README.md) — accessibility onboarding.
- Debugger panels inside the active demos — runtime field state.

Archived folders remain in the repo for reference.

## ➡️ Next steps

- Continue to **[03-headless](../03-headless/README.md)** — renderless primitives for design systems that can't adopt the wrapper.
- Or jump to **[04-form-field-wrapper](../04-form-field-wrapper/README.md)** for the batteries-included wrapper path.
