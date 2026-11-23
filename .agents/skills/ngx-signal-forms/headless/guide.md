# Toolkit Headless

Use `@ngx-signal-forms/toolkit/headless` when you own all feedback markup or build a custom design-system wrapper.
Use [form-field/guide.md](../form-field/guide.md) for a complete styled shell or [assistive/guide.md](../assistive/guide.md) for ready-made feedback components.

## Workflow

1. Choose a template directive (`NgxHeadlessToolkit`), a host directive, or a reactive factory. Confirm exact signatures via [api.md](../references/api.md).
2. Supply deterministic field identity (`fieldName`). Only `NgxHeadlessFieldName` falls back to its host `id`; keep unresolved IDs `null`.
3. Choose one ARIA writer. Prefer auto-ARIA on ordinary controls; for manual markup, opt out on the bound control host with `ngxSignalFormControlAria="manual"` (headless directives do not disable auto-ARIA).
4. Load the applicable branch in [headless-composition.md](../references/headless-composition.md) before writing code. Resolve error and warning timing independently and render resolved messages rather than optional raw `error.message`.

## Branch references

| Branch                                                              | Read                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field presentation for custom wrappers (`createFieldPresentation`)  | [Field presentation](../references/headless-composition.md#field-presentation-for-wrappers)                                                                                                                                                    |
| Manual ARIA or design-system `aria-describedby` bridge              | [Manual ARIA example](../references/headless-composition.md#manual-aria-example)                                                                                                                                                               |
| Reusable wrapper, projected hints, identity, or visibility registry | [Host composition](../references/headless-composition.md#host-composition)                                                                                                                                                                     |
| Custom error or hint renderer overrides                             | [Renderer overrides](../references/headless-composition.md#renderer-overrides)                                                                                                                                                                 |
| Collapsed details, tabs, wizard steps, or selection groups          | [Control visibility](../references/headless-composition.md#control-visibility), [browser checks](../testing/guide.md#browser-state-checks)                                                                                                     |
| Fieldsets, summaries, messages, counters, flags, or legends         | [Visibility and aggregation](../references/headless-composition.md#visibility-and-aggregation); deeper [reactive APIs](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/toolkit/headless/README.md#reactive-primitives) |

## Key directive contracts

- `NgxHeadlessFieldset` (`[ngxHeadlessFieldset]`, `exportAs="fieldset"`): requires `field`. Aggregates direct group errors and warnings with independent timing. Set `includeNestedErrors` to include child fields, or pass `fields` explicitly (`fields=[]` aggregates nothing). Render `resolvedErrors()` and `resolvedWarnings()`, not raw `aggregatedErrors()[i].message`. Use `dedupeValidationErrors()` when aggregating your own list.
- `NgxHeadlessCharacterCount`: requires `field` and `maxLength` (`DEFAULT_WARNING_THRESHOLD = 0.8`, `DEFAULT_DANGER_THRESHOLD = 0.95`). `createCharacterCount()` makes `maxLength` optional; pass `useValidatorMaxLength: true` to read the field's `maxLength()` validator.
- `createErrorState()`: requires an injection context or explicit `injector` and returns raw errors. `NgxHeadlessErrorState.errorsOverride` bypasses timing so the caller owns filtering and blocking-error precedence.

## Done

Verify the checks that apply to your change:

- Each ARIA attribute has one writer on the actual control, and every referenced ID exists, is unique, and matches visible messages.
- Custom wrappers preserve name, hint, and timing channels (`fieldName: null` vs unbound; `hintIds: null` vs `[]`) with independent warning timing.
- Live-region hosts stay mounted before updates. CSS visibility checks probe the actual `aria-invalid` carrier across hide and reopen transitions.
- Report browser, keyboard, or screen-reader checks that did not run.
