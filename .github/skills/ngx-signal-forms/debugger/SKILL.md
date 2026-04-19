---
description: Sub-skill of ngx-signal-forms for the @ngx-signal-forms/toolkit/debugger entry point — the dev-only form-tree panel and standalone badge directives for visualizing validation state, error visibility, warnings, and submission state in development or demo pages, plus production tree-shaking guidance. Not independently invocable; the hub SKILL.md routes here.
---

# Toolkit Debugger

Implements the `@ngx-signal-forms/toolkit/debugger` entry point.

## Principle

The debugger is a **development-only** tool that makes invisible form state visible — field validity, touched/dirty state, error visibility with current strategy, warnings vs blockers, and live model values. Use it in dev builds, demo pages, and teaching examples. Never ship it in production UI.

## Workflow

1. **Import the bundle for the full debugger surface.** Prefer `NgxSignalFormDebuggerToolkit` — it includes the panel plus the standalone badge directives in one import:

   ```typescript
   import { NgxSignalFormDebuggerToolkit } from '@ngx-signal-forms/toolkit/debugger';
   ```

   Import `NgxSignalFormDebugger` on its own when you only need the panel and don't use the badges.

2. **Pass the field tree, not a state snapshot:**

   ```html
   <!-- Correct: passes the form field tree -->
   <ngx-signal-form-debugger [formTree]="userForm" />

   <!-- Wrong: passes a state snapshot, loses child traversal -->
   <ngx-signal-form-debugger [formTree]="userForm()" />
   ```

3. **Place the debugger alongside the form** — a side-by-side split layout works well for demos showing how error strategies, warnings, and submission state interact.

4. **Guard with `@if (isDevMode())` so the bundle tree-shakes.** The debugger self-guards rendering with `isDevMode()` so production builds ship zero DOM even without a guard, but the compiled bundle still carries the ~13 KB JS + ~15 KB SCSS. Wrapping the element in `@if (isDevMode())` lets the compiler drop the code path entirely.

5. Use `errorStrategy` input on the debugger component to highlight a specific strategy in teaching contexts.

## Usage

```typescript
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  isDevMode,
} from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormDebuggerToolkit } from '@ngx-signal-forms/toolkit/debugger';

@Component({
  selector: 'app-debug-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormDebuggerToolkit],
  template: `
    <div class="split-layout">
      <form [formRoot]="demoForm" ngxSignalForm>
        <input id="name" [formField]="demoForm.name" />
        <button type="submit">Submit</button>
      </form>

      @if (isDev) {
        <ngx-signal-form-debugger [formTree]="demoForm" title="Live state" />
      }
    </div>
  `,
})
export class DebugFormComponent {
  protected readonly isDev = isDevMode();
  readonly #model = signal({ name: '' });
  protected readonly demoForm = form(this.#model, (path) => {
    required(path.name);
  });
}
```

## Debugger Badges

`NgxSignalFormDebuggerBadge` and `NgxSignalFormDebuggerBadgeIcon` are the
standalone status chips the panel composes internally. Use them directly when
you want a compact inline indicator (e.g., next to a submit button) without
the full panel. They're included in `NgxSignalFormDebuggerToolkit` — import the
bundle and drop the directives into your template. Badge appearance options:
`'solid' | 'outline'`; variants: `'neutral' | 'success' | 'warning' | 'danger'`.

## What the Debugger Shows

- Each field's current validation state: valid/invalid, touched/dirty, pending
- Current errors and warnings with their `kind` values
- Whether errors are currently visible given the active error strategy
- Submitted status from `[formRoot]`
- Live model value at each field

## Debugger Inputs

| Input           | Description                                        |
| --------------- | -------------------------------------------------- |
| `formTree`      | Required — the form field tree (not `form()`)      |
| `errorStrategy` | Optional override to highlight a specific strategy |
| `title`         | Panel title                                        |
| `subtitle`      | Panel subtitle                                     |

## Theming

CSS hooks use the shorter `--ngx-debugger-*` prefix. The `ngx-signal-form-debugger-*`
prefix is reserved for element and directive selectors — not CSS variables.

```css
ngx-signal-form-debugger {
  --ngx-debugger-bg: #ffffff;
  --ngx-debugger-border-color: #e5e7eb;
  --ngx-debugger-text-color: #111827;
  --ngx-debugger-color-success: #22c55e;
  --ngx-debugger-color-warning: #f59e0b;
  --ngx-debugger-color-danger: #ef4444;
  --ngx-debugger-font-size-base: 0.875rem;
  --ngx-debugger-border-radius: 0.5rem;
}
```

Dark mode is supported through `.dark` class context on an ancestor.

## Error Handling

- If child fields don't appear in the tree: check that you passed `formTree` (not `formTree()`).
- If submitted state doesn't show: verify the form uses `form[formRoot][ngxSignalForm]`.
- If strategy mismatch in debugger: set `[errorStrategy]` explicitly on the debugger component.
- If the debugger ships in a production bundle: wrap the element in `@if (isDevMode())` so the compiler can tree-shake the code path, not just the DOM.
