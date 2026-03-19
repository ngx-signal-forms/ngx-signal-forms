# Toolkit Headless Reference Map

## Portability note

This file is safe to copy outside this repository.

- Treat the headless patterns below as portable guidance.
- Treat any repository paths as optional examples that only exist in `ngx-signal-forms`.
- When those paths do not exist, use the installed package docs or the public GitHub repository instead.

## Portable patterns

- Use the headless entry point when the project needs full control over markup and styling but still wants toolkit-managed visibility, message resolution, and IDs.
- Prefer headless directives for page-level custom markup and `hostDirectives` for reusable design-system components.
- Keep `fieldName` or another stable identity explicit whenever the headless layer does not own the rendered input structure.

## Repository docs and demo map (optional)

Use these paths only when working inside this repository.

- `.github/instructions/ngx-signal-forms-toolkit.instructions.md`
- `packages/toolkit/headless/README.md`
- `packages/toolkit/README.md`
- `apps/demo/src/app/03-headless/error-state/error-state.form.ts`
  - Shows custom error rendering driven by headless visibility and message state.
- `apps/demo/src/app/03-headless/error-state/error-state.page.ts`
  - Shows headless UI side by side with the debugger for visibility inspection.
- `apps/demo/src/app/03-headless/fieldset-utilities/fieldset-utilities.form.ts`
  - Shows aggregated group state and fieldset-oriented utilities.
- `apps/demo/src/app/03-headless/fieldset-utilities/fieldset-utilities.page.ts`
  - Shows why grouped state is useful when custom markup must stay in charge.

## Why this feature family exists

- Keep toolkit state logic while giving consumers complete control over DOM structure, styling, and component composition.
- Remove repeated error-timing, message-resolution, and ID-management logic from custom design-system components.
