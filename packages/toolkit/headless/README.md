# @ngx-signal-forms/toolkit/headless

> Renderless directives and utility functions that expose toolkit state as signals — you control every bit of markup and styling.

## Why this entry point exists

The form-field wrapper (`/form-field`) gives you layout, errors, and ARIA automatically. But when you have your own design system or need full control over markup, you want the toolkit's state logic without its UI. That's what headless provides.

Headless primitives handle error timing, message resolution, character counting, fieldset aggregation, and ID generation. You write the template and styling.

### When to use directives vs utility functions

- Use **directives** (`NgxHeadlessErrorState`, `NgxHeadlessFieldset`, etc.) when your state naturally lives in templates.
- Use **utility functions** (`createErrorState`, `createCharacterCount`, etc.) when composing behavior in services, host directives, or custom renderers.
- Mix both only when it keeps ownership boundaries clear (one source of truth per field state).

## Import

```typescript
// Bundle import
import { NgxHeadlessToolkit } from '@ngx-signal-forms/toolkit/headless';

// Individual imports
import {
  NgxHeadlessErrorState,
  NgxHeadlessErrorSummary,
  NgxHeadlessNotification,
  NgxHeadlessCharacterCount,
  NgxHeadlessFieldset,
  NgxHeadlessFieldName,
  createErrorMessageSignal,
  createErrorState,
  createCharacterCount,
  createFieldStateFlags,
  readErrors,
  readFieldFlag,
  dedupeValidationErrors,
  humanizeFieldPath,
  createUniqueId,
} from '@ngx-signal-forms/toolkit/headless';
```

## Quick start

Apply a headless directive, export it via `exportAs`, and bind to its signals:

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
    [formField]="form.email"
    [attr.aria-invalid]="errorState.hasErrors() ? 'true' : null"
    [attr.aria-describedby]="
      errorState.shouldShowErrors() ? errorState.errorId() : null
    "
  />

  @if (errorState.shouldShowErrors() && errorState.hasErrors()) {
  <div [id]="errorState.errorId()" role="alert" class="my-error">
    @for (error of errorState.resolvedErrors(); track error.kind) {
    <span>{{ error.message }}</span>
    }
  </div>
  }
