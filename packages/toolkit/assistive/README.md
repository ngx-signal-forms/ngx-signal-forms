# @ngx-signal-forms/toolkit/assistive

> Styled error/notification, hint, character count, and error summary components for Angular Signal Forms.

## Why this entry point exists

The form-field wrapper (`/form-field`) renders error and hint components for you automatically. This entry point exposes those same components individually — use it when you already have your own layout but want the toolkit's error timing, message resolution, and ARIA roles.

It sits between `/headless` (signals only, no UI) and `/form-field` (complete wrapper) in the toolkit hierarchy.

### When to use this entry point

- Use `/assistive` when you already own the field layout and only need feedback UI pieces.
- Use `/form-field` when you want the fastest default path with wrapper-managed projection and ARIA wiring.
- Use `/headless` when you want zero styled markup and signals only.

## Import

```typescript
import {
  NgxFormFieldError,
  NgxFormFieldErrorSummary,
  NgxFormFieldHint,
  NgxFormFieldCharacterCount,
  NgxFormMarkingLegend,
} from '@ngx-signal-forms/toolkit/assistive';
import {
  warningError,
  isWarningError,
  isBlockingError,
} from '@ngx-signal-forms/toolkit';
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

Displays validation errors and warnings with appropriate ARIA roles. Two
presentations share this one component:

- `presentation="inline"` (default) — bare messages under a single control.
- `presentation="panel"` — a bordered, padded notification card, for grouped
  fieldset summaries or custom summary blocks. This is what
  `NgxFormFieldNotification` used to render as a separate component (folded
  in pre-1.0; see `docs/migrations/v1.0.0-rc.12.md`).

```html
<!-- Per-field, inline -->
<ngx-form-field-error [formField]="form.email" fieldName="email" />

<!-- Grouped, panel -->
<ngx-form-field-error
  [errors]="groupedErrors"
  fieldName="shipping-address"
  title="Validation errors"
  listStyle="bullets"
  presentation="panel"
/>
```

`errors` accepts a plain array or a reactive source (`Signal<…>` / `() =>
…`), for example `signal<readonly ValidationError[]>([])`.

| Input             | Type                                           | Description                                                                 |
| ----------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| `formField`       | `FieldTree`                                    | The field to show errors for. One of `formField` or `errors` must be given. |
| `errors`          | `ReactiveOrStatic<readonly ValidationError[]>` | Pre-aggregated error source (e.g. from fieldsets). Takes priority.          |
| `fieldName`       | `string`                                       | Required when standalone; inherited inside wrapper                          |
| `strategy`        | `ErrorDisplayStrategy`                         | Override error display strategy (ignored when `errors` is bound)            |
| `warningStrategy` | `WarningDisplayStrategy`                       | Override warning display strategy (defaults to `'on-touch'`)                |
| `listStyle`       | `'plain' \| 'bullets'`                         | Visual layout for rendered messages (`'plain'` by default)                  |
| `submittedStatus` | `SubmittedStatus`                              | Manual override for `'on-submit'` strategy                                  |
| `title`           | `string`                                       | Optional title rendered above a visible container's message list            |
| `presentation`    | `'inline' \| 'panel'`                          | Visual treatment — bare messages vs. a bordered card (`'inline'` default)   |

- Blocking errors render with `role="alert"` (assertive)
- Warnings render with `role="status"` (polite)
- 3-tier message resolution: validator `error.message` → registry → defaults
- Tone in `errors`-bound (grouped) usage is **content-driven** — there is no
  `tone` input: any blocking (non-`warn:`) error routes the group to
  `role="alert"`; an all-warning list routes to the polite `role="status"`
  container.

Use `ngxSignalForm` alongside `[formRoot]` when relying on the `'on-submit'` strategy so assistive components can inherit submission state automatically.

### NgxFormFieldErrorSummary

Form-level error summary with clickable entries that focus the invalid control.

```html
<ngx-form-field-error-summary
  [formTree]="form"
  summaryLabel="Please fix the following errors:"
