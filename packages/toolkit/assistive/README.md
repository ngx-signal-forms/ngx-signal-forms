# @ngx-signal-forms/toolkit/assistive

> Styled error, hint, character count, and error summary components for Angular Signal Forms.

## Why this entry point exists

The form-field wrapper (`/form-field`) renders error and hint components for you automatically. This entry point exposes those same components individually — use it when you already have your own layout but want the toolkit's error timing, message resolution, and ARIA roles.

It sits between `/headless` (signals only, no UI) and `/form-field` (complete wrapper) in the toolkit hierarchy.

## Import

```typescript
import {
  NgxFormFieldError,
  NgxFormFieldErrorSummary,
  NgxFormFieldHint,
  NgxFormFieldCharacterCount,
  NgxFormFieldAssistiveRow,
  warningError,
  isWarningError,
  isBlockingError,
} from '@ngx-signal-forms/toolkit/assistive';
```

## Quick start

```html
<form [formRoot]="contactForm" ngxSignalForm>
  <label for="email">Email</label>
  <input id="email" [formField]="contactForm.email" />
  <ngx-form-field-error [formField]="contactForm.email" fieldName="email" />

  <label for="bio">Bio</label>
  <textarea id="bio" [formField]="contactForm.bio"></textarea>
  <ngx-signal-form-field-assistive-row>
    <ngx-signal-form-field-hint>Max 500 characters</ngx-signal-form-field-hint>
    <ngx-signal-form-field-character-count
      [formField]="contactForm.bio"
      [maxLength]="500"
    />
  </ngx-signal-form-field-assistive-row>
</form>
```

## Components

### NgxFormFieldError

Displays validation errors and warnings with appropriate ARIA roles.

```html
<ngx-form-field-error [formField]="form.email" fieldName="email" />
```

| Input             | Type                        | Description                                                                 |
| ----------------- | --------------------------- | --------------------------------------------------------------------------- |
| `formField`       | `FieldTree`                 | The field to show errors for. One of `formField` or `errors` must be given. |
| `errors`          | `Signal<ValidationError[]>` | Pre-aggregated error signal (e.g. from fieldsets). Takes priority.          |
| `fieldName`       | `string`                    | Required when standalone; inherited inside wrapper                          |
| `strategy`        | `ErrorDisplayStrategy`      | Override error display strategy                                             |
| `warningStrategy` | `ErrorDisplayStrategy`      | Override warning display strategy (defaults to `'immediate'`)               |
| `listStyle`       | `'plain' \| 'bullets'`      | Visual layout for rendered messages (`'plain'` by default)                  |
| `submittedStatus` | `SubmittedStatus`           | Manual override for `'on-submit'` strategy                                  |

- Blocking errors render with `role="alert"` (assertive)
- Warnings render with `role="status"` (polite)
- 3-tier message resolution: validator `error.message` → registry → defaults

Use `ngxSignalForm` alongside `[formRoot]` when relying on the `'on-submit'` strategy so assistive components can inherit submission state automatically.

### NgxFormFieldErrorSummary

Form-level error summary with clickable entries that focus the invalid control.

```html
<ngx-form-field-error-summary
  [formTree]="form"
  summaryLabel="Please fix the following errors:"
/>
```

| Input             | Type                   | Description                        |
| ----------------- | ---------------------- | ---------------------------------- |
| `formTree`        | `FieldTree` (required) | Root form to aggregate errors from |
| `summaryLabel`    | `string`               | Label above the error list         |
| `strategy`        | `ErrorDisplayStrategy` | When to show errors                |
| `submittedStatus` | `SubmittedStatus`      | Manual override for `'on-submit'`  |

Override field names with `provideFieldLabels()` from `@ngx-signal-forms/toolkit`.

### NgxFormFieldHint

Helper text below inputs. Automatically linked to the input via `aria-describedby` when used inside the form-field wrapper.

```html
<ngx-signal-form-field-hint>Format: 123-456-7890</ngx-signal-form-field-hint>
```

### NgxFormFieldCharacterCount

Character counter with progressive color states (ok → warning → danger → exceeded).

```html
<ngx-signal-form-field-character-count
  [formField]="form.bio"
  [maxLength]="500"
/>
```

When a matching max-length validator is present, `maxLength` can be omitted and detected automatically. Add `liveAnnounce` for polite screen reader announcements.

### NgxFormFieldAssistiveRow

Layout container for hint and character count side by side.

```html
<ngx-signal-form-field-assistive-row>
  <ngx-signal-form-field-hint>Enter your bio</ngx-signal-form-field-hint>
  <ngx-signal-form-field-character-count
    [formField]="form.bio"
    [maxLength]="500"
  />
</ngx-signal-form-field-assistive-row>
```

## Warning utilities

```typescript
warningError('weak-password', 'Consider a stronger password');
isWarningError(error); // true if kind starts with 'warn:'
isBlockingError(error); // true if not a warning
```

For splitting a `ValidationError[]` into blocking and warnings in one pass, use `splitByKind()` from `@ngx-signal-forms/toolkit`.

## Theming

```css
:root {
  --ngx-signal-form-error-color: #db1818;
  --ngx-signal-form-warning-color: #f59e0b;
  --ngx-signal-form-feedback-font-size: 0.75rem;
  --ngx-signal-form-feedback-line-height: 1rem;
  --ngx-signal-form-feedback-margin-top: 0.125rem;
  --ngx-form-field-hint-color: rgba(50, 65, 85, 0.75);
  --ngx-form-field-char-count-color-ok: rgba(50, 65, 85, 0.75);
  --ngx-form-field-char-count-color-warning: #f59e0b;
  --ngx-form-field-char-count-color-danger: #db1818;
}
```

## Related documentation

- [Toolkit core](../README.md) — error strategies, ARIA, configuration
- [Form field wrapper](../form-field/README.md) — pre-styled wrapper that uses these components
- [Headless primitives](../headless/README.md) — renderless directives for full custom UI
- [Theming guide](../form-field/THEMING.md) — complete CSS custom properties reference

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