</div>
```

### Host directive composition

Headless directives work as Angular [host directives](https://angular.dev/guide/directives/directive-composition-api) for building custom form-field components:

```typescript
@Component({
  selector: 'my-form-field',
  hostDirectives: [
    {
      directive: NgxHeadlessErrorState,
      inputs: ['field', 'fieldName', 'strategy'],
    },
  ],
  template: `
    <ng-content />
    @if (errorState.shouldShowErrors()) {
      <div class="error-container">
        @for (error of errorState.resolvedErrors(); track error.kind) {
          <span class="error">{{ error.message }}</span>
        }
      </div>
    }
  `,
})
export class MyFormFieldComponent {
  protected readonly errorState = inject(NgxHeadlessErrorState);
}
```

## Directives

### NgxHeadlessErrorState

Selector: `[ngxHeadlessErrorState]` · Export: `errorState`

Exposes error state signals for custom error display.

| Input             | Type                                                                                                                                                                   | Description                                                                                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `field`           | `FieldTree` (optional)                                                                                                                                                 | The field to track. Omit when using `errorsOverride` or the host `connectFieldState()` bridge                                                                       |
| `fieldName`       | `string \| null` (optional, default `null`)                                                                                                                            | Field name for ID generation. Pass `null` (or omit) to disable id generation until a name resolves                                                                  |
| `errorsOverride`  | `ReactiveOrStatic<readonly ValidationError[]>` (optional) — a plain array, a `Signal<readonly ValidationError[]>`, or a bare `() => readonly ValidationError[]` reader | Pre-aggregated errors that replace field-based extraction (e.g. for fieldsets). When provided, `field` is not required and `shouldShowErrors` always returns `true` |
| `strategy`        | `ErrorDisplayStrategy`                                                                                                                                                 | Override (inherits from context)                                                                                                                                    |
| `submittedStatus` | `SubmittedStatus`                                                                                                                                                      | Override for `'on-submit'` strategy                                                                                                                                 |

Signals: `shouldShowErrors()`, `shouldShowWarnings()`, `hasErrors()`, `hasWarnings()`, `errors()`, `warnings()`, `resolvedErrors()`, `resolvedWarnings()`, `errorId` (nullable), `warningId` (nullable).

### NgxHeadlessErrorSummary

Selector: `[ngxHeadlessErrorSummary]` · Export: `errorSummary`

Aggregates all errors from a form tree. Each entry has a `focus()` method that calls Angular's `focusBoundControl()`.

| Input             | Type                   | Description                         |
| ----------------- | ---------------------- | ----------------------------------- |
| `formTree`        | `FieldTree` (required) | Root form to aggregate              |
| `strategy`        | `ErrorDisplayStrategy` | Override (inherits from context)    |
| `submittedStatus` | `SubmittedStatus`      | Override for `'on-submit'` strategy |

Signals: `entries()`, `warningEntries()`, `hasErrors()`, `hasWarnings()`, `shouldShow()`, `shouldShowWarnings()`.

Method: `focusFirst()` — focuses the first error entry.

`shouldShow()` gates `entries()` (strategy && `hasErrors()`); `shouldShowWarnings()` gates `warningEntries()` (strategy && `hasWarnings()`) — a warnings-only form has no blocking errors, so `shouldShow()` alone can never reveal warnings.

### NgxHeadlessCharacterCount

Selector: `[ngxHeadlessCharacterCount]` · Export: `characterCount`

Provides character count signals with progressive limit states.

| Input              | Type                             | Default  | Description                                              |
| ------------------ | -------------------------------- | -------- | -------------------------------------------------------- |
| `field`            | `FieldTree<CharacterCountValue>` | required | `string \| readonly string[] \| null \| undefined` field |
| `maxLength`        | `number`                         | required | Character limit                                          |
| `warningThreshold` | `number`                         | `0.8`    | Warning at 80%                                           |
| `dangerThreshold`  | `number`                         | `0.95`   | Danger at 95%                                            |

Signals: `currentLength()`, `resolvedMaxLength()`, `remaining()`, `limitState()` (`'ok' | 'warning' | 'danger' | 'exceeded'`), `hasLimit()`, `isExceeded()`, `percentUsed()`.

### NgxHeadlessFieldset

Selector: `[ngxHeadlessFieldset]` · Export: `fieldset`

Aggregates error state across multiple fields for group validation.

| Input                 | Type                           | Description                                       |
| --------------------- | ------------------------------ | ------------------------------------------------- |
| `field`               | `FieldTree` (required)         | Primary field group                               |
| `fields`              | `readonly FieldTree[] \| null` | Optional explicit field list — see note below     |
| `fieldsetId`          | `string` (optional)            | For ARIA linking                                  |
| `strategy`            | `ErrorDisplayStrategy`         | Override blocking-error strategy                  |
| `warningStrategy`     | `WarningDisplayStrategy`       | Override warning strategy (default: `'on-touch'`) |
| `submittedStatus`     | `SubmittedStatus`              | Override for `'on-submit'` strategy               |
| `includeNestedErrors` | `boolean`                      | Include child errors (default: `false`)           |

> `fields` distinguishes "not provided" from "provided but empty": `null`/unbound (default) aggregates the fieldset's own errors; an explicitly bound `[]` aggregates nothing rather than falling back — useful when a dynamically computed field list legitimately becomes empty.

Signals: `isValid()`, `isInvalid()`, `isTouched()`, `isDirty()`, `isPending()`, `aggregatedErrors()`, `aggregatedWarnings()`, `resolvedErrors()`, `resolvedWarnings()`, `hasErrors()`, `hasWarnings()`, `shouldShowErrors()`, `shouldShowWarnings()`, `resolvedStrategy()`, `resolvedWarningStrategy()`, `resolvedSubmittedStatus()`, `resolvedFieldsetId()`.

`warningStrategy` times `shouldShowWarnings()` independently of `strategy`/`shouldShowErrors()`. It resolves through its own cascade — this input → the form context's `warningStrategy()` → `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy` → `'on-touch'` — which never consults `defaultErrorStrategy`, matching `NgxFormFieldWrapper.warningStrategy` / `NgxFormFieldError.warningStrategy`'s contract exactly. `shouldShowWarnings()` is also no longer suppressed just because `shouldShowErrors()` is `true` — it matches `NgxHeadlessErrorSummary.shouldShowWarnings()`'s independent error/warning visibility instead (fieldsets aggregate the same way a summary does). Consumers that render errors and warnings in a single slot (like `NgxFormFieldset`) apply "errors take visual priority" themselves on top of these two independent signals.

Render `resolvedErrors()` / `resolvedWarnings()` (not `aggregatedErrors()[i].message`) — `ValidationError.message` is `undefined` for framework-default errors (e.g. `required(path.x)` with no `message` option), so the resolved signals apply the same 3-tier message priority as `NgxHeadlessErrorState.resolvedErrors`:

```html
<fieldset ngxHeadlessFieldset #fieldset="fieldset" [field]="form.address">
  @if (fieldset.shouldShowErrors() && fieldset.hasErrors()) {
  <div class="errors">
    @for (error of fieldset.resolvedErrors(); track error.kind) {
    <span>{{ error.message }}</span>
    }
  </div>
  }
