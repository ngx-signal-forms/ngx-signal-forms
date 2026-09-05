# Headless Fieldset + Utilities

## Intent

Shows the headless bundle for teams that want full control over markup and styling. Uses renderless directives for fieldset grouping and form summaries, plus composable utilities (`createErrorState`, `createCharacterCount`, `createFieldStateFlags`) to build custom UI sections without bringing in the wrapper component.

## Toolkit features showcased

- `NgxHeadlessToolkit` — barrel import for the headless directive bundle.
- `ngxHeadlessErrorSummary` — clickable, strategy-aware form-level summary.
- `ngxHeadlessFieldset` — grouped state and aggregated errors.
- `ngxHeadlessErrorState` — per-field error visibility driven by the active strategy.
- `ngxHeadlessFieldName` resolves field identity and feedback IDs, not display labels.
- `createErrorState()`, `createCharacterCount()`, `createFieldStateFlags()` — composable factories for custom UI.
- For `provideFieldLabels()`, see the [global configuration demo](../../05-advanced/global-configuration/README.md).

## Form model

- Signal model: `signal<HeadlessDeliveryModel>()`.
- Schema: `form(model, deliverySchema)`.

## Validation rules

### Errors

- Contact email — required; email format.
- Address street — required; min length.
- Address city — required; min length.
- Address postal code is required, with minimum length five.
- Delivery notes — max length 200.

### Warnings

- `warn:postal-format` — postal code does not match ZIP pattern.
- `warn:short-notes` — delivery notes shorter than 20 characters.

## Strong suites

- The go-to reference for design systems that cannot adopt the `NgxFormField` wrapper and need to own every DOM node.
- Utilities demonstrate that error/character/flag state are available as plain functions — no component needed.
- Combines headless state with root and assistive imports for custom rendering.

## Key files

- [fieldset-utilities.form.ts](fieldset-utilities.form.ts) — headless directives and utility composition.
- [fieldset-utilities.page.ts](fieldset-utilities.page.ts) — page wrapper and debugger.

## How to test

1. Run the demo and navigate to `/headless/fieldset-utilities`.
2. Submit an empty form — observe the clickable summary aggregate every error; click an entry to focus its control.
3. Type `1234` in postal code. It produces a format warning and a blocking minimum-length error. This demo uses ordinary submission, which also blocks warning-only invalidity.
4. Type fewer than 20 characters in delivery notes to trigger the short-notes warning.
5. Watch the character count section update live via `createCharacterCount()`.
6. Inspect aggregated fieldset errors in the address group.

## Related

- [Complex Forms](../../04-form-field-wrapper/complex-forms/README.md) — the wrapper-based equivalent.
- [Submission Patterns](../../05-advanced/submission-patterns/README.md) — shares the error-summary idea with assistive components.
