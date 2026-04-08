---
name: ngx-signal-forms-core
description: Implements the core @ngx-signal-forms/toolkit entry point. Use when adding form[formRoot][ngxSignalForm], auto-ARIA, control semantics directive (ngxSignalFormControl), control preset providers (provideNgxSignalFormControlPresets), error visibility strategies, global config, error-message registries, warning helpers, submission helpers (focusFirstInvalid, submitWithWarnings), or immutable array utilities. Part of the ngx-signal-forms skill suite; read the hub SKILL.md first if unsure which sub-skill applies.
---

# Toolkit Core

Implements the root `@ngx-signal-forms/toolkit` entry point.

Read `../references/api.md` when you need the full export list, type signatures, or config interface details.

## Principle

The toolkit is an enhancement layer, not a replacement. Angular Signal Forms owns the form model, validation, field state, and submission. The core entry point adds ARIA wiring, error visibility control, centralized message resolution, and submission lifecycle utilities on top.

## Workflow

1. **Use `form[formRoot][ngxSignalForm]` for toolkit-backed forms.** Angular `FormRoot` owns native form submission behavior, while `ngxSignalForm` activates toolkit form context, submitted-status tracking, and form-level error strategy behavior. Add `novalidate` manually only when opting out of Angular `[formRoot]` entirely.

2. **Choose error strategy deliberately:**
   - `'on-touch'` — show errors after user interaction (default, good for most forms)
   - `'immediate'` — show errors from first load (useful for live guidance or sign-up flows)

- `'on-submit'` — show errors only after submission attempt (requires `form[formRoot][ngxSignalForm]` for toolkit submission context)

3. **Let auto-ARIA manage ARIA attributes.** `NgxSignalFormAutoAriaDirective` (bundled in `NgxSignalFormToolkit`) handles `aria-invalid`, `aria-required`, and `aria-describedby` for text-like `[formField]` controls, selects, textareas, custom hosts, and checkbox-based switches that opt in with `role="switch"`. Standard checkboxes and radios stay excluded. Never add those attributes manually.

4. **Remember that standalone imports are template-local.** Importing `NgxSignalFormToolkit` in a parent form component does not make `NgxSignalFormAutoAriaDirective` available inside a child component's template. If a custom control renders the actual `<input [formField]>` itself, import the toolkit bundle or the directive in that child component.

5. **Declare control semantics for non-text-like controls.** `NgxSignalFormControlSemanticsDirective` (included in `NgxSignalFormToolkit`) writes stable `data-ngx-signal-form-control-*` attributes the wrapper and auto-ARIA use to pick correct layout and ARIA behavior instead of guessing from DOM heuristics.
   - Use `ngxSignalFormControl="switch"` on a native `input[type="checkbox"][role="switch"]` to opt it into switch wrapper styling and ARIA.
   - Use `ngxSignalFormControl="checkbox"` on a plain `input[type="checkbox"]` when it should opt in to wrapper validation display.
   - Use `ngxSignalFormControl="slider"` or `ngxSignalFormControl="composite"` on a custom component host to declare layout and ARIA ownership.
   - Pass an object for combined overrides: `[ngxSignalFormControl]="{ kind: 'slider', layout: 'stacked', ariaMode: 'manual' }"`.
   - Use `ngxSignalFormControlAria="manual"` alone when you only need to suppress auto-ARIA without declaring a kind.

6. **Use `provideNgxSignalFormControlPresets()` for component-wide semantic defaults.** When all sliders or all switches in a feature should share the same `layout`/`ariaMode`, avoid repeating the directive object on every element:

   ```typescript
   providers: [
     ...provideNgxSignalFormControlPresetsForComponent({
       slider: { layout: 'custom', ariaMode: 'manual' },
     }),
   ];
   ```

   Explicit `ngxSignalFormControl` directive inputs still override preset defaults.

