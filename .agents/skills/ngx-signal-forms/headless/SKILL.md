---
description: Sub-skill of ngx-signal-forms for the @ngx-signal-forms/toolkit/headless entry point — renderless primitives for custom design-system components with full DOM control: headless error state, grouped notifications, error summaries, character count, fieldset aggregation, field-name resolution, and programmatic utilities. Not independently invocable; the hub SKILL.md routes here.
---

# Toolkit Headless

Implements the `@ngx-signal-forms/toolkit/headless` entry point.

Read `../references/api.md` for the full export list, directive selectors, exported names, and signal signatures.

## Principle

The headless entry point exposes toolkit state signals without rendering any markup. It removes repeated error-timing, message-resolution, and ID-management logic from custom components while leaving DOM structure entirely in the consumer's hands.

Choose headless when:

- The design system mandates a specific markup structure incompatible with `ngx-form-field-wrapper`.
- You're building reusable components via `hostDirectives`.
- You need programmatic state (e.g., outside a template).

For ready-to-render components with built-in markup, use `assistive/SKILL.md` or `form-field/SKILL.md`.

## Workflow

1. Import via `NgxHeadlessToolkit` bundle or individual directive exports from `@ngx-signal-forms/toolkit/headless`. Bundle contents: `NgxHeadlessErrorState`, `NgxHeadlessErrorSummary`, `NgxHeadlessFieldset`, `NgxHeadlessCharacterCount`, `NgxHeadlessFieldName`, `NgxHeadlessNotification`.

2. **Provide deterministic identity.** Headless directives need either an explicit `fieldName` input or a stable `id` on the host element. Generate predictable IDs with `createUniqueId()`.

3. **Choose the lightest abstraction:**
   - Template directives (`ngxHeadlessErrorState`, etc.) for page-level custom markup.
   - `hostDirectives` composition for reusable design-system components.
   - `createErrorState()` / `createCharacterCount()` for programmatic use outside template directives.

4. **Wire ARIA manually.** Headless directives expose signal IDs (`errorId`, `warningId`) — bind them in your markup:

   ```html
   [attr.aria-describedby]="errorState.showErrors() ? errorState.errorId : null"
   ```

5. **Use `NgxHeadlessFieldset`** for aggregated group state — validity, errors, and warnings across a field tree without rebuilding the traversal.

6. **Use `NgxHeadlessNotification`** when you already have aggregated `ValidationError[]` and need a grouped live-region surface. Tone is content-driven (no `tone` input): any blocking error raises the assertive `role="alert"` container, a warning-only list raises the polite `role="status"` container — you keep full DOM control.

7. **Reach for the field-optionality helpers** (`createFieldOptionalitySummary`, `summarizeFieldOptionality`, type `FieldOptionality`) when a custom component needs to know whether a field is required/optional to render a marker or legend. See `../references/api.md` for signatures.

## Error Summary Directive Pattern

Use `ngxHeadlessErrorSummary` when you need a form-level summary with full DOM control, want warning entries, or need a design that differs from the styled `NgxFormFieldErrorSummary`.

```html
<div ngxHeadlessErrorSummary #summary="errorSummary" [formTree]="myForm">
  @if (summary.shouldShow() && summary.hasErrors()) {
  <div role="alert">
    <p>Please fix the following errors:</p>
    <ul>
      @for (entry of summary.entries(); track entry.kind + entry.fieldName) {
      <li>
        <button type="button" (click)="entry.focus()">
          <strong>{{ entry.fieldName }}</strong>: {{ entry.message }}
        </button>
      </li>
      }
    </ul>
  </div>
  } @if (summary.shouldShow() && summary.hasWarnings()) {
  <div role="status">
    @for (w of summary.warningEntries(); track w.kind + w.fieldName) {
    <p>{{ w.fieldName }}: {{ w.message }}</p>
    }
  </div>
  }
</div>
```

For a styled out-of-the-box error summary without warnings, use `NgxFormFieldErrorSummary` from `@ngx-signal-forms/toolkit/assistive` instead.

## Grouped Notification Directive Pattern

Use `ngxHeadlessNotification` when a fieldset, summary card, or custom block already owns the grouped `ValidationError[]` list and only needs content-driven tone routing, message lookup, and deterministic IDs. It exposes only `errors` (required) and `fieldName` — there is no `tone` input.

```html
<section
  ngxHeadlessNotification
  #notification="notificationState"
  [errors]="addressErrors"
  fieldName="address"
>
  @if (notification.showErrorContainer()) {
  <div role="alert" [id]="notification.errorContainerId()">
    @for (message of notification.resolvedMessages(); track message.kind + ':' +
    $index) {
    <p>{{ message.message }}</p>
    }
  </div>
  } @if (notification.showWarningContainer()) {
  <div role="status" [id]="notification.warningContainerId()">
    @for (message of notification.resolvedMessages(); track message.kind + ':' +
    $index) {
    <p>{{ message.message }}</p>
    }
  </div>
  }
</section>
```

