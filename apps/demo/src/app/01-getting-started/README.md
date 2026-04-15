# Getting Started

> **First Steps:** Your introduction to `@ngx-signal-forms/toolkit`.

## 🎯 Purpose

This section is your entry point into the toolkit. It demonstrates the smallest possible setup that still delivers auto-ARIA, strategy-aware error timing, and a reusable error component — without pulling in the full field wrapper.

**Adoption level:** 20% toolkit (core directives only, no wrapper).

**Focus:** progressive error disclosure and automatic accessibility with minimal setup.

## 📂 Demos in this section

- **[your-first-form](./your-first-form/README.md)** — contact form onboarding (name / email / message).
  - What you'll learn: using `NgxSignalFormToolkit` · auto-ARIA with no manual `aria-*` plumbing · `NgxFormFieldErrorComponent` with `role="alert"` · switching between `immediate` / `on-touch` / `on-submit` strategies.

## 🧠 Core concepts

- **Auto-ARIA** — the toolkit syncs `aria-invalid`, `aria-required`, and `aria-describedby` automatically once you apply `ngxSignalForm` or the wrapper. See [toolkit README](../../../../../packages/toolkit/README.md).
- **Error strategy** — when errors become visible (`on-touch` by default). Deep dive in [error-display-modes](../02-toolkit-core/error-display-modes/README.md).
- **Assistive components** — `NgxFormFieldErrorComponent` handles visibility, message resolution, and ARIA without per-field `@if` blocks. See [assistive README](../../../../../packages/toolkit/assistive/README.md).

## 🤔 When to use this section

- Use when you want the fastest accessible-forms win without adopting the wrapper.
- Use as a baseline to fork when building a new form from scratch.
- Skip ahead to [04-form-field-wrapper](../04-form-field-wrapper/README.md) if you already want the full `NgxFormField` layout and hint/error projection.

## ➡️ Next steps

- Continue to **[02-toolkit-core](../02-toolkit-core/README.md)** — error display strategies and non-blocking warnings.
- Or jump to **[04-form-field-wrapper](../04-form-field-wrapper/README.md)** for the batteries-included path.
