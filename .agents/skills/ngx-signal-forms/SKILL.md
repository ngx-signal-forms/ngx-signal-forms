---
name: ngx-signal-forms
description: Surface router for @ngx-signal-forms/toolkit. Use when the task mentions toolkit imports, entry-point choice, custom wrappers, feedback components, headless primitives, Vest, accessibility testing, debugger, or migrations.
---

# ngx-signal-forms Toolkit

A router skill for `@ngx-signal-forms/toolkit` surfaces.

Leading word: **surface**. Route by surface first, then apply only that surface's rules.

## Sub-Skill Routing

Routing loop:

1. Identify the primary **surface** from the task, imports, selectors, and symbols.
2. Read its sub-skill.
3. Read each additional sub-skill required by the task. Include core guidance for submission or ARIA ownership, and testing guidance when using toolkit accessibility assertions.
4. Continue with the requested work. Resolve routine entry-point choices from the source and routing table.

| Task                                                                    | Entry point                            | Sub-skill to read                          |
| ----------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------ |
| Upgrade from beta or an earlier release candidate                       | —                                      | [migrations/SKILL.md](migrations/SKILL.md) |
| `[formRoot]`, error strategy, ARIA, submission, config, or presets      | `@ngx-signal-forms/toolkit`            | [core/SKILL.md](core/SKILL.md)             |
| Styled wrappers, fieldsets, field appearances, or custom-control layout | `@ngx-signal-forms/toolkit/form-field` | [form-field/SKILL.md](form-field/SKILL.md) |
| Standalone errors, notifications, hints, counters, or summaries         | `@ngx-signal-forms/toolkit/assistive`  | [assistive/SKILL.md](assistive/SKILL.md)   |
| Full DOM control or custom wrapper ARIA/identity composition            | `…/headless` (+ root for identity)     | [headless/SKILL.md](headless/SKILL.md)     |
| Vest suites or custom Vest validation flows                             | `@ngx-signal-forms/toolkit/vest`       | [vest/SKILL.md](vest/SKILL.md)             |
| axe-core WCAG assertions                                                | `@ngx-signal-forms/toolkit/testing`    | [testing/SKILL.md](testing/SKILL.md)       |
| Dev-time form inspection                                                | `@ngx-signal-forms/debugger`           | [debugger/SKILL.md](debugger/SKILL.md)     |

## Shared References

Load these reference files when the sub-skill or task requires deeper API detail:

- `references/api.md` — Complete public exports per entry point, types, and config
- `references/signal-forms.md` — Pointer to the canonical Angular Signal Forms reference
- `references/pitfalls.md` — Common mistakes and how to avoid them
- `references/demo-map.md` — Repository demo paths organized by feature
- [`../../../docs/migrations/README.md`](../../../docs/migrations/README.md) —
  version-to-version migration guides; load the applicable guide before changing
  an existing toolkit integration.

Routing is complete when the required sub-skills are loaded. This completes only
the routing phase. The requested work still requires implementation or analysis,
verification, and a report of any unmet requirements. For read-only or
review-before-edit requests, report recommendations without modifying files.

## Non-Negotiable Rules

1. `@angular/forms/signals` is always the source of truth — never replace `form()`, `[formField]`, or field state signals with toolkit abstractions.
2. Always import from the correct secondary entry point. Do not import `NgxFormField` from the root package.
3. Basic toolkit flows can use `form[formRoot]` alone — wrappers, assistive components, and auto-ARIA fall back to default `'on-touch'` timing. Add `ngxSignalForm` when you need `'on-submit'`, `submittedStatus`, shared form context, or a form-level strategy override.
4. Do not manually add `aria-invalid`, `aria-required`, or `aria-describedby` to controls managed by `NgxSignalFormAutoAria` unless `ngxSignalFormControlAria="manual"` is explicitly set on that control.
5. Bound controls inside `ngx-form-field-wrapper` need a stable `id` unless the wrapper gets an explicit `fieldName`.
6. Declare control semantics explicitly with `ngxSignalFormControl` for controls outside the default native field families (switches, checkboxes, sliders, composites) — the wrapper and auto-ARIA use this to avoid brittle DOM heuristics. For switch controls also add `role="switch"` on the actual interactive element.
7. Angular standalone imports are template-local — if a child custom control renders the real `[formField]` element, import toolkit auto-ARIA in that child component too.
8. Do not use removed APIs: `manual` strategy, `computeShowErrors`, `createShowErrorsSignal`, `canSubmit`, `isSubmitting`, `fieldNameResolver`, `strictFieldResolution`, `injectFormConfig`, `NgxFormFieldNotification` (use `NgxFormFieldError` with `presentation="panel"`), `toHintDescriptors`, `createErrorRendererInputs`, `resolveUnionInput`. Use `standard` not `stacked` and `plain` not `bare`. Drop the `Component`/`Directive` suffix from public class imports — `NgxSignalFormControlSemanticsDirective` is the only intentional exception (kept to avoid colliding with the `NgxSignalFormControlSemantics` interface).
