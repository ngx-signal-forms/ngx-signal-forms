---
name: ngx-signal-forms
description: Guides use of @ngx-signal-forms/toolkit across its v1 root and secondary entry points. Use when working with toolkit form context, control semantics, wrappers, assistive or headless feedback, Vest, accessibility testing, debugger UI, or toolkit migrations.
---

# ngx-signal-forms Toolkit

An orchestrator skill for `@ngx-signal-forms/toolkit` — the enhancement layer on top of Angular Signal Forms.

## When to Use

Use this skill when the task involves:

- Setting up `[formRoot]`, deciding whether to add `ngxSignalForm`, error strategies, or auto-ARIA
- Upgrading from beta / older RC toolkit usage to the current public API (`standard` vs `stacked`, hidden `/core`, renamed classes, removed helpers)
- Declaring control semantics with `ngxSignalFormControl` or setting up control preset providers
- Adding form-level error summaries or field-label resolution
- Adding form field wrappers or grouped fieldsets
- Displaying validation errors, grouped notifications, hints, or character counts
- Building custom form controls with full markup control
- Integrating Vest validation suites
- Asserting no WCAG 2.2 AA violations in component specs (accessibility test harness)
- Adding a dev-time debugger panel
- Configuring global error messages or form appearance

## Entry Points at a Glance

| Entry point                            | Purpose                                                    |
| -------------------------------------- | ---------------------------------------------------------- |
| `@ngx-signal-forms/toolkit`            | Core: `[formRoot]`, auto-ARIA, strategies, utilities       |
| `@ngx-signal-forms/toolkit/form-field` | Styled wrapper, fieldset grouping, floating label          |
| `@ngx-signal-forms/toolkit/assistive`  | Standalone errors, grouped notifications, hints, summaries |
| `@ngx-signal-forms/toolkit/headless`   | Renderless state, notification, and summary directives     |
| `@ngx-signal-forms/toolkit/vest`       | Vest validation adapter (optional)                         |
| `@ngx-signal-forms/toolkit/testing`    | axe-core WCAG 2.2 AA test harness for specs (optional)     |

**Internal UI (Demo/Development Only):**

| Entry Point                  | Description                         |
| ---------------------------- | ----------------------------------- |
| `@ngx-signal-forms/debugger` | Dev-only form-tree inspection panel |

> `@angular/forms/signals` is always the source of truth for the form model. The toolkit only adds UX, accessibility, and composition value on top.

## Sub-Skill Routing

| Task                                                              | Sub-skill to read                          |
| ----------------------------------------------------------------- | ------------------------------------------ |
| Upgrade from beta or an earlier release candidate                 | [migrations/SKILL.md](migrations/SKILL.md) |
| `[formRoot]`, error strategy, ARIA, submission                    | [core/SKILL.md](core/SKILL.md)             |
| Control semantics directive, preset providers                     | [core/SKILL.md](core/SKILL.md)             |
| Field wrappers, fieldsets, floating labels, custom control layout | [form-field/SKILL.md](form-field/SKILL.md) |
| Standalone errors, grouped notifications, hints, counters         | [assistive/SKILL.md](assistive/SKILL.md)   |
| Custom markup with full DOM control                               | [headless/SKILL.md](headless/SKILL.md)     |
| Vest suite integration                                            | [vest/SKILL.md](vest/SKILL.md)             |
| Accessibility test assertions, axe-core, WCAG spec checks         | [testing/SKILL.md](testing/SKILL.md)       |
| Dev-time form inspection                                          | [debugger/SKILL.md](debugger/SKILL.md)     |

## Shared References

Load these reference files when the sub-skill or task requires deeper API detail:

- `references/api.md` — Complete public exports per entry point, types, and config
- `references/signal-forms.md` — Angular Signal Forms base API (validators, field state, form())
- `references/pitfalls.md` — Common mistakes and how to avoid them
- `references/demo-map.md` — Repository demo paths organized by feature
- `docs/migrations/README.md` — Version-to-version migration guides; load the
  applicable guide before changing an existing toolkit integration.

## Quick Decision: Which Entry Point?

```
Need form-level setup, ARIA, or submission helpers?         → core
Need a styled label+input+error shell?                      → form-field
Need standalone errors, grouped notifications, or hints?    → assistive
Need full DOM control for custom design systems?            → headless
Using Vest validation suites?                               → vest
Asserting no WCAG 2.2 AA violations in a spec?              → testing
Adding a debug panel during development?                    → debugger
```

## Non-Negotiable Rules

1. `@angular/forms/signals` is always the source of truth — never replace `form()`, `[formField]`, or field state signals with toolkit abstractions.
2. Always import from the correct secondary entry point. Do not import `NgxFormField` from the root package.
3. Basic toolkit flows can use `form[formRoot]` alone — wrappers, assistive components, and auto-ARIA fall back to default `'on-touch'` timing. Add `ngxSignalForm` when you need `'on-submit'`, `submittedStatus`, shared form context, or a form-level strategy override.
4. Do not manually add `aria-invalid`, `aria-required`, or `aria-describedby` to controls managed by `NgxSignalFormAutoAria` unless `ngxSignalFormControlAria="manual"` is explicitly set on that control.
5. Bound controls inside `ngx-form-field-wrapper` need a stable `id` unless the wrapper gets an explicit `fieldName`.
6. Declare control semantics explicitly with `ngxSignalFormControl` for controls outside the default native field families (switches, checkboxes, sliders, composites) — the wrapper and auto-ARIA use this to avoid brittle DOM heuristics. For switch controls also add `role="switch"` on the actual interactive element.
7. Angular standalone imports are template-local — if a child custom control renders the real `[formField]` element, import toolkit auto-ARIA in that child component too.
8. Do not use removed APIs: `manual` strategy, `computeShowErrors`, `createShowErrorsSignal`, `canSubmit`, `isSubmitting`, `fieldNameResolver`, `strictFieldResolution`, `injectFormConfig`. Use `standard` not `stacked` and `plain` not `bare`. Drop the `Component`/`Directive` suffix from public class imports — `NgxSignalFormControlSemanticsDirective` is the only intentional exception (kept to avoid colliding with the `NgxSignalFormControlSemantics` interface).
