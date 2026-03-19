---
name: ngx-signal-forms-toolkit-debugger
description: Implements development-only form debugging with @ngx-signal-forms/toolkit/debugger. Use when adding live form-tree inspection panels, surfacing hidden versus visible validation state, or wiring debugger components into demo and example pages in projects that use the toolkit. Don't use for production UI, validation behavior itself, or field wrapper and headless composition tasks.
---

# Toolkit Debugger

Implement requests that belong to `@ngx-signal-forms/toolkit/debugger`.

Read `references/examples.md` when the task needs portable debugger patterns or an optional repo-aligned layout pattern for placing the debugger next to a live form and using it to explain state transitions.

## Portability

- Use this skill both inside and outside `ngx-signal-forms`.
- If repository-local docs are unavailable, rely on the installed package docs and the public toolkit repository.

## Core principle

- Treat the debugger entry point as a development aid for Angular Signal Forms plus toolkit behavior, not as a parallel form system.
- Prefer Angular-native behavior whenever Angular already provides the correct solution and use the debugger to inspect that behavior rather than replace it.
- Use debugger components to make Angular Signal Forms state and toolkit visibility rules easier to understand together.
- If the debugger reveals that Angular already solves the requested behavior better than the toolkit, prefer Angular and treat the mismatch as a library-improvement opportunity.
- When that gap matters to the library, suggest creating an issue at `github.com/ngx-signal-forms/ngx-signal-forms`.

## Workflow

1. Confirm that the request is development-only or demo-only. Do not introduce debugger UI as production functionality.
2. Import debugger APIs from `@ngx-signal-forms/toolkit/debugger`.
3. Pass the field tree function, such as `userForm`, to `[formTree]`. Do not pass `userForm()` when the debugger needs to traverse child fields.
4. Place the debugger where it supports explanation without overwhelming the form, usually in a split layout sidebar or under a comparison block.
5. Set `errorStrategy`, `title`, or `subtitle` only when the page needs to surface a specific teaching point.
6. Use the debugger to inspect hidden versus visible errors, warnings versus blockers, and current model values. Keep validation logic in the form, not in the debugger.
7. Guard debugger rendering behind non-production conditions whenever the page is not strictly a demo surface.

## Implementation Rules

- Keep examples Angular 21.2-compatible, signal-first, standalone, and `OnPush`.
- Pair debugger usage with live forms that expose meaningful state transitions.
- Use it as an explanation aid for demos, comparisons, and local debugging rather than as a permanent dashboard.

## Error Handling

- If visibility looks wrong, verify that the component passed a field tree instead of a root field state snapshot.
- If `'on-submit'` behavior appears inconsistent, verify that the surrounding form uses `[formRoot]` or another real submitted-state source.
- If the request is really about changing validation or layout behavior, switch to the appropriate feature skill after using the debugger to inspect the current state.