/>
```

| Input             | Type                   | Description                                                                                             |
| ----------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `formTree`        | `FieldTree` (required) | Root form to aggregate errors from                                                                      |
| `summaryLabel`    | `string`               | Label above the error list                                                                              |
| `strategy`        | `ErrorDisplayStrategy` | When to show errors                                                                                     |
| `submittedStatus` | `SubmittedStatus`      | Manual override for `'on-submit'`                                                                       |
| `autoFocus`       | `boolean`              | Auto-focus the summary on first appearance under `'on-submit'` (default `true`); set `false` to opt out |

Override field names with `provideFieldLabels()` from `@ngx-signal-forms/toolkit`.

### NgxFormFieldHint

Helper text below inputs. Automatically linked to the input via `aria-describedby` when used inside the form-field wrapper.

```html
<ngx-form-field-hint>Format: 123-456-7890</ngx-form-field-hint>
```

Optional `position` input (`'left' | 'right' | null`, default `null`): alignment within the assistive
row. When omitted or `null`, hints left-align by default; pass `position="right"` to
opt into end alignment.

### NgxFormFieldCharacterCount

Character counter with progressive color states (ok → warning → danger → exceeded).

```html
<ngx-form-field-character-count [formField]="form.bio" [maxLength]="500" />
```

| Input                   | Type                                           | Default                       | Description                                                              |
| ----------------------- | ---------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------ |
| `formField`             | `FieldTree<NgxCharacterCountValue>` (required) | —                             | Field to track the character count for                                   |
| `maxLength`             | `number \| undefined`                          | Auto-detected from validator  | Character limit; auto-detected from a `maxLength` validator when omitted |
| `position`              | `'left' \| 'right'`                            | `'right'`                     | Text alignment within the assistive row                                  |
| `showLimitColors`       | `boolean`                                      | `true`                        | Progressive color states as the count nears the limit                    |
| `liveAnnounce`          | `boolean`                                      | `false`                       | Polite live announcements when the limit state changes                   |
| `announcementFormatter` | `NgxCharacterCountAnnouncementFormatter`       | Built-in English strings      | Custom formatter for localizing announcements                            |
| `colorThresholds`       | `{ warning: number; danger: number }`          | `{ warning: 80, danger: 95 }` | Percentage thresholds for the warning and danger color states            |

When a matching max-length validator is present, `maxLength` can be omitted and detected automatically. Add `liveAnnounce` for polite screen reader announcements.

The built-in announcement strings ("Approaching limit: N characters remaining.", etc.) are English-only. Bind `[announcementFormatter]` to a `(state, { current, max, remaining, over }) => string` function to localize them:

```typescript
formatter = (
  state: 'warning' | 'danger' | 'exceeded',
  info: { remaining: number; over: number },
) => {
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

Form-level legend that explains the field marker (e.g. "\* indicates a required field"). Place it once wherever it reads well — there is no automatic injection.

```html
<form [formRoot]="userForm" ngxSignalForm>
  <ngx-form-marking-legend />
  <!-- fields… -->
</form>
```

Outside a form host, pass the tree explicitly: `<ngx-form-marking-legend [formTree]="userForm" />`.

| Input            | Type               | Description                                                                             |
| ---------------- | ------------------ | --------------------------------------------------------------------------------------- |
| `formTree`       | `FieldTree`        | The form tree to reflect. Falls back to the ambient `ngxSignalForm` context.            |
| `showMarkerWhen` | `FieldMarkingMode` | Override the marking mode (`'required' \| 'optional' \| 'none'`). Falls back to config. |
| `text`           | `string`           | Override the legend text. `{marker}` is substituted with the resolved marker.           |
| `requiredMarker` | `string`           | Override the required marker used for `{marker}`. Falls back to config.                 |
| `optionalMarker` | `string`           | Override the optional marker used for `{marker}`. Falls back to config.                 |

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
  --ngx-signal-form-error-panel-bg: #fdebeb;
}
```

See the [Theming guide](../form-field/THEMING.md) for the complete list of
`--ngx-*` custom properties (error/warning/error-panel/hint/char-count
tokens, dark-mode overrides, and the fieldset-level
`--ngx-signal-form-fieldset-notification-inset-*` positioning tokens).

## Related documentation

- [Toolkit core](../README.md) — error strategies, ARIA, configuration
- [Form field wrapper](../form-field/README.md) — pre-styled wrapper that uses these components
- [Headless primitives](../headless/README.md) — renderless directives for full custom UI
- [Theming guide](../form-field/THEMING.md) — complete CSS custom properties reference
