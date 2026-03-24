---
name: ngx-signal-forms-debugger
description: Implements @ngx-signal-forms/toolkit/debugger development-time form inspection. Use when adding a live form-tree panel to visualize validation state, error visibility, warnings, or submission state during development or in demo pages. Part of the ngx-signal-forms skill suite.
---

# Toolkit Debugger

Implements the `@ngx-signal-forms/toolkit/debugger` entry point.

## Principle

The debugger is a **development-only** tool that makes invisible form state visible — field validity, touched/dirty state, error visibility with current strategy, warnings vs blockers, and live model values. Use it in dev builds, demo pages, and teaching examples. Never ship it in production UI.

## Workflow

1. Import `NgxSignalFormDebugger` from `@ngx-signal-forms/toolkit/debugger`.

2. **Pass the field tree, not a state snapshot:**

   ```html
   <!-- Correct: passes the form field tree -->
   <ngx-signal-form-debugger [formTree]="userForm" />

   <!-- Wrong: passes a state snapshot, loses child traversal -->
   <ngx-signal-form-debugger [formTree]="userForm()" />
   ```

3. **Place the debugger alongside the form** — a side-by-side split layout works well for demos showing how error strategies, warnings, and submission state interact.

4. **Guard production builds.** Wrap debugger usage in a `@if (isDev)` check or use `isDevMode()`.

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
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';

@Component({
  selector: 'app-debug-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormDebugger],
  template: `
    <div class="split-layout">
      <form [formRoot]="demoForm">
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

## Error Handling

- If child fields don't appear in the tree: check that you passed `formTree` (not `formTree()`).
- If submitted state doesn't show: verify the form uses `[formRoot]`.
- If strategy mismatch in debugger: set `[errorStrategy]` explicitly on the debugger component.