Tone is fully content-driven — there is no input to set. `resolvedTone()` returns `'error'` whenever any blocking error is present (raising the assertive `role="alert"` container) and `'warning'` for an all-warning list (raising the polite `role="status"` container); an empty list hides both. This preserves urgency semantics automatically.

## Template Directive Pattern

```html
<div
  ngxHeadlessErrorState
  #errorState="errorState"
  [field]="form.email"
  fieldName="email"
>
  <label for="email">Email</label>
  <input
    id="email"
    type="email"
    [formField]="form.email"
    [attr.aria-describedby]="errorState.showErrors() && errorState.hasErrors() ? errorState.errorId : null"
    [attr.aria-invalid]="errorState.hasErrors() || null"
  />
  @if (errorState.showErrors() && errorState.hasErrors()) {
  <ul [id]="errorState.errorId" role="alert">
    @for (error of errorState.resolvedErrors(); track error.kind) {
    <li>{{ error.message }}</li>
    }
  </ul>
  }
</div>
```

## Host Directive Pattern (Reusable Design-System Component)

```typescript
import { Component, inject } from '@angular/core';
import { NgxHeadlessErrorState } from '@ngx-signal-forms/toolkit/headless';

@Component({
  selector: 'ds-form-field',
  hostDirectives: [
    {
      directive: NgxHeadlessErrorState,
      inputs: ['field', 'fieldName', 'strategy'],
    },
  ],
  template: `
    <ng-content select="label" />
    <ng-content />
    @if (errorState.showErrors() && errorState.hasErrors()) {
      <span [id]="errorState.errorId" role="alert" class="ds-error">
        {{ errorState.resolvedErrors()[0].message }}
      </span>
    }
  `,
})
export class DsFormFieldComponent {
  protected readonly errorState = inject(NgxHeadlessErrorState);
}
```

## Field-Name Directive

`NgxHeadlessFieldName` exposes the resolved field name plus the canonical
`errorId` / `warningId` for a control — without any error-state logic. Reach
for it when a custom component owns its own error rendering but still needs
the toolkit's ID conventions (so `aria-describedby` chains stay consistent
with `NgxFormFieldError`, the wrapper, and other toolkit consumers). Prefer
`NgxHeadlessErrorState` when you also want `showErrors()`/`hasErrors()`.

```html
<div ngxHeadlessFieldName #fieldName="fieldName" [field]="form.email">
  <input
    id="email"
    [formField]="form.email"
    [attr.aria-describedby]="fieldName.errorId()"
  />
</div>
```

## Programmatic State

```typescript
import {
  createErrorMessageSignal,
  createErrorState,
  createCharacterCount,
  createFieldStateFlags,
} from '@ngx-signal-forms/toolkit/headless';

// Outside a directive context
const state = createErrorState({
  field: form.email,
  fieldName: 'email',
  strategy: 'on-touch',
});
const count = createCharacterCount({ field: form.bio }); // maxLength auto-detected from validator
const flags = createFieldStateFlags(() => form.email()); // boolean signal flags

// Reactive resolved errors: visibility cascade + 3-tier message resolution
// + stable per-error DOM IDs ({fieldName}-error-{kind}). Use this in custom
// renderers that mount via `*ngComponentOutlet` or any component that wants
// the directive's resolution logic without the directive itself.
const resolved = createErrorMessageSignal(() => form.email(), {
  fieldName: 'email',
  // includeWarnings: true | 'only' (default: false)
  // strategy / submittedStatus inherit from form context when omitted
});
// resolved() => readonly { kind, message, id, error }[]
//   kind:    validator kind (lifted from error.kind for template ergonomics)
//   message: resolved display string
//   id:      `{fieldName}-error-{kind}` — stable for aria-describedby chains
//   error:   raw ValidationError, for params/custom inspection
```

## Utility Functions

```typescript
import {
  readErrors,
  readDirectErrors,
  readFieldFlag,
  dedupeValidationErrors,
  createUniqueId,
} from '@ngx-signal-forms/toolkit/headless';

readErrors(field()); // reads from errorSummary() or errors()
readDirectErrors(field()); // reads only direct-field errors, not descendants
readFieldFlag(field(), 'invalid'); // safe boolean read
dedupeValidationErrors(errors); // remove duplicate messages
createUniqueId('my-field'); // 'my-field-1', 'my-field-2', ...
```

## Error Handling

- If IDs are inconsistent: add explicit `fieldName` instead of relying on implicit host `id` detection.
- If `'on-submit'` errors don't appear: ensure the form uses `form[formRoot][ngxSignalForm]` so submitted status and toolkit context are available.
- If a grouped notification resolves to the wrong live region: check whether the error list includes any blocking errors — tone is content-driven, so `role="alert"` is used whenever any blocking error is present, regardless of intent.
- If the component is recreating the full wrapper layout: stop and use `form-field/SKILL.md` instead.
