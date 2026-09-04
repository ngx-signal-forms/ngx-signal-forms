---
description: Headless toolkit surface. Use when building custom form markup with renderless state, programmatic feedback, or ARIA composition.
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

4. **Compose ARIA from toolkit primitives.** Headless directives expose the IDs as signals (`errorId`, `warningId`), so call them in the template:

```html
<input
  [attr.aria-describedby]="errorState.shouldShowErrors() ? errorState.errorId() : null"
/>
```

Both return `null` until a field name resolves. Keep the `null` — an unresolved name must not produce an id like `-error`.

For a reusable custom wrapper that owns its ARIA, use the re-exported
factories instead of recreating toolkit resolution rules: `createAriaInvalidSignal`,
`createAriaRequiredSignal`, `createAriaDescribedBySignal`, and
`createHintIdsSignal`. Use `createFieldNameResolver` for the canonical
explicit → optional label `for` → control `id` identity cascade.
`createAriaDescribedByBridge` is only for a host whose `aria-describedby`
is owned by another library. A custom wrapper's error-renderer inputs
(`{ formField, strategy, submittedStatus }`) and hint descriptors (for
`NGX_SIGNAL_FORM_HINT_REGISTRY`) are each a single inline `computed()` —
too small to warrant a shared factory; see `docs/CUSTOM_WRAPPERS.md` for
the shape. Read `../references/api.md` for the remaining factories'
contracts before composing them.

5. **Use `NgxHeadlessFieldset`** for aggregated group state — validity, errors, and warnings across a field tree without rebuilding the traversal. Building a custom grouped surface instead? The same pipelines are exported as the pure factories `createFieldsetAggregation()` and `createErrorSummaryEntries()` — no injection context required, but you supply pre-resolved `showErrors` and `showWarnings` signals from your own `createErrorVisibility()` / `createWarningVisibility()` calls — one per channel, since passing a single signal for both re-couples warning timing to the error strategy (ADR-0007). See `../references/api.md` for the option/result contracts.

6. **Use `NgxHeadlessNotification`** when you already have aggregated `ValidationError[]` and need a grouped live-region surface. Tone is content-driven (no `tone` input): any blocking error raises the assertive `role="alert"` container, a warning-only list raises the polite `role="status"` container — you keep full DOM control.

7. **Reach for the field-optionality helpers** (`createFieldOptionalitySummary`, `summarizeFieldOptionality`, type `FieldOptionality`) when a custom component needs to know whether a field is required/optional to render a marker or legend. See `../references/api.md` for signatures.

## Error Summary Directive Pattern

Use `ngxHeadlessErrorSummary` when you need a form-level summary with full DOM control, want warning entries, or need a design that differs from the styled `NgxFormFieldErrorSummary`.

```html
<div ngxHeadlessErrorSummary #summary="errorSummary" [formTree]="myForm">
  @if (summary.shouldShow()) {
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
  } @if (summary.shouldShowWarnings()) {
  <div role="status">
    @for (w of summary.warningEntries(); track w.kind + w.fieldName) {
    <p>{{ w.fieldName }}: {{ w.message }}</p>
    }
  </div>
  }
</div>
```

`shouldShow()` is already `showErrors() && hasErrors()`, and `shouldShowWarnings()` is `showWarnings() && hasWarnings()`, so neither needs a second presence check. The two gates run separate cascades: `strategy` times the errors, `warningStrategy` times the warnings (ADR-0007). Gating `warningEntries()` on `shouldShow()` hides every warning on a form that has no blocking errors.

For a styled out-of-the-box error summary without warnings, use `NgxFormFieldErrorSummary` from `@ngx-signal-forms/toolkit/assistive` instead.

## Grouped Notification Directive Pattern

