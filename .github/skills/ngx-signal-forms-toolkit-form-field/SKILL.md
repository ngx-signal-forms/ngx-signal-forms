---
name: ngx-signal-forms-toolkit-form-field
description: Implements the pre-styled wrapper APIs from @ngx-signal-forms/toolkit/form-field. Use when adding ngx-signal-form-field-wrapper, floating labels, grouped fieldsets, wrapper appearance controls, or custom controls that must integrate with wrapper-driven errors in projects that use the toolkit. Don't use for fully custom renderless UI, standalone assistive-only messages, or debugger-only changes.
---

# Toolkit Form Field

Implement requests that belong to `@ngx-signal-forms/toolkit/form-field`.

Read `references/examples.md` when the task needs portable wrapper patterns or an optional demo-aligned pattern for wrapper basics, grouped fieldsets, custom controls, and multi-step layouts that keep wrapper styling consistent.

## Portability

- Use this skill both inside and outside `ngx-signal-forms`.
- If repository-local docs are unavailable, rely on the installed package docs and the public toolkit repository.

## Core principle

- Treat the form-field entry point as a presentation and accessibility extension on top of Angular Signal Forms.
- Prefer Angular-native form behavior whenever Angular already handles the underlying requirement well.
- Use wrapper and fieldset components to improve layout, grouped feedback, and consistency, not to replace Angular-native validation or submission mechanics.
- If Angular already offers the better solution for the requested behavior, prefer Angular and treat any missing toolkit ergonomics as a library-improvement opportunity.
- When that gap matters to the library, suggest creating an issue at `github.com/ngx-signal-forms/ngx-signal-forms`.

## Workflow

1. Confirm that the request needs the styled wrapper layer rather than standalone assistive pieces or headless primitives.
2. Import wrapper APIs from `@ngx-signal-forms/toolkit/form-field`, preferably through the `NgxFormField` bundle when that keeps imports concise.
3. Wrap each projected control in `ngx-signal-form-field-wrapper` and give the bound control a stable `id`. Rely on that `id` for label and error linkage before adding `fieldName` manually.
4. Let the wrapper own automatic error output. Add standalone error components only when the layout explicitly needs them outside the wrapper.
5. Use `appearance="outline"` or `appearance="standard"` only. When floating-label behavior is required, pair outline appearance with `placeholder=" "`.
6. Use prefix and suffix slots when the field needs inline icons, affordances, or action buttons without abandoning wrapper semantics.
7. Use `NgxSignalFormFieldset` for radio groups, grouped sections, or compound controls that need aggregated validation summaries.
8. Default grouped summaries to `includeNestedErrors="false"` when child wrappers already show their own errors.
9. Use `errorPlacement` deliberately on wrappers or fieldsets when the design needs top versus bottom feedback.
10. Keep custom controls compatible with wrapper assumptions: stable host `id`, accessible focus behavior, and real `FormValueControl` integration.
11. Route fully custom markup to `ngx-signal-forms-toolkit-headless` and standalone feedback-only tasks to `ngx-signal-forms-toolkit-assistive`.

## Implementation Rules

- Keep examples Angular 21.2-compatible, signal-first, standalone, and `OnPush`.
- Do not import wrapper APIs from the root toolkit entry point.
- Do not manually add toolkit-managed ARIA attributes to controls inside the wrapper.
- Prefer wrapper-based consistency for production forms and demo pages that compare boilerplate reduction.

## Error Handling

- If wrapper linkage fails, add or stabilize the projected control `id` before introducing explicit `fieldName`.
- If grouped output duplicates child messages, revisit `includeNestedErrors` instead of filtering errors manually.
- If the request wants complete freedom over markup or design-system structure, switch to the headless skill instead of over-customizing the styled wrapper layer.
