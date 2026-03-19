---
name: ngx-signal-forms-toolkit-headless
description: Implements renderless primitives from @ngx-signal-forms/toolkit/headless. Use when building custom design-system form components with headless error state, character count, fieldset aggregation, field-name resolution, or hostDirective composition in projects that use the toolkit. Don't use for pre-styled wrappers, assistive components with built-in markup, or simple core toolkit forms that can use existing components directly.
---

# Toolkit Headless

Implement requests that belong to `@ngx-signal-forms/toolkit/headless`.

Read `references/examples.md` when the task needs portable headless patterns or an optional demo-aligned choice between template directives, host-directive composition, programmatic helpers, and aggregated fieldset state.

## Portability

- Use this skill both inside and outside `ngx-signal-forms`.
- If repository-local docs are unavailable, rely on the installed package docs and the public toolkit repository.

## Core principle

- Treat the headless entry point as a renderless extension on top of Angular Signal Forms.
- Prefer Angular-native solutions for the underlying form model, validation rules, submission flow, and field state whenever Angular already provides them.
- Use headless primitives to avoid rewriting accessibility and visibility plumbing, not to rebuild Angular form behavior from scratch.
- If Angular already provides the better solution for the requested outcome, prefer Angular and treat the overlap as a signal that the toolkit should improve instead of competing.
- When that gap matters to the library, suggest creating an issue at `github.com/ngx-signal-forms/ngx-signal-forms`.

## Workflow

1. Confirm that the task needs full control over markup or design-system styling. Switch back to the styled wrapper skill if built-in markup is acceptable.
2. Import from `@ngx-signal-forms/toolkit/headless`, either through `NgxHeadlessToolkit` or the specific directive and helper exports.
3. Choose the lightest abstraction that fits the request:
   - Use template directives for custom page-level markup.
   - Use `hostDirectives` when building reusable components.
   - Use `createErrorState()` or `createCharacterCount()` for programmatic state without directives.
4. Provide deterministic identity. Supply `fieldName` or a stable host `id` so generated error and warning IDs remain predictable.
5. Use `NgxHeadlessFieldNameDirective` when field-name resolution and generated IDs should be composed separately from the error-state directive.
6. Wire `aria-describedby`, live regions, and visible feedback in the host markup using the IDs and signals returned by the headless primitives.
7. Use `NgxHeadlessErrorStateDirective` for visibility logic and resolved messages, `NgxHeadlessCharacterCountDirective` for threshold-aware counts, and `NgxHeadlessFieldsetDirective` for aggregated group state.
8. If the form is not using `[formRoot]`, add `novalidate` and manage submission explicitly instead of assuming the headless layer provides native-form behavior.
9. Use `readErrors()`, `readFieldFlag()`, `dedupeValidationErrors()`, and `createUniqueId()` when manual logic would otherwise repeat toolkit internals.
10. Preserve Angular Signal Forms as the source of truth. Use the headless layer to remove repeated UI-state plumbing, not to replace the underlying field model.

## Implementation Rules

- Keep examples Angular 21.2-compatible, signal-first, standalone, and `OnPush`.
- Keep roles, landmarks, and visible labels in the custom markup. Headless primitives expose state, not accessible structure.
- Prefer host-directive composition for reusable design-system components in this repository.
- Route helper-text and pre-styled feedback needs to `ngx-signal-forms-toolkit-assistive` or `ngx-signal-forms-toolkit-form-field` when those layers already satisfy the request.

## Error Handling

- If IDs or `aria-describedby` links are unstable, add explicit `fieldName` before custom ID generators.
- If `'on-submit'` behavior is needed, verify that real submission state is available instead of assuming headless primitives invent it.
- If the task starts recreating the full wrapper component, stop and switch to the styled wrapper skill.
