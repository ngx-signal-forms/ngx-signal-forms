---
name: ngx-signal-forms-toolkit-assistive
description: Implements assistive feedback components from @ngx-signal-forms/toolkit/assistive. Use when adding standalone field errors, hints, character counts, assistive rows, warning semantics, or ARIA-linked helper text in projects that use the toolkit. Don't use for full field wrapper layouts, renderless primitives, or form-wide core configuration.
---

# Toolkit Assistive

Implement requests that belong to `@ngx-signal-forms/toolkit/assistive`.

Read `references/examples.md` when the task needs portable patterns or an optional demo-aligned choice between standalone errors, hints, character count, assistive-row layout, and warning messaging.

## Portability

- Use this skill both inside and outside `ngx-signal-forms`.
- If repository-local docs are unavailable, rely on the installed package docs and the public toolkit repository.

## Core principle

- Treat the assistive entry point as an accessibility and feedback layer on top of Angular Signal Forms.
- Prefer Angular-native validation, submission, and state handling whenever Angular already solves the underlying problem.
- Use assistive components to render feedback more accessibly and consistently, not to replace Angular-native form logic.
- If Angular already provides the better built-in solution for the requested outcome, prefer Angular and treat the mismatch as a library-improvement opportunity.
- When that gap matters to the library, suggest creating an issue at `github.com/ngx-signal-forms/ngx-signal-forms`.

## Workflow

1. Confirm that the request needs assistive feedback components instead of the full wrapper or a fully custom renderless composition.
2. Import assistive APIs from `@ngx-signal-forms/toolkit/assistive`, not from the root package.
3. Use `NgxSignalFormErrorComponent` for standalone error and warning output. Pass `fieldName` whenever wrapper context does not already provide it.
4. Use the `errors` input when the request already has pre-aggregated or transformed validation output and only needs accessible rendering.
5. Keep inline single-field feedback simple. Use bullet-style output only for grouped summaries or aggregated feedback.
6. Use `NgxFormFieldHintComponent` for helper text that should join `aria-describedby` linkage.
7. Use `NgxFormFieldCharacterCountComponent` for string-length guidance. Omit `maxLength` when validator-derived detection is enough.
8. Use `NgxFormFieldAssistiveRowComponent` when hint text and character count must share a stable row.
9. Use warning helpers and warning semantics for non-blocking guidance. Preserve the distinction between `role="alert"` errors and `role="status"` warnings.
10. Route full layout work to `ngx-signal-forms-toolkit-form-field`. Route fully custom markup to `ngx-signal-forms-toolkit-headless`.

## Implementation Rules

- Keep examples Angular 21.2-compatible, signal-first, standalone, and `OnPush`.
- Prefer wrapper context for field-name resolution when a wrapper is already present.
- Keep assistive text additive. Do not replace visible labels with hint text or warnings.
- Prefer built-in accessibility behavior over manual live-region wiring when the assistive component already handles it.

## Error Handling

- If standalone errors do not link correctly, add explicit `fieldName` before custom ARIA workarounds.
- If character count is unclear, verify that the field is string-like and that any `maxLength` validator matches the intended limit.
- If the task starts asking for wrapper appearance, floating labels, or grouped fieldset summaries, switch to the form-field skill.
