# Toolkit core

Covers the two core UX behaviors most teams configure first: when validation feedback appears and how non-blocking warnings work.

## Demos in this section

- **[error-display-modes](./error-display-modes/README.md):** switch a form between `immediate`, `on-touch`, and `on-submit`, with conditional required and custom checks.
- **[warning-support](./warning-support/README.md):** `warn:*` advisory messages and declarative submission with `ignoreValidators: 'all'` plus `hasOnlyWarnings()`.

## Core concepts

- **Error strategies.** `immediate`, `on-touch`, and `on-submit`. See the [toolkit README](../../../../../packages/toolkit/README.md) and [validation choices](../../../../../docs/VALIDATION_STRATEGY.md).
- **Warnings.** Any `ValidationError` whose `kind` starts with `warn:` is non-blocking when paired with the toolkit's submit helpers. See [docs/WARNINGS_SUPPORT.md](../../../../../docs/WARNINGS_SUPPORT.md).
- **Strategy inheritance.** `[errorStrategy]` on `<form ngxSignalForm>` propagates to descendant error and wrapper components via DI without prop drilling.
- **Submit helpers.** `submitWithWarnings()` is available for imperative submission when declarative `{ submission }` options do not fit.

## When to use this section

- You need to compare error timing modes or add non-blocking advisory rules.
- Skip if default `on-touch` timing with blocking errors is all you need.

## Next steps

- Continue to [03-headless](../03-headless/README.md) for renderless primitives.
- Or jump to [04-form-field-wrapper](../04-form-field-wrapper/README.md) for the styled wrapper.