</fieldset>
```

### NgxHeadlessNotification

Selector: `[ngxHeadlessNotification]` · Export: `notificationState`

Tone-aware grouped validation state for custom notification cards and summary blocks.

| Input       | Type                                 | Description                             |
| ----------- | ------------------------------------ | --------------------------------------- |
| `errors`    | `Signal<readonly ValidationError[]>` | Grouped validation messages             |
| `fieldName` | `string \| null`                     | Base id for generated error/warning ids |

Tone is fully content-driven — there is no `tone` input. Any blocking (non-`warn:`) error resolves the group to `'error'` (`role="alert"`); an all-warning list resolves to `'warning'` (polite `role="status"`).

Signals: `resolvedMessages()`, `resolvedTone()`, `showErrorContainer()`, `showWarningContainer()`, `errorContainerId()` (nullable), `warningContainerId()` (nullable).

### NgxHeadlessFieldName

Selector: `[ngxHeadlessFieldName]` · Export: `fieldName`

Resolves field names and generates stable IDs for ARIA linking. Falls back to the host element `id` when `fieldName` is omitted. When neither a non-empty `fieldName` input nor a non-empty host `id` is provided, `resolvedFieldName()`, `errorId()`, and `warningId()` return `null` and the directive emits a one-shot `console.error` in dev mode. Downstream ARIA wiring should gate on a non-null value rather than produce unstable `"-error"` IDs.

Signals: `resolvedFieldName()` (nullable), `errorId()` (nullable), `warningId()` (nullable).

## Reactive Primitives

Factories that return plain signals for programmatic use — in services, host directives, or custom renderers that don't want a template directive.

### createErrorMessageSignal

> **Lockstep guarantee:** `NgxHeadlessErrorState.resolvedErrors`/`resolvedWarnings` and `createErrorMessageSignal` share the same internal resolver — message resolution behaviour is guaranteed identical across both surfaces.

A `Signal<readonly ResolvedFieldError[]>` that combines visibility gating, the 3-tier message cascade (validator `message` → `NGX_ERROR_MESSAGES` registry → default), and stable per-error DOM IDs in a single primitive. Use it when you want the directive's resolution logic without the directive itself — for example inside a custom error renderer that the form-field wrapper drives via `*ngComponentOutlet`, or in an Angular `Component` that opts to read errors directly off a `FieldTree`.

See a runnable example at `apps/demo/src/app/03-headless/error-message-signal/`.

```typescript
import { createErrorMessageSignal } from '@ngx-signal-forms/toolkit/headless';

@Component({/* ... */})
export class EmailErrors {
  readonly field = input.required<FieldTree<string>>();

  readonly resolvedErrors = createErrorMessageSignal(() => this.field()(), {
    fieldName: 'email',
  });

  readonly resolvedWarnings = createErrorMessageSignal(() => this.field()(), {
    includeWarnings: 'only',
    fieldName: 'email',
    strategy: 'immediate',
  });
}
```

Each entry is `{ kind, message, id, error }`:

- `kind` — convenience copy of the validator kind, lifted to the top level so templates can write `entry.kind` instead of `entry.error.kind`.
- `message` — the resolved display string after the 3-tier cascade.
- `id` — `{fieldName}-error-{kind}`, stable so external renderers and the in-tree wrapper interoperate on `aria-describedby` chains without re-deriving the format.
- `error` — the raw `ValidationError` from the field, kept for consumers that need validator-specific params or a non-stripped `message` override.

Options of note:

- `includeWarnings`: `false` (default), `true`, or `'only'` — selects blocking errors, both, or warnings only.
- `stripWarningPrefix`: defaults to `true` (display-oriented); set to `false` to keep the `warn:` prefix visible for debugging.
- `errorMessages`: explicit `Signal<ErrorMessageRegistry>` override; when omitted, the primitive auto-injects `NGX_ERROR_MESSAGES`.
- `strategy` / `submittedStatus`: forwarded to `createErrorVisibility`. Omit to inherit from the form context.
- `injector`: optional, for use outside an Angular injection context.

### createErrorState / createCharacterCount / createFieldStateFlags

For programmatic use without a directive:

```typescript
// Error state without a directive
const state = createErrorState({ field: form.email, fieldName: 'email' });
// Strategy resolution: explicit `strategy` option → form context →
// NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy → 'on-touch'. Pass `injector`
// to call this outside an injection context (mirrors createErrorVisibility /
// createErrorMessageSignal):
// createErrorState({ field: form.email, fieldName: 'email', injector });

