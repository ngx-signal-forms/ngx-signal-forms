---
name: ngx-signal-forms
description: '@ngx-signal-forms/toolkit for Angular Signal Forms. Use when working with [formField], [formRoot], ngxSignalForm, ngx-form-field-wrapper, ngx-form-fieldset, assistive errors, summaries, hints, character counts, headless composition, custom controls, custom wrappers, theming, validateVest, expectNoA11yViolations, or toolkit migrations.'
---

# ngx-signal-forms toolkit

Guidance for `@ngx-signal-forms/toolkit` on Angular Signal Forms.
Bundled guides and the consumer's installed declarations cover the public contracts.
Read [sources and version policy](references/sources.md) before choosing APIs when the installed version is uncertain.

## Workflow

1. Match the task to one or more branches in the routing table below.
2. Read the listed guides and references in parallel before writing code.
3. Implement or review the change following the invariants below and the branch guide.
4. Verify the changed behavior with the consumer's existing checks and report what ran.

## Task routing

Load only the branches that apply to the task:

| Task branch                                                                   | Entry point                            | Read first                                                                                                                                                               |
| ----------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Form setup, `[formRoot]`, `ngxSignalForm`, timing, auto-ARIA, presets, config | `@ngx-signal-forms/toolkit`            | [Angular essentials](references/signal-forms.md), [Core](core/guide.md)                                                                                                  |
| Async or warning-aware submission                                             | `@ngx-signal-forms/toolkit`            | [Angular submission](references/signal-forms.md#submission), [Core](core/guide.md#warning-helpers), [Testing](testing/guide.md)                                          |
| Styled wrappers, fieldsets, appearances, or theming                           | `@ngx-signal-forms/toolkit/form-field` | [Angular essentials](references/signal-forms.md), [Form-field](form-field/guide.md)                                                                                      |
| Standalone errors, panels, hints, character counts, summaries, or legends     | `@ngx-signal-forms/toolkit/assistive`  | [Assistive](assistive/guide.md)                                                                                                                                          |
| Custom editable control or third-party widget adapter                         | `@ngx-signal-forms/toolkit`            | [Control contract](references/signal-forms.md#custom-controls), [Core](core/guide.md#control-semantics-and-auto-aria), [Form-field](form-field/guide.md#custom-controls) |
| Custom wrapper, headless markup, renderer overrides, or manual ARIA           | `@ngx-signal-forms/toolkit/headless`   | [Headless](headless/guide.md), [Headless composition](references/headless-composition.md)                                                                                |
| Choose Angular validators, Standard Schema, or Vest                           | `@ngx-signal-forms/toolkit/vest`       | [Validation choice](references/signal-forms.md#validation-choice), [Vest](vest/guide.md)                                                                                 |
| Accessibility assertions, focus, visibility, or live-region checks            | `@ngx-signal-forms/toolkit/testing`    | [Testing](testing/guide.md)                                                                                                                                              |
| Upgrade from beta or an earlier release candidate                             | Multiple                               | [Migrations](migrations/guide.md), [Pitfalls](references/pitfalls.md#removed-and-non-public-apis)                                                                        |

Additional lookups: [API source index](references/api.md), [common pitfalls](references/pitfalls.md), and [online example map](references/demo-map.md).

## Core invariants

1. **Keep `@angular/forms/signals` as the source of truth.** Build forms with `form()`, `[formField]`, and field state signals, and layer toolkit features on top. Use `[formRoot]` with `submission.action` for standard submission, or a single native `(submit)` handler with `novalidate` when calling `submitWithWarnings()` (see [vest/guide.md](vest/guide.md#warnings-and-submission)).
2. **Import from the owning secondary entry point.** Import wrappers from `/form-field`, standalone feedback from `/assistive`, headless primitives from `/headless`, Vest adapters from `/vest`, and a11y helpers from `/testing`. Confirm root exports against `@ngx-signal-forms/toolkit`, not the internal `/core` build entry.
3. **Add `ngxSignalForm` when the form needs shared context.** Plain `form[formRoot]` forms already work with the configured `defaultErrorStrategy` (default `'on-touch'`). Add `ngxSignalForm` for `'on-submit'`, `submittedStatus`, form-level strategy overrides, or an error summary that announces alone.
4. **Keep one ARIA writer per control.** Let `NgxSignalFormAutoAria` own `aria-invalid`, `aria-required`, and managed `aria-describedby` ids (`{fieldName}-error`, `{fieldName}-warning`, wrapper hints). Keep your own static description ids on the control; auto-ARIA preserves them and appends managed ids. Set `ngxSignalFormControlAria="manual"` when the control writes its own ARIA.
5. **Give wrapped controls deterministic identity.** Put a stable `id` on each bound control inside `ngx-form-field-wrapper`, or pass an explicit `fieldName` on the wrapper.
6. **Declare control semantics when native inference does not cover the host.** Opt native checkboxes and radios into auto-ARIA explicitly with `ngxSignalFormControl`, and declare custom hosts (`switch`, `slider`, `composite`, `input-like`). Native `input[type="checkbox"][role="switch"]` infers `switch` automatically.
7. **Import directives in the component that renders `[formField]`.** Angular standalone imports are template-local. If a child custom control renders the real `[formField]` element, import the toolkit bundle or `NgxSignalFormAutoAria` in that child component too.
8. **Time errors and warnings independently.** Warnings use the `warn:` kind prefix and their own `warningStrategy` cascade (`warningStrategy` -> form `warningStrategy` -> `defaultWarningStrategy` -> `'on-touch'`). Changing error timing leaves warning timing unchanged.

## Done

Check the changed behavior against the selected branch guide's Done criteria.
Report actual verification results and name any checks that did not run.
For review-only requests, report findings without editing files.
