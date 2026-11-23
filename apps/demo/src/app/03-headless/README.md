# Headless

Renderless directives and signal factories for teams that own their own markup and design system.

## Demos in this section

- **[fieldset-utilities](./fieldset-utilities/README.md):** headless error summary, fieldset aggregation, and `createErrorState()` / `createCharacterCount()` / `createFieldStateFlags()` factories. For label providers, see [global-configuration](../05-advanced/global-configuration/README.md).
- **[error-message-signal](./error-message-signal/README.md):** `createErrorMessageSignal()` across all three `includeWarnings` modes, with reactive error-message registries and `aria-describedby` wiring.

## Core concepts

- **Renderless directives.** Headless directives expose reactive state through template exports while you own every DOM node. See the [headless README](../../../../../packages/toolkit/headless/README.md).
- **State factories.** `createErrorState()`, `createCharacterCount()`, and `createFieldStateFlags()` return signals without rendering markup.
- **Fieldset aggregation.** `NgxHeadlessFieldset` aggregates group errors for custom summary blocks.
- **Field labels.** `provideFieldLabels()` customizes display names for error summaries and i18n.

## When to use this section

- Your design system controls field markup and styling, so the built-in wrapper is not a fit.
- Skip when the default wrapper layout fits; [04-form-field-wrapper](../04-form-field-wrapper/README.md) is faster to adopt.

## Next steps

- Continue to [04-form-field-wrapper](../04-form-field-wrapper/README.md) to compare the styled wrapper path.
- Or jump to [05-advanced](../05-advanced/README.md) for async validation, server errors, and wizards.
