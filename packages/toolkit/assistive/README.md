# @ngx-signal-forms/toolkit/assistive

> Styled error, grouped notification, hint, character count, and error summary components for Angular Signal Forms.

## Why this entry point exists

The form-field wrapper (`/form-field`) renders error and hint components for you automatically. This entry point exposes those same components individually — use it when you already have your own layout but want the toolkit's error timing, message resolution, and ARIA roles.

It sits between `/headless` (signals only, no UI) and `/form-field` (complete wrapper) in the toolkit hierarchy.

## Import

```typescript
import {
  NgxFormFieldError,
  NgxFormFieldNotification,
  NgxFormFieldErrorSummary,
  NgxFormFieldHint,
  NgxFormFieldCharacterCount,
  NgxFormMarkingLegend,
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
  <ngx-form-field-hint>Max 500 characters</ngx-form-field-hint>
  <ngx-form-field-character-count
    [formField]="contactForm.bio"
    [maxLength]="500"
  />
</form>
```

`ngx-form-field-hint` and `ngx-form-field-character-count` are only
auto-associated with the control when a form-field wrapper (or a custom
`NGX_SIGNAL_FORM_HINT_REGISTRY` provider) owns the field association. Used
next to a bare control as shown above, they remain visual-only.

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

### NgxFormFieldNotification

Grouped validation notification with an optional title.

```html
<ngx-form-field-notification
  [errors]="groupedErrors"
  fieldName="shipping-address"
  title="Validation errors"
  listStyle="bullets"
/>
```

`errors` must be a signal, for example `signal<readonly ValidationError[]>([])`.

| Input       | Type                                 | Description                                     |
| ----------- | ------------------------------------ | ----------------------------------------------- |
| `errors`    | `Signal<readonly ValidationError[]>` | Grouped validation messages to present          |
| `fieldName` | `string`                             | Optional id base for `aria-describedby` linkage |
| `title`     | `string`                             | Optional title above the grouped messages       |
| `listStyle` | `'plain' \| 'bullets'`               | Stacked paragraphs or bullet list               |
| `tone`      | `'auto' \| 'error' \| 'warning'`     | Currently a no-op — see below                   |

- Tone is always **content-driven**, regardless of the `tone` value passed:
  any blocking (non-`warn:`) error routes the group to `role="alert"`; an
  all-warning list routes to the polite `role="status"` container.
- The `tone` input does not currently force either outcome. It is retained
  as a stable API surface for possible future expansion (e.g. explicit
  tone forcing) — do not rely on it to change rendering today.
- Intended for grouped fieldset summaries or custom headless summary cards

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
<ngx-form-field-hint>Format: 123-456-7890</ngx-form-field-hint>
```

Optional `position` input (`'left' | 'right'`): alignment within the assistive
row. When omitted, hints left-align by default; pass `position="right"` to
opt into end alignment.

### NgxFormFieldCharacterCount

Character counter with progressive color states (ok → warning → danger → exceeded).

```html
<ngx-form-field-character-count [formField]="form.bio" [maxLength]="500" />
```

When a matching max-length validator is present, `maxLength` can be omitted and detected automatically. Add `liveAnnounce` for polite screen reader announcements.

The built-in announcement strings ("Approaching limit: N characters remaining.", etc.) are English-only. Bind `[announcementFormatter]` to a `(state, { current, max, remaining, over }) => string` function to localize them:

```typescript
formatter = (state: 'warning' | 'danger' | 'exceeded', info: { remaining: number; over: number }) => {
  switch (state) {
    case 'warning':
    case 'danger':
      return `Plus que ${info.remaining} caractères.`;
    case 'exceeded':
      return `Limite dépassée de ${info.over} caractères.`;
  }
};
```

### NgxFormMarkingLegend

Form-level legend that explains the field marker (e.g. "* indicates a required field"). Place it once wherever it reads well — there is no automatic injection.

```html
<form [formRoot]="userForm" ngxSignalForm>
  <ngx-form-marking-legend />
  <!-- fields… -->
