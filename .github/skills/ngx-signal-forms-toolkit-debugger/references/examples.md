# Toolkit Debugger Reference Map

## Portability note

This file is safe to copy outside this repository.

- Treat the debugger patterns below as portable guidance.
- Treat any repository paths as optional examples that only exist in `ngx-signal-forms`.
- When those paths do not exist, use the installed package docs or the public GitHub repository instead.

## Portable patterns

- Use the debugger only for development, demos, and local inspection.
- Pass the field tree, not the root state snapshot, when the debugger must traverse nested fields.
- Place the debugger beside the form when the goal is to explain visibility rules, warnings, or submission state.

## Repository docs and demo map (optional)

Use these paths only when working inside this repository.

- `packages/toolkit/debugger/README.md`
- `.github/instructions/ngx-signal-forms-toolkit.instructions.md`
- `apps/demo/src/app/00-signal-forms-only/pure-signal-form/`
  - Shows debugger use even in the baseline example so hidden form state stays visible during teaching.
- `apps/demo/src/app/01-getting-started/your-first-form/`
  - Shows debugger placement next to early toolkit adoption.
- `apps/demo/src/app/02-toolkit-core/`
  - Shows debugger use for explaining error strategies, warning state, and accessibility comparisons.
- `apps/demo/src/app/03-headless/`
  - Shows debugger support for custom markup where state is otherwise harder to inspect.
- `apps/demo/src/app/04-form-field-wrapper/`
  - Shows debugger use beside styled wrappers, grouped fieldsets, and custom controls.
- `apps/demo/src/app/05-advanced/`
  - Shows debugger support for advanced configuration, async validation, submission flows, and cross-field rules.

## Why this feature family exists

- Make invisible form state legible while teaching or debugging Angular Signal Forms and toolkit behavior.
- Help demo pages compare timing strategies, error visibility, warnings, and live model updates without adding custom one-off debug panels.
