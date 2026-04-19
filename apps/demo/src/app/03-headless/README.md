# Headless

> **Bring your own markup:** Renderless primitives and utilities for custom UI systems.

## 🎯 Purpose

This section is the escape hatch for teams that cannot adopt the `NgxFormField` wrapper — usually because they own a design system with its own markup and styling conventions. You get the toolkit's state, visibility rules, and aggregation logic as renderless directives and plain factory functions.

**Adoption level:** 100% toolkit (headless entry point only, no wrapper).

**Focus:** renderless directives, composable state utilities, and custom error summaries.

## 📂 Demos in this section

- **[fieldset-utilities](./fieldset-utilities/README.md)** — headless fieldset grouping plus the `createErrorState` / `createCharacterCount` / `createFieldStateFlags` utilities applied to a delivery form.
  - What you'll learn: `NgxHeadlessToolkit` bundle · `ngxHeadlessErrorSummary` click-to-focus · `ngxHeadlessFieldset` aggregation · composing custom UI from utility factories · `provideFieldLabels()` for custom summary labels.

## 🧠 Core concepts

- **Renderless directives** — headless directives expose state via template context; you own every DOM node. See [headless README](../../../../../packages/toolkit/headless/README.md).
- **State utilities** — `createErrorState()`, `createCharacterCount()`, `createFieldStateFlags()` are plain factories you can call from any component or directive, with no rendering opinion.
- **Fieldset aggregation** — the headless fieldset directive aggregates errors of every descendant field for a clickable summary or group-level UX.
- **Field-label customization** — `provideFieldLabels()` resolves field names for summaries and error messages (useful for i18n).

## 🤔 When to use this section

- Use when your design system dictates markup and the wrapper is off the table.
- Use when you need toolkit state (error visibility, aggregation, character counts) without any of its rendering.
- Skip when the default wrapper layout is fine — [04-form-field-wrapper](../04-form-field-wrapper/README.md) is faster to adopt.

## ➡️ Next steps

- Continue to **[04-form-field-wrapper](../04-form-field-wrapper/README.md)** — to compare the wrapper path against the headless one.
- Or jump to **[05-advanced](../05-advanced/README.md)** for production patterns like async validation and multi-step wizards.