</form>
```

Outside a form host, pass the tree explicitly: `<ngx-form-marking-legend [formTree]="userForm" />`.

| Input             | Type                | Description                                                                          |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------- |
| `formTree`        | `FieldTree`         | The form tree to reflect. Falls back to the ambient `ngxSignalForm` context.           |
| `showMarkerWhen`  | `FieldMarkingMode`  | Override the marking mode (`'required' \| 'optional' \| 'none'`). Falls back to config. |
| `text`            | `string`            | Override the legend text. `{marker}` is substituted with the resolved marker.         |
| `requiredMarker`  | `string`            | Override the required marker used for `{marker}`. Falls back to config.               |
| `optionalMarker`  | `string`            | Override the optional marker used for `{marker}`. Falls back to config.               |

- In `'required'` mode, shows the required legend and hides when the form has no required fields.
- In `'optional'` mode, shows the optional legend and hides when the form has no optional fields.
- In `'none'` mode, renders nothing.
- Renders visible, non-`aria-hidden` text — it is supplementary explanation, not a live-region status update; each control's `aria-required` already carries the required state to assistive tech.

## Warning utilities

```typescript
warningError('weak-password', 'Consider a stronger password');
isWarningError(error); // true if kind starts with 'warn:'
isBlockingError(error); // true if not a warning
```

For splitting a `ValidationError[]` into blocking and warnings in one pass, use `splitByKind()` from `@ngx-signal-forms/toolkit`.

## Theming

The assistive components follow the same theming architecture as
`/form-field`: internal design tokens feed resolved pseudo-private variables,
while consumers override only the public `--ngx-*` properties.

```css
:root {
  --ngx-signal-form-error-color: #db1818;
  --ngx-signal-form-warning-color: #a16207;
  --ngx-signal-form-notification-error-color: #db1818;
  --ngx-signal-form-notification-error-border-color: color-mix(
    in srgb,
    var(--ngx-signal-form-notification-error-color) 50%,
    transparent
  );
  --ngx-signal-form-notification-error-bg: #fdebeb;
  --ngx-signal-form-notification-border-radius: 0.5rem;
  --ngx-signal-form-notification-padding: 1rem;
  --ngx-signal-form-feedback-font-size: 0.75rem;
  --ngx-signal-form-feedback-line-height: 1rem;
  --ngx-signal-form-feedback-margin-top: 0.125rem;
  --ngx-form-field-hint-color: rgba(50, 65, 85, 0.75);
  --ngx-form-field-char-count-color-ok: rgba(50, 65, 85, 0.75);
  --ngx-form-field-char-count-color-warning: #a16207;
  --ngx-form-field-char-count-color-danger: #db1818;
}
```

`ngx-form-field-notification` is full-width by default. The card keeps internal
padding for readability, while fieldset-level horizontal positioning should be
controlled with the dedicated `--ngx-signal-form-fieldset-notification-inset-*`
tokens when used inside `ngx-form-fieldset`.

The default light-theme error surface now matches the Figma design token
directly: `#fdebeb`.

### Dark mode

Built-in dark defaults are driven by the `prefers-color-scheme: dark` media
query only — they do not detect a `.dark` class on an ancestor element.
(`:host-context()`, which would be needed for that, is non-standard and
unsupported in Firefox and Safari.) Apps using a class-based dark-mode
strategy must override the public `--ngx-signal-form-error-*` /
`--ngx-signal-form-warning-*` / `--ngx-signal-form-notification-*` custom
properties themselves, scoped to their `.dark` selector.

## Related documentation

- [Toolkit core](../README.md) — error strategies, ARIA, configuration
- [Form field wrapper](../form-field/README.md) — pre-styled wrapper that uses these components
- [Headless primitives](../headless/README.md) — renderless directives for full custom UI
- [Theming guide](../form-field/THEMING.md) — complete CSS custom properties reference

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
