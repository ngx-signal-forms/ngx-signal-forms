---
description: '@ngx-signal-forms/toolkit - non-negotiable usage rules'
applyTo: '{apps}/**/*.{ts,html,scss,css}'
---

# @ngx-signal-forms/toolkit

Enhancement layer on top of Angular Signal Forms. For API detail, entry points, and examples, use the `ngx-signal-forms` skill (`.agents/skills/ngx-signal-forms/SKILL.md`) — it routes to sub-skills per entry point and holds the full public API reference.

## Entry Points

| Entry point                            | Purpose                                                    |
| -------------------------------------- | ---------------------------------------------------------- |
| `@ngx-signal-forms/toolkit`            | Core: `[formRoot]`, auto-ARIA, strategies, utilities       |
| `@ngx-signal-forms/toolkit/form-field` | Styled wrapper, fieldset grouping, floating label          |
| `@ngx-signal-forms/toolkit/assistive`  | Standalone errors, grouped notifications, hints, summaries |
| `@ngx-signal-forms/toolkit/headless`   | Renderless state, notification, and summary directives     |
| `@ngx-signal-forms/toolkit/vest`       | Vest validation adapter (optional)                         |
| `@ngx-signal-forms/toolkit/testing`    | axe-core WCAG 2.2 AA test harness for specs (optional)     |
| `@ngx-signal-forms/debugger`           | Dev-only form-tree inspection panel (demo/dev only)        |

## Non-Negotiable Rules

1. `@angular/forms/signals` is always the source of truth — never replace `form()`, `[formField]`, or field state signals with toolkit abstractions.
2. Always import from the correct secondary entry point. Do not import `NgxFormField` from the root package.
3. Basic flows can use `form[formRoot]` alone (default `'on-touch'` timing). Add `ngxSignalForm` only for `'on-submit'`, `submittedStatus`, shared form context, or a form-level strategy override.
4. Do not manually add `aria-invalid`, `aria-required`, or `aria-describedby` to controls managed by `NgxSignalFormAutoAria` unless `ngxSignalFormControlAria="manual"` is set on that control.
5. Bound controls inside `ngx-form-field-wrapper` need a stable `id` unless the wrapper gets an explicit `fieldName`.
6. Declare control semantics explicitly with `ngxSignalFormControl` for controls outside the default native field families (switches, checkboxes, sliders, composites). For switch controls also add `role="switch"` on the interactive element.
7. Standalone imports are template-local — if a child custom control renders the real `[formField]` element, import toolkit auto-ARIA in that child component too.
8. Do not use removed APIs: `manual` strategy, `computeShowErrors`, `createShowErrorsSignal`, `canSubmit`, `isSubmitting`, `fieldNameResolver`, `strictFieldResolution`, `injectFormConfig`. Use `standard` not `stacked`, `plain` not `bare`. Drop the `Component`/`Directive` suffix from public class imports (`NgxSignalFormControlSemanticsDirective` is the only exception).
