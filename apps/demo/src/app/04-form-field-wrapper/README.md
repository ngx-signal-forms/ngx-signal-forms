# Form field wrapper

Wrapper-based form composition with `@ngx-signal-forms/toolkit/form-field`. One component (`ngx-form-field-wrapper`) handles labels, layout, errors, warnings, hints, character counts, and ARIA.

## Demos in this section

- **[complex-forms](./complex-forms/README.md):** nested objects, dynamic arrays, `NgxFormFieldset`, and mixed controls (including `ngxSignalFormControl="checkbox"`).
- **[fieldset-appearance](./fieldset-appearance/README.md):** `feedbackAppearance`, `surfaceTone`, `validationSurface`, `listStyle`, and `includeNestedErrors`.
- **[custom-controls](./custom-controls/README.md):** `FormValueControl` controls, field-shaped comboboxes, sliders with `ariaMode: 'manual'`, and component-scoped presets.
- **[field-marking](./field-marking/README.md):** `showMarkerWhen` (`required`, `optional`, `none`), custom markers, and `NgxFormMarkingLegend`.
- **[labelless-fields](./labelless-fields/README.md):** wrappers without projected labels, `aria-label` accessible names, and `role="group"` layouts.
- **[brand-theming](./brand-theming/README.md):** public CSS custom properties, light and dark mode, and stateful colors.
- **[field-identity](./field-identity/README.md):** a custom wrapper composing `NgxFieldIdentityProvider` inside a collapsible container.

## Core concepts

- **The wrapper.** `ngx-form-field-wrapper` projects labels, controls, hints, and counters into a consistent layout. See the [form-field README](../../../../../packages/toolkit/form-field/README.md).
- **Appearances.** `standard`, `outline`, and `plain`. Theme with CSS custom properties; see the [theming guide](../../../../../packages/toolkit/form-field/THEMING.md).
- **Control semantics.** Declare `ngxSignalFormControl` when native inference does not cover the control. Native checkboxes with `role="switch"` infer automatically, while third-party switches (`mat-slide-toggle`, `p-toggleswitch`, Spartan switch) put `role="switch"` on an inner element and need `ngxSignalFormControl="switch"`. See [ADR-0001](../../../../../docs/decisions/0001-control-semantics-architecture.md) and [docs/CUSTOM_CONTROLS.md](../../../../../docs/CUSTOM_CONTROLS.md).
- **Fieldset grouping.** `<ngx-form-fieldset>` aggregates group-level errors and optional nested errors. See [docs/COMPLEX_NESTED_FORMS.md](../../../../../docs/COMPLEX_NESTED_FORMS.md).

## When to use this section

- You want one reusable field shell with built-in layout, markers, hints, errors, and theming.
- Skip when your design system owns all field markup; use [03-headless](../03-headless/README.md) instead.

## Next steps

- Continue to [05-advanced](../05-advanced/README.md) for submission patterns, async validation, server errors, and wizards.
- Or revisit [02-toolkit-core](../02-toolkit-core/README.md) to compare error display strategies.