7. **Use `provideErrorMessages()` for centralized validation copy.** Message priority: validator-provided `error.message` → registry → toolkit default.

8. **Use warning helpers for non-blocking guidance.** Warnings use `kind: 'warn:*'` convention and render with polite ARIA (`role="status"`). Blocking errors render with assertive ARIA (`role="alert"`).

9. **Use submission helpers over manual state tracking:**
   - `focusFirstInvalid(form)` — focus on invalid target after failed submit
   - `createOnInvalidHandler()` — creates an `onInvalid` callback for `form()` submit options
   - `submitWithWarnings(form, callback)` — submit even when only warnings remain
   - `hasSubmitted(form)` — `Signal<boolean>` for completed submission tracking

## Core Pattern

```typescript
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [formRoot]="userForm" ngxSignalForm errorStrategy="on-submit">
      <ngx-signal-form-field-wrapper
        [formField]="userForm.email"
        appearance="outline"
      >
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          [formField]="userForm.email"
          placeholder=" "
        />
      </ngx-signal-form-field-wrapper>
      <button type="submit">Submit</button>
    </form>
  `,
})
export class ExampleComponent {
  readonly #model = signal({ email: '' });
  protected readonly userForm = form(this.#model, (path) => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Enter a valid email' });
  });
}
```

## Global Configuration

```typescript
// app.config.ts
import {
  provideNgxSignalFormsConfig,
  provideErrorMessages,
} from '@ngx-signal-forms/toolkit';

export const appConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      defaultErrorStrategy: 'on-submit', // 'immediate' | 'on-touch' | 'on-submit'
      defaultFormFieldAppearance: 'outline', // 'stacked' | 'outline' | 'plain'
      autoAria: true, // default: true
    }),
    provideErrorMessages({
      required: 'This field is required',
      email: 'Please enter a valid email address',
      minLength: ({ minLength }) => `At least ${minLength} characters`,
    }),
  ],
};
```

Never use `'inherit'` in global config — only in field-level or component-level inputs.

## Warning Helpers

```typescript
import { warningError } from '@ngx-signal-forms/toolkit';

// In a validator
return warningError('weak-password', 'Consider using 12+ characters');
```

Use `canSubmitWithWarnings(form)` and `submitWithWarnings(form, callback)` when warnings should not block submission. Angular Signal Forms treats all `ValidationError`s as blockers by default.

## Immutable Array Helpers

```typescript
import { updateAt, updateNested } from '@ngx-signal-forms/toolkit';

// Concise immutable state updates for NgRx Signal Store or signal.update()
patchState(store, (s) => ({
  destinations: updateNested(
    s.destinations,
    destIdx,
    'activities',
    actIdx,
    (a) => ({ ...a, name: 'Updated' }),
  ),
}));
```

## Error Handling

- If `'on-submit'` errors don't appear: verify the form uses `form[formRoot][ngxSignalForm]` — toolkit `submittedStatus` and form context require it.
- If `aria-describedby` links are missing: ensure bound controls have a stable `id` attribute; for nested or dynamically identified controls inside wrappers, prefer an explicit `fieldName` on the wrapper.
- If a switch does not receive auto-ARIA: confirm the actual bound element is `input[type="checkbox"][role="switch"]` and that the component rendering it imported the toolkit in its own standalone `imports`.
- If ARIA attributes are duplicated: check for manual additions alongside auto-ARIA; remove the manual ones, or use `ngxSignalFormControlAria="manual"` to suppress auto management.
- If wrapper layout is wrong for a custom control (e.g., outlined appearance on a slider, or inline layout on a composite): add `ngxSignalFormControl="slider"` (or the appropriate kind) to declare explicit semantics. For component-wide defaults, use `provideNgxSignalFormControlPresetsForComponent()`.
- If submission helpers don't block on warnings: use `submitWithWarnings()` and ensure the validator uses `warningError()` with a `warn:` prefix kind.