// Character count without a directive
const count = createCharacterCount({ field: form.bio, maxLength: 500 });

// Common field-state flags in one object
const flags = createFieldStateFlags(form.email);
// flags.isTouched(), flags.isDirty(), flags.isValid(), flags.isInvalid(), flags.isPending()
```

### createFieldOptionalitySummary / summarizeFieldOptionality

Reach for these when a custom component needs to know whether a field is required/optional to render a marker or legend:

```typescript
// Required/optional leaf summary for a form tree (drives marking legends)
const summary = summarizeFieldOptionality(formTree); // { hasRequired, hasOptional }
const reactive = createFieldOptionalitySummary(() => this.formTree()); // computed signals
```

### createFieldsetAggregation / createErrorSummaryEntries

The pure pipelines behind `NgxHeadlessFieldset` and `NgxHeadlessErrorSummary` — reach for these when building a custom grouped surface. No injection context required, but you supply pre-resolved `showErrors`/`showWarnings` signals from your own visibility seam call. See the source JSDoc for the option/result contracts.

## ARIA Composition

This entry point also re-exports the pure factories that
[`docs/CUSTOM_WRAPPERS.md`](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_WRAPPERS.md)
teaches for hosts that own their own ARIA instead of using
`NgxSignalFormAutoAria`:

| Factory                            | Produces                                                            |
| ---------------------------------- | ------------------------------------------------------------------- |
| `createAriaInvalidSignal(...)`     | Strategy-aware `aria-invalid` signal                                |
| `createAriaRequiredSignal(...)`    | `aria-required` signal from field state                             |
| `createAriaDescribedBySignal(...)` | Composed `aria-describedby` chain (errors, warnings, hints)         |
| `createHintIdsSignal(...)`         | Hint-id collection for the described-by chain                       |
| `createAriaDescribedByBridge(...)` | Bridge for hosts whose described-by attribute another library owns  |
| `createFieldNameResolver(...)`     | Field-name cascade (explicit → label `for` (opt-in) → control `id`) |

`createAriaInvalidSignal`'s third argument is a `Signal<boolean>` saying
whether the element that carries the attribute still has a layout box. It has
no default: omit it and `aria-invalid` goes stale on a control inside a
collapsed `<details>`, an inactive tab panel, or a non-current wizard step.
The probe needs DI and a render hook, so it lives in the root entry, not here
— use `createControlVisibilitySignal(resolveElement, injector)` when the
wrapper has no render hook of its own, or `isElementCssVisible(el)` inside an
existing `afterEveryRender` `earlyRead` when it already runs one. Both come
from `@ngx-signal-forms/toolkit`.

## Utility Functions

Plain, dependency-free helpers used internally by the directives and factories above — safe to call directly for one-off reads:

```typescript
// Safe field state reading
readFieldFlag(field(), 'invalid'); // boolean, null-safe
readErrors(field()); // uses errorSummary() or errors()
readDirectErrors(field()); // only direct-field errors, not descendants
dedupeValidationErrors(errors); // remove duplicates by kind+message

// Human-readable field paths
humanizeFieldPath('address.postalCode'); // 'Address / Postal code'

// Unique ID generation
createUniqueId('field'); // 'field-1', 'field-2', ...

// Error-summary building blocks (what NgxHeadlessErrorSummary uses internally)
toErrorSummaryEntry(error); // ValidationError → ErrorSummaryEntryData with focus()
resolveFieldNameFromError(error); // ValidationError → human-readable field name
focusBoundControlFromError(error); // focus the control bound to an error
```

## Related documentation

- [Toolkit core](../README.md) — error strategies, ARIA, configuration
- [Form field wrapper](../form-field/README.md) — pre-styled wrapper component
- [Assistive components](../assistive/README.md) — styled error, grouped panel feedback, hint, counter, and summary components
- [Theming guide](../form-field/THEMING.md) — CSS custom properties for styled components
