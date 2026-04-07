---
name: ngx-signal-forms
description: Implements @ngx-signal-forms/toolkit for Angular Signal Forms. Use whenever working with any toolkit entry point — form[formRoot][ngxSignalForm], auto-ARIA, error strategies (on-touch/on-submit/immediate), error message registries, field-label resolution, form field wrappers (ngx-signal-form-field-wrapper), grouped fieldsets, error summaries, standalone assistive components (errors, hints, character count), renderless headless primitives, Vest validation integration, or development-time form debugging. Always invoke this skill when the user mentions @ngx-signal-forms/toolkit, an error strategy, an error summary, a form wrapper, field visibility, or custom form controls, even if they don't use the skill name explicitly.
---

# ngx-signal-forms Toolkit

An orchestrator skill for `@ngx-signal-forms/toolkit` — the enhancement layer on top of Angular Signal Forms.

## When to Use

Use this skill when the task involves:

- Setting up `form[formRoot][ngxSignalForm]`, error strategies, or auto-ARIA
- Adding form-level error summaries or field-label resolution
- Adding form field wrappers or grouped fieldsets
- Displaying validation errors, hints, or character counts
- Building custom form controls with full markup control
- Integrating Vest validation suites
- Adding a dev-time debugger panel
- Configuring global error messages or form appearance

## Entry Points at a Glance

| Entry point                            | Purpose                                                   |
| -------------------------------------- | --------------------------------------------------------- |
| `@ngx-signal-forms/toolkit`            | Core: `[formRoot]`, auto-ARIA, strategies, utilities      |
| `@ngx-signal-forms/toolkit/form-field` | Styled wrapper, fieldset grouping, floating label         |
| `@ngx-signal-forms/toolkit/assistive`  | Standalone errors, hints, character count, summaries      |
| `@ngx-signal-forms/toolkit/headless`   | Renderless state and summary directives for custom markup |
| `@ngx-signal-forms/toolkit/vest`       | Vest validation adapter (optional)                        |
| `@ngx-signal-forms/toolkit/debugger`   | Dev-only form-tree inspection panel                       |

> `@angular/forms/signals` is always the source of truth for the form model. The toolkit only adds UX, accessibility, and composition value on top.

## Sub-Skill Routing

| Task                                           | Sub-skill to read                          |
| ---------------------------------------------- | ------------------------------------------ |
| `[formRoot]`, error strategy, ARIA, submission | [core/SKILL.md](core/SKILL.md)             |
| Field wrappers, fieldsets, floating labels     | [form-field/SKILL.md](form-field/SKILL.md) |
| Standalone error/hint/char-count components    | [assistive/SKILL.md](assistive/SKILL.md)   |
| Custom markup with full control over DOM       | [headless/SKILL.md](headless/SKILL.md)     |
| Vest suite integration                         | [vest/SKILL.md](vest/SKILL.md)             |
| Dev-time form inspection                       | [debugger/SKILL.md](debugger/SKILL.md)     |

## Shared References

Load these reference files when the sub-skill or task requires deeper API detail:

- `references/api.md` — Complete public exports per entry point, types, and config
- `references/signal-forms.md` — Angular Signal Forms base API (validators, field state, form())
- `references/pitfalls.md` — Common mistakes and how to avoid them
- `references/demo-map.md` — Repository demo paths organized by feature

## Quick Decision: Which Entry Point?

```
Need form-level setup, ARIA, or submission helpers?         → core
Need a styled label+input+error shell?                      → form-field
Need standalone error text, hints, or char-count?           → assistive
Need full DOM control for custom design systems?            → headless
Using Vest validation suites?                               → vest
Adding a debug panel during development?                    → debugger
```

## Non-Negotiable Rules

1. `@angular/forms/signals` is always the source of truth — never replace `form()`, `[formField]`, or field state signals with toolkit abstractions.
2. Always import from the correct secondary entry point. Do not import `NgxFormField` from the root package.
3. Do not manually add `aria-invalid`, `aria-required`, or `aria-describedby` to controls managed by `NgxSignalFormAutoAriaDirective`.
4. Bound controls inside `ngx-signal-form-field-wrapper` must have a stable `id` — wrapper derives field identity from it.
5. Switch-style boolean controls should use a native checkbox with `role="switch"` on the actual bound control whenever possible.
6. Angular standalone imports are template-local — if a child custom control renders the real `[formField]` element, import toolkit auto-ARIA in that child component too.
7. Do not use removed APIs: `manual` strategy, `bare` appearance, `computeShowErrors`, `canSubmit`, `isSubmitting`, `fieldNameResolver`, `strictFieldResolution`.
