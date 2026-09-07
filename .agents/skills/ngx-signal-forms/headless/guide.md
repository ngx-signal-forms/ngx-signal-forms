# Toolkit headless

Use `@ngx-signal-forms/toolkit/headless` when you own the markup. Use
[form-field](../form-field/guide.md) for a complete styled shell or
[assistive](../assistive/guide.md) for ready-made feedback.

## Workflow

1. Select a directive for template state, a host directive for a reusable
   component, or a factory for programmatic state. Confirm its public inputs
   through the [source index](../references/api.md).
2. Supply deterministic identity. Error-state and notification IDs need a
   `fieldName`; only `NgxHeadlessFieldName` falls back to its host ID. Keep
   unresolved IDs `null`. Instance IDs are not domain identity.
3. Select one ARIA writer. Prefer auto-ARIA on ordinary controls. For manual
   markup, opt out on the actual bound host with
   `ngxSignalFormControlAria="manual"`; headless does not opt out for you.
4. Load the branch below before composing it. Resolve error and warning timing
   separately and render resolved messages, not optional raw `error.message`.
5. Verify the relevant Done criteria and report any missing evidence.

## Branch references

| Branch                                                       | Required reading                                                                                                                                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manual ARIA or custom renderer                               | [Composition reference](../references/headless-composition.md), including [renderer contracts](../references/headless-composition.md#renderer-overrides)                                                                              |
| Reusable wrapper, projected hints, identity, or local timing | [Host composition and channels](../references/headless-composition.md#host-composition)                                                                                                                                               |
| Collapsed details, tabs, wizard steps, or radio groups       | [Actual-carrier visibility](../references/headless-composition.md#control-visibility), [browser checks](../testing/guide.md#browser-state-checks)                                                                                     |
| Fieldsets, summaries, or notification cards                  | [Aggregation and templates](../references/headless-composition.md#visibility-and-aggregation); deeper [nested forms](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/COMPLEX_NESTED_FORMS.md)                     |
| Programmatic messages, counters, flags, or marking legends   | [Bundled contracts](../references/headless-composition.md#visibility-and-aggregation); deeper [reactive APIs](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/toolkit/headless/README.md#reactive-primitives) |

`NgxHeadlessCharacterCount` and `createCharacterCount()` require `maxLength`.
`createErrorState()` needs an injection context or explicit `injector` and
returns raw errors. `errorsOverride` on `NgxHeadlessErrorState` bypasses timing;
its caller owns filtering and blocking-error precedence. `connectFieldState()`
is package-internal, not a consumer shortcut.

## Done

- Each managed ARIA attribute has one writer on the correct control. Every
  referenced ID exists, is unique, and matches currently active feedback.
- Custom wrappers preserve name/hint/timing channels and prove independent
  warning timing, including warning-only and mixed-field groups.
- Identity checks distinguish bound `fieldName: null` from unbound input and
  resolve both without control-ID fallback. Hint checks distinguish unpublished
  `null` from authoritative `[]`. Shared renderers accept both caller input sets
  and preserve nullable names, projected content, and host-owned hint IDs.
- Live-region hosts exist before content changes. CSS visibility tests probe
  the actual attribute carrier and show correct collapse/reopen behavior.
- The changed branch has focused validation evidence. Browser, keyboard, or
  screen-reader checks not performed are reported, not inferred from axe.
