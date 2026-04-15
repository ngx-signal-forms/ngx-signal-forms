# Form Field Wrapper

> **Production Ready:** Wrapper-based form composition with `NgxFormField`.

## 🎯 Purpose

This section demonstrates the batteries-included path: one component (`ngx-signal-form-field-wrapper`) gives you labels, layout, errors, hints, character counts, and full ARIA in a single projection-friendly shell. It's the right default for most apps.

**Adoption level:** 100% toolkit (core + form-field entry point).

**Focus:** wrapper composition in realistic long forms and custom-control integration with explicit semantics.

## 📂 Demos in this section

- **[complex-forms](./complex-forms/README.md)** — realistic form with nested objects, dynamic arrays, grouped fieldsets, and mixed control families.
  - What you'll learn: nested schemas · array add/remove wiring · `NgxSignalFormFieldset` aggregation · explicit `ngxSignalFormControl="switch"` / `"checkbox"` semantics for projection-safe rows.
- **[custom-controls](./custom-controls/README.md)** — star rating, native switch, and slider integrated into the wrapper.
  - What you'll learn: `FormValueControl` contract (no `ControlValueAccessor`) · `ngxSignalFormControl="slider"` with `ariaMode: 'manual'` · component-scoped presets.

## 🧠 Core concepts

- **The wrapper** — `ngx-signal-form-field-wrapper` projects label, control, hints, and errors into a consistent layout. API reference in [form-field README](../../../../../packages/toolkit/form-field/README.md).
- **Appearances** — `stacked` / `outline` / `plain` via the `appearance` input. Theme with CSS custom properties; see [theming guide](../../../../../packages/toolkit/form-field/THEMING.md).
- **Control semantics** — `ngxSignalFormControl="switch|checkbox|slider"` makes projection explicit instead of guessed. Background in [ADR-0001](../../../../../docs/decisions/0001-control-semantics-architecture.md) and [docs/CUSTOM_CONTROLS.md](../../../../../docs/CUSTOM_CONTROLS.md).
- **Fieldset grouping** — `<ngx-signal-form-fieldset>` aggregates descendant errors for grouped layouts. See [docs/COMPLEX_NESTED_FORMS.md](../../../../../docs/COMPLEX_NESTED_FORMS.md).

## 🤔 When to use this section

- Use when you want one component to cover every field without handwiring labels, errors, and hints.
- Use when your form has nested objects, arrays, or mixed control types (switches, checkboxes, custom sliders).
- Skip when your design system forbids the wrapper's DOM shape — use [03-headless](../03-headless/README.md) instead.

## 📦 Consolidated from earlier demos

Older isolated pages (`basic-usage`, `fieldset-grouping`) are no longer routed. Their teaching goals live inside `complex-forms` now. Archived folders remain in the repo for reference.

## ➡️ Next steps

- Continue to **[05-advanced](../05-advanced/README.md)** — submission patterns, async validation, multi-step wizards, and business-rule validators.
- Or revisit **[02-toolkit-core](../02-toolkit-core/README.md)** if you need to compare error strategies before picking a default.
