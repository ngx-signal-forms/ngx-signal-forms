---
name: ngx-signal-forms-core
description: Implements the core @ngx-signal-forms/toolkit entry point. Use when adding form[formRoot][ngxSignalForm], auto-ARIA, error visibility strategies, global config, error-message registries, warning helpers, submission helpers (focusFirstInvalid, submitWithWarnings), or immutable array utilities. Part of the ngx-signal-forms skill suite; read the hub SKILL.md first if unsure which sub-skill applies.
---

# Toolkit Core

Implements the root `@ngx-signal-forms/toolkit` entry point.

Read `../references/api.md` when you need the full export list, type signatures, or config interface details.

## Principle

The toolkit is an enhancement layer, not a replacement. Angular Signal Forms owns the form model, validation, field state, and submission. The core entry point adds ARIA wiring, error visibility control, centralized message resolution, and submission lifecycle utilities on top.

## Workflow

1. **Prefer `[formRoot]` for all toolkit-backed forms.** Without it, error strategies and child component context injection do not function. Add `novalidate` manually only when opting out of `[formRoot]`.

2. **Choose error strategy deliberately:**
   - `'on-touch'` — show errors after user interaction (default, good for most forms)
   - `'immediate'` — show errors from first load (useful for live guidance or sign-up flows)
   - `'on-submit'` — show errors only after submission attempt (requires `[formRoot]` for submitted status)

3. **Let auto-ARIA manage ARIA attributes.** `NgxSignalFormAutoAriaDirective` (bundled in `NgxSignalFormToolkit`) handles `aria-invalid`, `aria-required`, and `aria-describedby` for all `[formField]` controls except radio/checkbox. Never add those attributes manually.

4. **Use `provideErrorMessages()` for centralized validation copy.** Message priority: validator-provided `error.message` → registry → toolkit default.

5. **Use warning helpers for non-blocking guidance.** Warnings use `kind: 'warn:*'` convention and render with polite ARIA (`role="status"`). Blocking errors render with assertive ARIA (`role="alert"`).

6. **Use submission helpers over manual state tracking:**
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
    <form [formRoot]="userForm" [errorStrategy]="'on-submit'">
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
      defaultFormFieldAppearance: 'outline', // 'standard' | 'outline'
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

- If `'on-submit'` errors don't appear: verify `[formRoot]` is present — `submittedStatus` requires it.
- If `aria-describedby` links are missing: ensure bound controls have a stable `id` attribute.
- If ARIA attributes are duplicated: check for manual additions alongside auto-ARIA; remove the manual ones.
- If submission helpers don't block on warnings: use `submitWithWarnings()` and ensure the validator uses `warningError()` with a `warn:` prefix kind.
