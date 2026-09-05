---
description: Debugger toolkit surface. Use when adding dev-only form-tree inspection or debugger badge directives.
---

# Toolkit Debugger (Internal/Demo Only)

Implements the `@ngx-signal-forms/debugger` entry point for internal use.

## Principle

The debugger is a **development-only** tool that makes invisible form state visible — field validity, touched/dirty state, error visibility with current strategy, warnings vs blockers, and live model values. Use it in dev builds, demo pages, and teaching examples. Never ship it in production UI.

**Note:** This component is internal to the repository and not published as part of `@ngx-signal-forms/toolkit`.

## Workflow

1. **Import the bundle for the full debugger surface.** Prefer `NgxSignalFormDebuggerToolkit` — it includes the panel plus the standalone badge directives in one import:

   ```typescript
   import { NgxSignalFormDebuggerToolkit } from '@ngx-signal-forms/debugger';
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

4. **Guard rendering with `@if (isDevMode())`.** The debugger does not apply a production rendering guard itself. A host-template guard prevents production rendering, but does not guarantee removal of imported JavaScript or CSS. Keep debugger imports out of production entry paths when bundle exclusion is required, and verify the built output with bundle analysis. Do not promise fixed byte savings.

5. Use `errorStrategy` input on the debugger component to highlight a specific strategy in teaching contexts.

## Usage

```typescript
import { Component, signal, isDevMode } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
import { NgxSignalFormDebuggerToolkit } from '@ngx-signal-forms/debugger';

@Component({
  selector: 'app-debug-form',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormFieldError,
    NgxSignalFormDebuggerToolkit,
  ],
  template: `
    <div class="split-layout">
      <form [formRoot]="demoForm" ngxSignalForm>
        <label for="name">Name</label>
        <input id="name" [formField]="demoForm.name" />
        <ngx-form-field-error [formField]="demoForm.name" fieldName="name" />
        <button type="submit">Submit</button>

        @if (isDev) {
          <ngx-signal-form-debugger [formTree]="demoForm" title="Live state" />
        }
      </form>
    </div>
  `,
})
export class DebugFormComponent {
  protected readonly isDev = isDevMode();
  readonly #model = signal({ name: '' });
  protected readonly savedName = signal<string | null>(null);
  protected readonly demoForm = form(
    this.#model,
    (path) => {
      required(path.name);
    },
    {
      submission: {
        action: async (tree) => {
          this.savedName.set(tree().value().name);
        },
      },
    },
  );
}
```

## Debugger Badges

`NgxSignalFormDebuggerBadge` and `NgxSignalFormDebuggerBadgeIcon` are the
standalone status chips the panel composes internally. Use them directly when
you want a compact inline indicator (e.g., next to a submit button) without
the full panel. They're included in `NgxSignalFormDebuggerToolkit` — import the
bundle and drop the directives into your template. Badge inputs: `variant`
(`'solid' | 'outline' | 'ghost'`, default `'solid'`) and `appearance`
(`'neutral' | 'info' | 'success' | 'warning' | 'danger'`, default `'neutral'`).

## What the Debugger Shows

- Each field's current validation state: valid/invalid, touched/dirty, pending
- Current errors and warnings with their `kind` values
- Whether errors are currently visible given the active error strategy
- Submitted status from the `ngxSignalForm` enhancer's context, not Angular `FormRoot`
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
- If submitted state doesn't show: place the debugger inside `form[formRoot][ngxSignalForm]` so it can inject the enhancer's context. A sibling debugger does not inherit that element-scoped context.
- If strategy mismatch in debugger: set `[errorStrategy]` explicitly on the debugger component.
- If the debugger ships in a production bundle: inspect production imports and the built output. A template `@if` controls rendering; it is not proof of bundle exclusion.
