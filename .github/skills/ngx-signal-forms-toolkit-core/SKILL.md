---
name: ngx-signal-forms-toolkit-core
description: Implements the core @ngx-signal-forms/toolkit entry point for Angular Signal Forms consumers. Use when adding form[formRoot], auto-ARIA, error visibility strategies, warning helpers, global config, error-message registries, submission helpers, or immutable field utilities in projects that use the toolkit. Don't use for pre-styled field wrappers, renderless custom UI primitives, or debugger-only tasks handled by the secondary entry point skills.
---

# Toolkit Core

Implement requests that belong to the root `@ngx-signal-forms/toolkit` entry point.

Read `references/examples.md` when the task needs portable patterns, optional demo-aligned examples, or a choice between starter adoption, warning support, error timing, submission helpers, and global configuration.

## Portability

- Use this skill both inside and outside `ngx-signal-forms`.
- If repository-local docs are unavailable, rely on the installed package docs and the public toolkit repository.

## Core principle

- Treat `@ngx-signal-forms/toolkit` as an extension layer on top of Angular Signal Forms, not as a replacement for Angular-native form capabilities.
- Prefer Angular-native solutions for form creation, validation, submission, field state, and other behavior that Angular already provides well.
- Use the toolkit only where it adds UX, accessibility, composition, or developer-experience value beyond Angular itself.
- If Angular already offers the better solution for the requested behavior, choose the Angular solution, avoid re-implementing it in the toolkit, and note that the library should improve rather than compete.
- When that gap matters to the library, suggest creating an issue at `github.com/ngx-signal-forms/ngx-signal-forms`.

## Workflow

1. Confirm that the task belongs to the root entry point. Route styled wrapper work to `ngx-signal-forms-toolkit-form-field`, renderless custom UI to `ngx-signal-forms-toolkit-headless`, and debugger panels to `ngx-signal-forms-toolkit-debugger`.
2. Prefer `NgxSignalFormToolkit` plus `form[formRoot]` for toolkit-backed forms. Use `[formRoot]` whenever the request needs form context, `'on-submit'` behavior, or shared error strategy.
3. Use only stable public root exports documented by the installed package docs and `references/examples.md`. Avoid removed or non-public APIs such as `manual`, `bare`, `computeShowErrors`, `canSubmit`, `isSubmitting`, or old config fields.
4. Let the toolkit manage `aria-invalid`, `aria-required`, and `aria-describedby`. Do not add those attributes manually to toolkit-managed controls.
5. Choose error timing deliberately:
   - Use `'on-touch'` for most forms.
   - Use `'immediate'` for live guidance.
   - Use `'on-submit'` only with real submitted state, usually from `[formRoot]`.
6. Use `warningError()` and related helpers for non-blocking guidance. Preserve the distinction between blocking errors and warnings.
7. Use `provideNgxSignalFormsConfig()` and `provideErrorMessages()` only through the stable config and registry surfaces. Keep global defaults resolved instead of using `'inherit'`.
8. Reach for `showErrors()`, `combineShowErrors()`, `shouldShowErrors()`, `focusFirstInvalid()`, `createOnInvalidHandler()`, `createSubmittedStatusTracker()`, `submitWithWarnings()`, `updateAt()`, or `updateNested()` when they remove repeated logic instead of re-implementing it.
9. Keep field identity deterministic. Prefer real control `id` values. Provide explicit `fieldName` only when an `id` is unavailable or unstable.

## Implementation Rules

- Import assistive, form-field, headless, and debugger APIs from their own secondary entry points.
- Keep examples Angular 21.2-compatible, signal-first, standalone, and `OnPush`.
- Use `form()` models as the source of truth and reset both the form state and the underlying signal model when clearing data.
- Treat warnings as guidance, not blockers, and preserve the `alert` versus `status` semantics that the toolkit already encodes.

## Error Handling

- If `'on-submit'` feedback does not appear, verify that the form uses `[formRoot]` or another real submitted-status source.
- If ARIA linkage fails, stabilize the control `id` before inventing custom ARIA plumbing.
- If the task drifts into grouped wrappers, custom styled fields, or renderless composition, switch to the more specific toolkit skill instead of stretching root patterns beyond their boundary.