Use `ngxHeadlessNotification` when a fieldset, summary card, or custom block already owns the grouped `ValidationError[]` list and only needs content-driven tone routing, message lookup, and deterministic IDs. It exposes only `errors` and `fieldName`, both optional — there is no `tone` input. An omitted `errors` reads as an empty list, so both containers stay hidden; `errors` accepts a plain array, a `Signal`, or a bare `() => …` reader. An omitted `fieldName` turns off id output, so `errorContainerId()` and `warningContainerId()` return `null`.

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
    [attr.aria-describedby]="errorState.shouldShowErrors() && errorState.hasErrors() ? errorState.errorId() : null"
    [attr.aria-invalid]="errorState.hasErrors() || null"
  />
  @if (errorState.shouldShowErrors() && errorState.hasErrors()) {
  <ul [id]="errorState.errorId()" role="alert">
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
      inputs: ['field', 'fieldName', 'strategy', 'warningStrategy'],
    },
  ],
  template: `
    <ng-content select="label" />
    <ng-content />
    @if (errorState.shouldShowErrors() && errorState.hasErrors()) {
      <span [id]="errorState.errorId()" role="alert" class="ds-error">
        {{ errorState.resolvedErrors()[0].message }}
      </span>
    }
  `,
})
export class DsFormFieldComponent {
  protected readonly errorState = inject(NgxHeadlessErrorState);
}
```

### Publishing the field name from a design-system host

The pattern above projects the bound control via `<ng-content />`, so auto-ARIA
runs on the **consumer's** element and resolves the field name from that
element's `id`. When the control's `id` is not the field's name — a widget that
generates its own inner `id`, or a `role="group"` cluster — declare the name on
your host so every generated id agrees:

```typescript
import { NgxFieldIdentityProvider } from '@ngx-signal-forms/toolkit'; // root, not /headless

hostDirectives: [
  {
    directive: NgxHeadlessErrorState,
    inputs: ['field', 'fieldName', 'strategy', 'warningStrategy'],
  },
  { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
];
```

One `fieldName` attribute feeds both. The provider publishes the **name**
channel only — hints and display timing keep resolving through their
registries. See `references/pitfalls.md` for the `[formField]` naming trap that
comes with this, and `docs/CUSTOM_WRAPPERS.md` for the full contract.

## Field-Name Directive

`NgxHeadlessFieldName` exposes the resolved field name plus the canonical
`errorId` / `warningId` for a control — without any error-state logic. Reach
for it when a custom component owns its own error rendering but still needs
the toolkit's ID conventions (so `aria-describedby` chains stay consistent
with `NgxFormFieldError`, the wrapper, and other toolkit consumers). Prefer
`NgxHeadlessErrorState` when you also want `shouldShowErrors()`/`hasErrors()`.

It takes no `field` input — it never reads validation state. Name it with the
`fieldName` input, or let it read the host element's `id`:

```html
<div ngxHeadlessFieldName #fieldName="fieldName" fieldName="email">
  <input
    id="email"
    [formField]="form.email"
    [attr.aria-describedby]="fieldName.errorId()"
  />
</div>
```

With neither, `resolvedFieldName()`, `errorId()` and `warningId()` all return
`null` and the directive logs one dev-mode `console.error`.

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
// `maxLength` is required — it is not read back from the validator.
const count = createCharacterCount({ field: form.bio, maxLength: 500 });
const flags = createFieldStateFlags(() => form.email()); // boolean signal flags

// Reactive resolved errors: visibility cascade + 3-tier message resolution
// + stable per-error DOM IDs ({fieldName}-error-{kind}). Use this in custom
// renderers that mount via `*ngComponentOutlet` or any component that wants
// the directive's resolution logic without the directive itself.
const resolved = createErrorMessageSignal(() => form.email(), {
  fieldName: 'email',
  // includeWarnings: true | 'only' (default: false)
  // strategy / submittedStatus inherit from form context when omitted
  // warningStrategy times the warnings on its own cascade — no need to pin
  // strategy: 'immediate' to keep warnings visible under an on-submit form
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
- If `'on-submit'` errors don't appear: use `form[formRoot][ngxSignalForm]` so context supplies submitted status, or pass `submittedStatus` explicitly to the relevant programmatic factory.
- If a grouped notification resolves to the wrong live region: check whether the error list includes any blocking errors — tone is content-driven, so `role="alert"` is used whenever any blocking error is present, regardless of intent.
- If the component is recreating the full wrapper layout: stop and use `form-field/SKILL.md` instead.
