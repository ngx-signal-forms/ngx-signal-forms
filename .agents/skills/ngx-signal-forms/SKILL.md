---
name: ngx-signal-forms
description: Surface router for @ngx-signal-forms/toolkit. Use for toolkit forms, submission, validation choice, custom controls or widget adapters, custom wrappers, feedback, headless composition, theming, accessibility testing, Vest, repository-internal debugger, or migrations.
---

# ngx-signal-forms toolkit

One installable, model-invoked skill for `@ngx-signal-forms/toolkit`.
Keep this directory intact when installing through skills.sh or ctx7; installers
copy its guides and references with the root. Nested branches are plain guides,
not independently discoverable skills. Load them only when their branch applies.

No Nx, Context7, Angular skill, or toolkit repository checkout is required.
Bundled guidance and the consumer's installed declarations cover the essential
contracts. Remote access is needed only for extra docs, source examples, and
unbundled version-specific migration guides. Read the
[source and version policy](references/sources.md) before choosing APIs.

## Surface routing

Routing loop:

1. Identify the primary **surface** from the task, imports, selectors, and symbols.
2. Read its bundled guide.
3. Load the required task references below, then any additional surface the work touches.
4. Implement or analyze the requested change. Check the selected surface's Done criteria and report evidence or unmet checks.

| Task                                                                    | Entry point                            | Guide to read                          |
| ----------------------------------------------------------------------- | -------------------------------------- | -------------------------------------- |
| Upgrade from beta or an earlier release candidate                       | Not an entry point                     | [Migrations](migrations/guide.md)      |
| `[formRoot]`, error strategy, ARIA, submission, config, or presets      | `@ngx-signal-forms/toolkit`            | [Core](core/guide.md)                  |
| Styled wrappers, fieldsets, field appearances, or custom-control layout | `@ngx-signal-forms/toolkit/form-field` | [Form-field](form-field/guide.md)      |
| Standalone errors, notifications, hints, counters, or summaries         | `@ngx-signal-forms/toolkit/assistive`  | [Assistive](assistive/guide.md)        |
| Full DOM control or custom wrapper ARIA/identity composition            | `…/headless` (+ root for identity)     | [Headless](headless/guide.md)          |
| Vest suites or custom Vest validation flows                             | `@ngx-signal-forms/toolkit/vest`       | [Vest](vest/guide.md)                  |
| axe-core WCAG assertions                                                | `@ngx-signal-forms/toolkit/testing`    | [Testing](testing/guide.md)            |
| Repository-internal form inspection, not a published toolkit entry      | `@ngx-signal-forms/debugger`           | [Internal debugger](debugger/guide.md) |

## Required task references

Load only the branches that apply, but load them before choosing APIs:

| Task branch                                                                      | Read                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Form, model, schema, validation, submission, or custom editable control          | [Bundled Angular essentials](references/signal-forms.md)                                                                                                                                              |
| Choose Angular validators, Standard Schema, or Vest                              | [Validation choice](references/signal-forms.md#validation-choice); deeper [strategy doc](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/VALIDATION_STRATEGY.md) only if needed   |
| Native form or styled field shell                                                | [Form-field](form-field/guide.md#basic-usage)                                                                                                                                                         |
| Async submission                                                                 | [Angular submission](references/signal-forms.md#submission), [core](core/guide.md), and [testing](testing/guide.md#submission-checks)                                                                 |
| Warning-aware submission                                                         | [Core warning contract](core/guide.md#warning-helpers), [event wiring](vest/guide.md#warnings-and-submission), and [testing](testing/guide.md)                                                        |
| Custom editable control or existing widget adapter                               | [Control contract](references/signal-forms.md#custom-controls), [transformation](references/signal-forms.md#value-transformation), [form-field](form-field/guide.md), and [testing](testing/guide.md) |
| Custom wrapper, renderer, or ARIA ownership                                      | [Headless](headless/guide.md), then the applicable [composition branch](references/headless-composition.md)                                                                                           |
| Nested objects or dynamic arrays                                                 | [Schema and arrays](references/signal-forms.md#schemas-and-arrays); deeper [nested forms](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/COMPLEX_NESTED_FORMS.md) only if needed |
| Theme, appearance, or CSS integration                                            | [Form-field](form-field/guide.md), [testing](testing/guide.md), and deeper [theming](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/toolkit/form-field/THEMING.md)           |
| Visibility, collapsed controls, focus, live regions, or accessibility assertions | [Testing](testing/guide.md), including its browser-state checks                                                                                                                                       |
| Upgrade an existing integration                                                  | [Migrations](migrations/guide.md) and every crossed version guide                                                                                                                                     |

For exact exports and signatures use the [source index](references/api.md).
For toolkit mistakes use [pitfalls](references/pitfalls.md); for online
examples use the [demo map](references/demo-map.md). Controller evaluation
cases live in the branch-only [evaluation reference](references/evaluation.md).

## Non-Negotiable Rules

1. `@angular/forms/signals` is always the source of truth — never replace `form()`, `[formField]`, or field state signals with toolkit abstractions.
2. Always import from the correct secondary entry point. Do not import `NgxFormField` from the root package.
3. Basic toolkit flows can use `form[formRoot]` alone — wrappers, assistive components, and auto-ARIA fall back to default `'on-touch'` timing. Add `ngxSignalForm` when you need `'on-submit'`, `submittedStatus`, shared form context, or a form-level strategy override.
4. Do not manually add `aria-invalid`, `aria-required`, or `aria-describedby` to controls managed by `NgxSignalFormAutoAria` unless `ngxSignalFormControlAria="manual"` is explicitly set on that control.
5. Bound controls inside `ngx-form-field-wrapper` need a stable `id` unless the wrapper gets an explicit `fieldName`.
6. Declare `ngxSignalFormControl` semantics when native inference does not cover the control or ownership policy. Standard checkboxes/radios require explicit opt-in. Native checkbox switches with `role="switch"` already infer their kind; custom switches still need the role on the actual interactive element.
7. Angular standalone imports are template-local — if a child custom control renders the real `[formField]` element, import toolkit auto-ARIA in that child component too.
8. For legacy symbols, use the [replacement table](references/pitfalls.md#removed--non-public-apis--never-use) and [migration workflow](migrations/guide.md). Confirm replacements against the published entry point, not the internal `/core` barrel.

## Done

The applicable task branches and surface criteria are covered. Report the
changed behavior and actual verification evidence; name checks not run.
For review-only requests, report findings without edits. Loading this router
alone does not complete the task.
