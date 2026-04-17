# @ngx-signal-forms/toolkit/headless

> Renderless directives and utility functions that expose toolkit state as signals — you control every bit of markup and styling.

## Why this entry point exists

The form-field wrapper (`/form-field`) gives you layout, errors, and ARIA automatically. But when you have your own design system or need full control over markup, you want the toolkit's state logic without its UI. That's what headless provides.

Headless primitives handle error timing, message resolution, character counting, fieldset aggregation, and ID generation. You write the template and styling.

## Import

```typescript
// Bundle import
import { NgxHeadlessToolkit } from '@ngx-signal-forms/toolkit/headless';

// Individual imports
import {
  NgxHeadlessErrorStateDirective,
  NgxHeadlessErrorSummaryDirective,
  NgxHeadlessCharacterCountDirective,
  NgxHeadlessFieldsetDirective,
  NgxHeadlessFieldNameDirective,
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
  ngxSignalFormHeadlessErrorState
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
      errorState.showErrors() ? errorState.errorId() : null
    "
  />

  @if (errorState.showErrors() && errorState.hasErrors()) {
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
      directive: NgxHeadlessErrorStateDirective,
      inputs: ['field', 'fieldName', 'strategy'],
    },
  ],
  template: `
    <ng-content />
    @if (errorState.showErrors()) {
      <div class="error-container">
        @for (error of errorState.resolvedErrors(); track error.kind) {
          <span class="error">{{ error.message }}</span>
        }
      </div>
    }
  `,
})
export class MyFormFieldComponent {
  protected readonly errorState = inject(NgxHeadlessErrorStateDirective);
}
```

## Directives

### NgxHeadlessErrorStateDirective

Selector: `[ngxSignalFormHeadlessErrorState]` · Export: `errorState`

Exposes error state signals for custom error display.

| Input             | Type                        | Description                                                                              |
| ----------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| `field`           | `FieldTree` (required)      | The field to track                                                                       |
| `fieldName`       | `string \| null` (required) | Field name for ID generation. Pass `null` to disable id generation until a name resolves |
| `strategy`        | `ErrorDisplayStrategy`      | Override (inherits from context)                                                         |
| `submittedStatus` | `SubmittedStatus`           | Override for `'on-submit'` strategy                                                      |

Signals: `showErrors()`, `showWarnings()`, `hasErrors()`, `hasWarnings()`, `errors()`, `warnings()`, `resolvedErrors()`, `resolvedWarnings()`, `errorId` (nullable), `warningId` (nullable).

### NgxHeadlessErrorSummaryDirective

Selector: `[ngxSignalFormHeadlessErrorSummary]` · Export: `errorSummary`

Aggregates all errors from a form tree. Each entry has a `focus()` method that calls Angular's `focusBoundControl()`.

| Input             | Type                   | Description                         |
| ----------------- | ---------------------- | ----------------------------------- |
| `formTree`        | `FieldTree` (required) | Root form to aggregate              |
| `strategy`        | `ErrorDisplayStrategy` | Override (inherits from context)    |
| `submittedStatus` | `SubmittedStatus`      | Override for `'on-submit'` strategy |

Signals: `entries()`, `warningEntries()`, `hasErrors()`, `hasWarnings()`, `shouldShow()`, `focusFirst()`.

### NgxHeadlessCharacterCountDirective

Selector: `[ngxSignalFormHeadlessCharacterCount]` · Export: `characterCount`

Provides character count signals with progressive limit states.

| Input              | Type                | Default  | Description     |
| ------------------ | ------------------- | -------- | --------------- |
| `field`            | `FieldTree<string>` | required | String field    |
| `maxLength`        | `number`            | required | Character limit |
| `warningThreshold` | `number`            | `0.8`    | Warning at 80%  |
| `dangerThreshold`  | `number`            | `0.95`   | Danger at 95%   |

Signals: `currentLength()`, `resolvedMaxLength()`, `remaining()`, `limitState()` (`'ok' | 'warning' | 'danger' | 'exceeded'`), `hasLimit()`, `isExceeded()`, `percentUsed()`.

### NgxHeadlessFieldsetDirective

Selector: `[ngxSignalFormHeadlessFieldset]` · Export: `fieldset`

Aggregates error state across multiple fields for group validation.

| Input                 | Type                   | Description                             |
| --------------------- | ---------------------- | --------------------------------------- |
| `fieldsetField`       | `FieldTree` (required) | Primary field group                     |
| `fields`              | `FieldTree[]`          | Optional explicit field list            |
| `fieldsetId`          | `string`               | For ARIA linking                        |
| `strategy`            | `ErrorDisplayStrategy` | Override strategy                       |
| `submittedStatus`     | `SubmittedStatus`      | Override for `'on-submit'` strategy     |
| `includeNestedErrors` | `boolean`              | Include child errors (default: `false`) |

Signals: `isValid()`, `isInvalid()`, `isTouched()`, `isDirty()`, `isPending()`, `aggregatedErrors()`, `aggregatedWarnings()`, `hasErrors()`, `hasWarnings()`, `shouldShowErrors()`, `shouldShowWarnings()`, `resolvedStrategy()`, `resolvedSubmittedStatus()`, `resolvedFieldsetId()`.

### NgxHeadlessFieldNameDirective

Selector: `[ngxSignalFormHeadlessFieldName]` · Export: `fieldName`

Resolves field names and generates stable IDs for ARIA linking. Falls back to the host element `id` when `fieldName` is omitted. When neither a non-empty `fieldName` input nor a non-empty host `id` is provided, `resolvedFieldName()`, `errorId()`, and `warningId()` return `null` and the directive emits a one-shot `console.error` in dev mode. Downstream ARIA wiring should gate on a non-null value rather than produce unstable `"-error"` IDs.

Signals: `resolvedFieldName()` (nullable), `errorId()` (nullable), `warningId()` (nullable).

## Utility functions

For programmatic use without directives:

```typescript
// Error state without a directive
const state = createErrorState({ field: form.email, fieldName: 'email' });

// Character count without a directive
const count = createCharacterCount({ field: form.bio, maxLength: 500 });

// Common field-state flags in one object
const flags = createFieldStateFlags(form.email);
// flags.isTouched(), flags.isDirty(), flags.isValid(), flags.isInvalid(), flags.isPending()

// Safe field state reading
readFieldFlag(field(), 'invalid'); // boolean, null-safe
readErrors(field()); // uses errorSummary() or errors()
dedupeValidationErrors(errors); // remove duplicates by kind+message

// Human-readable field paths
humanizeFieldPath('address.postalCode'); // 'Address / Postal code'

// Unique ID generation
createUniqueId('field'); // 'field-1', 'field-2', ...
```

## Related documentation

- [Toolkit core](../README.md) — error strategies, ARIA, configuration
- [Form field wrapper](../form-field/README.md) — pre-styled wrapper component
- [Assistive components](../assistive/README.md) — styled error, hint, and count components
- [Theming guide](../form-field/THEMING.md) — CSS custom properties for styled components

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
