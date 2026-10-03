---
title: '@ngx-signal-forms/toolkit/assistive'
sidebarTitle: 'assistive'
---

Styled feedback parts for Angular Signal Forms: field errors and warnings, an
error summary, hints, a character count, and a required-field legend. You keep
your own field layout. The toolkit renders the feedback and times it.

- **Use this when** you own the field markup and layout, but want ready-made
  feedback components.
- **Use [`/form-field`](/packages/toolkit/form-field/README) instead when** the toolkit's
  field layout fits. Use [`/headless`](/packages/toolkit/headless/README) when you want to
  render every element yourself.

See [Choose your level](/README#choose-your-level).

## Import

```typescript
import { FormField } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import {
  NgxFormFieldCharacterCount,
  NgxFormFieldError,
  NgxFormFieldErrorSummary,
  NgxFormFieldHint,
  NgxFormMarkingLegend,
} from '@ngx-signal-forms/toolkit/assistive';
```

This entry point has no bundle. Import the components you use.

Always import `NgxSignalFormToolkit` from the root entry point too. It adds
auto-ARIA to eligible `[formField]` controls, and the `ngxSignalForm`
directive that shares form-level timing with these components. Native
checkboxes and radios are not eligible by default, because their ARIA belongs
on the group. See
[custom controls](/docs/CUSTOM_CONTROLS#inferred-kind-vs-auto-aria-eligibility).

## What you do and what the toolkit does

The toolkit does this for you:

- Shows errors and warnings at the right time (`on-touch` by default).
- Resolves the message text (validator `message`, then your
  `provideErrorMessages()` registry, then a built-in default).
- Renders errors in a `role="alert"` region and warnings in a `role="status"`
  region.
- Writes `aria-invalid`, `aria-required`, and the error and warning ids in
  `aria-describedby` on each control. Auto-ARIA from `NgxSignalFormToolkit`
  does this.

You do this yourself:

- Write the layout, the `<label for>`, and a stable `id` on each control.
- Give `ngx-form-field-error` a `fieldName` that equals the control's `id`.
- Link hints to the control. Only a wrapper registers hints for you.

Each component and what it needs for ARIA without a wrapper:

| Component                        | Works without a wrapper | What links it to the control                                                                                                                                                                                                                                                                                           |
| -------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ngx-form-field-error`           | Yes                     | Auto-ARIA, when `fieldName` equals the control's `id`. It adds `{fieldName}-error` or `{fieldName}-warning` to `aria-describedby` while the message shows.                                                                                                                                                             |
| `ngx-form-field-hint`            | Yes, visual only        | You. Give the hint an `id` and put that id in the control's `aria-describedby`. Auto-ARIA keeps ids that you write.                                                                                                                                                                                                    |
| `ngx-form-field-character-count` | Yes                     | You. Set `fieldName` on the count and put `{fieldName}-char-count-limit` in the control's `aria-describedby`. Screen readers then read "Up to 500 characters" on focus. Without `fieldName`, only the visible "12/500" text is read. Add `[liveAnnounce]="true"` to announce when the count nears or passes the limit. |
| `ngx-form-field-error-summary`   | Yes                     | Not needed. Each entry is a button that moves focus to its control.                                                                                                                                                                                                                                                    |
| `ngx-form-marking-legend`        | Yes                     | Not needed. Each control already gets `aria-required` from auto-ARIA.                                                                                                                                                                                                                                                  |

## Example

A profile form with your own layout. Copy it into an Angular application and
render `<app-profile />`.

```typescript
import { Component, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  maxLength,
  required,
} from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import {
  NgxFormFieldCharacterCount,
  NgxFormFieldError,
  NgxFormFieldErrorSummary,
  NgxFormFieldHint,
} from '@ngx-signal-forms/toolkit/assistive';

@Component({
  selector: 'app-profile',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormFieldError,
    NgxFormFieldErrorSummary,
    NgxFormFieldHint,
    NgxFormFieldCharacterCount,
  ],
  template: `
    <form [formRoot]="profileForm" ngxSignalForm>
      <ngx-form-field-error-summary [formTree]="profileForm" />

      <div class="my-field">
        <label for="email">Email</label>
        <input id="email" type="email" [formField]="profileForm.email" />
        <ngx-form-field-error
          [formField]="profileForm.email"
          fieldName="email"
        />
      </div>

      <div class="my-field">
        <label for="bio">Bio</label>
        <textarea
          id="bio"
          aria-describedby="bio-hint bio-char-count-limit"
          [formField]="profileForm.bio"
        ></textarea>
        <ngx-form-field-hint id="bio-hint">
          A few words about you.
        </ngx-form-field-hint>
        <ngx-form-field-character-count
          [formField]="profileForm.bio"
          fieldName="bio"
        />
        <ngx-form-field-error [formField]="profileForm.bio" fieldName="bio" />
      </div>

      <button type="submit">Save</button>
    </form>
  `,
})
export class ProfileComponent {
  readonly model = signal({ email: '', bio: '' });
  readonly profileForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email address' });
      maxLength(path.bio, 500, { message: 'Use 500 characters or fewer' });
    },
    {
      submission: {
        action: async () => {
          // Call your API here.
        },
        onInvalid: createOnInvalidHandler(),
      },
    },
  );
}
```

What happens:

- The email error shows after the user leaves the field or submits. Auto-ARIA
  sets `aria-invalid="true"` and adds `email-error` to the input's
  `aria-describedby` at the same moment.
- The textarea's `aria-describedby` keeps `bio-hint` and
  `bio-char-count-limit`, because you wrote them.
- The character count reads the limit from the `maxLength` validator. With
  `fieldName="bio"` it renders a hidden "Up to 500 characters" text with the
  id `bio-char-count-limit`, so screen readers read the limit on focus.
- On an invalid submit, the summary lists every error, and only the summary
  announces. See [NgxFormFieldErrorSummary](#ngxformfielderrorsummary).

## Components

### NgxFormFieldError

Shows the errors and warnings of one field, or of a list of errors you pass
in.

```html
<!-- One field -->
<ngx-form-field-error [formField]="form.email" fieldName="email" />

<!-- A group of errors, as a bordered panel -->
<ngx-form-field-error
  [errors]="groupedErrors"
  fieldName="shipping-address"
  title="Validation errors"
  listStyle="bullets"
  presentation="panel"
/>
```

| Input             | Type                                              | Default    | Description                                                                                 |
| ----------------- | ------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| `formField`       | `FieldTree`                                       | —          | The field to show. Give `formField` or `errors`.                                            |
| `errors`          | `NgxReactiveOrStatic<readonly ValidationError[]>` | —          | A list you computed, as an array, a signal, or a function. Wins over `formField`.           |
| `fieldName`       | `string`                                          | —          | Base for the `{fieldName}-error` and `{fieldName}-warning` ids. Required without a wrapper. |
| `strategy`        | `ErrorDisplayStrategy`                            | inherited  | When errors show. Has no effect when `errors` is bound.                                     |
| `warningStrategy` | `WarningDisplayStrategy`                          | inherited  | When warnings show. Falls back to `on-touch`.                                               |
| `submittedStatus` | `SubmittedStatus`                                 | inherited  | Submission state for `on-submit`, when there is no `ngxSignalForm`.                         |
| `listStyle`       | `'plain' \| 'bullets'`                            | `'plain'`  | Message layout.                                                                             |
| `title`           | `string \| null \| undefined`                     | —          | Title above the message list.                                                               |
| `presentation`    | `'inline' \| 'panel'`                             | `'inline'` | `inline` shows bare messages. `panel` shows a bordered card for grouped feedback.           |

"Inherited" means the component uses the form's `ngxSignalForm` setting, then
the provided config. See
[timing and configuration](/docs/WARNINGS_SUPPORT#timing-and-configuration).

Behavior:

- Blocking errors render with `role="alert"`. Warnings render with
  `role="status"`. A warning waits while a blocking error shows on the same
  field.
- With `errors` bound, the content sets the role: one blocking error makes the
  group an alert. A list of only warnings is a status.
- Without a wrapper, add `ngxSignalForm` to the form to keep the message and
  the ARIA in step. The component then tells auto-ARIA when its messages
  show, so you can set the timing on the form or on this component. Without
  `ngxSignalForm`, auto-ARIA does not see a `strategy` on this component and
  follows the app config. Set the timing in the app config instead.
- If no `fieldName` resolves, the component renders without ids and logs a
  warning in development mode.

#### Errors and warnings without colour

Each message starts with a visually hidden "Error:" or "Warning:" prefix. A
screen reader reads "Error: Email is required". The difference does not rely on
colour alone (WCAG 1.4.1).

- Change the text with `errorPrefixText` and `warningPrefixText` in
  `provideNgxSignalFormsConfig()`. Pass `''` to turn a prefix off.
- The prefix also renders when `title` is set.
- `error.message` never contains the prefix, so validators and message
  registries stay free of it.

To add a visible icon, set `--ngx-signal-form-error-icon` or
`--ngx-signal-form-warning-icon`. See the
[theming guide](/packages/toolkit/form-field/THEMING).

### NgxFormFieldErrorSummary

A list of all form errors. Each entry is a button that moves focus to its
control.

```html
<ngx-form-field-error-summary
  [formTree]="form"
  summaryLabel="Please fix the following errors:"
/>
```

| Input             | Type                    | Default                              | Description                                                       |
| ----------------- | ----------------------- | ------------------------------------ | ----------------------------------------------------------------- |
| `formTree`        | `FieldTree` (required)  | —                                    | The root form.                                                    |
| `summaryLabel`    | `string`                | `'Please fix the following errors:'` | Heading text and accessible name of the summary.                  |
| `headingLevel`    | `2 \| 3 \| 4 \| 5 \| 6` | `2`                                  | Renders the heading as a native `h2` to `h6`.                     |
| `autoFocus`       | `boolean`               | `true`                               | Moves focus to the summary when it first shows under `on-submit`. |
| `strategy`        | `ErrorDisplayStrategy`  | inherited                            | When the summary shows.                                           |
| `submittedStatus` | `SubmittedStatus`       | inherited                            | Submission state for `on-submit`.                                 |

Behavior:

- The summary lists blocking errors only, not warnings.
- `autoFocus` has an effect only under `on-submit`. Under `on-touch` and
  `immediate`, the summary can show while the user is still typing, so it does
  not take focus. Set `[autoFocus]="false"` when your flow moves focus
  elsewhere, for example with `createOnInvalidHandler()`.
- An error without a bound control renders as plain text, because there is
  nothing to focus.
- Change field names in the entries with `provideFieldLabels()` from
  `@ngx-signal-forms/toolkit`.

#### One announcement per submit

The summary and each field error are `role="alert"` regions. Without help, one
submit that reveals five field errors makes six announcements at the same
time. Screen readers then cut speech off or read errors twice.

To prevent this, put the summary inside a form that has `ngxSignalForm`. Then:

- Field errors that a submit reveals show without an announcement. They look
  the same and keep their ids, so `aria-describedby` still reads them.
- The summary makes the only announcement.
- When the user edits a field later, its new error announces as usual.

Without `ngxSignalForm`, or with the summary outside the `<form>`, every region
announces. To turn this off, set `errorSummaryAnnouncesAlone: false` in
`provideNgxSignalFormsConfig()`. Warnings are not affected.

### NgxFormFieldHint

Helper text for a control.

```html
<ngx-form-field-hint id="phone-hint">Format: 123-456-7890</ngx-form-field-hint>
```

| Input      | Type                        | Default | Description                                        |
| ---------- | --------------------------- | ------- | -------------------------------------------------- |
| `id`       | `string \| null`            | `null`  | The hint's DOM id. Accepts `id="…"` or `[id]="…"`. |
| `position` | `'left' \| 'right' \| null` | `null`  | Alignment. `null` aligns to the start.             |

Without a wrapper, the hint is not linked. Give it an `id` and add that id to
the control's `aria-describedby`.

Inside a wrapper, the wrapper links the hint for you. A hint without an `id`
gets `{fieldName}-hint`. More hints for the same field get `{fieldName}-hint-2`,
`{fieldName}-hint-3`, and so on, so no two hints share an id.

### NgxFormFieldCharacterCount

Shows "current/max" and changes colour as the value nears the limit.

```html
<ngx-form-field-character-count [formField]="form.bio" [maxLength]="500" />
```

| Input                   | Type                                        | Default                    | Description                                                                                                   |
| ----------------------- | ------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `formField`             | `FieldTree<CharacterCountValue>` (required) | —                          | The field to count. `CharacterCountValue` is `string \| string[]`, from `@ngx-signal-forms/toolkit/headless`. |
| `maxLength`             | `number \| undefined`                       | from `maxLength` validator | The limit. Omit it to read the field's `maxLength` validator.                                                 |
| `position`              | `'left' \| 'right'`                         | `'right'`                  | Alignment.                                                                                                    |
| `showLimitColors`       | `boolean`                                   | `true`                     | Colour changes as the count nears the limit.                                                                  |
| `liveAnnounce`          | `boolean`                                   | `false`                    | Polite announcement when the limit state changes.                                                             |
| `announcementFormatter` | `NgxCharacterCountAnnouncementFormatter`    | English text               | Function that returns localized announcement text.                                                            |
| `fieldName`             | `string \| undefined`                       | from the wrapper           | Field name for the limit id when no wrapper supplies one.                                                     |

Behavior:

- Strings count characters. Arrays of strings count items. `null` and
  `undefined` count as `0`. Other values render `0` and log a warning in
  development mode.
- The colour states are ok, warning (80%), danger (95%), and exceeded (over
  100%). Change the colour thresholds with CSS; see
  [character count tokens](/packages/toolkit/form-field/THEMING#character-count).
- `[liveAnnounce]` announces only when the state changes, not on each key. It
  always uses the 80% and 95% thresholds, also when CSS changes the colours.
- Inside a wrapper, the component also adds a hidden "Up to 500 characters"
  text to the control's `aria-describedby`. Change that text with
  `characterCountLimitText` (`{max}` placeholder) in
  `provideNgxSignalFormsConfig()`.
- Without a wrapper, set `fieldName` to render the same hidden text with the
  id `{fieldName}-char-count-limit`. Put that id in the control's
  `aria-describedby` yourself. Auto-ARIA keeps ids that you write. Use one id
  token for `fieldName`: the count trims it and replaces inner whitespace
  with `-`, so `"shipping notes"` gives `shipping-notes-char-count-limit`.
  Inside a wrapper, the count ignores `fieldName` and uses the wrapper's
  field name.

  ```html
  <textarea
    id="bio"
    aria-describedby="bio-char-count-limit"
    [formField]="form.bio"
  ></textarea>
  <ngx-form-field-character-count [formField]="form.bio" fieldName="bio" />
  ```

To localize the announcements, bind `[announcementFormatter]`. The function
gets `'warning'`, `'danger'`, or `'exceeded'`, never `'ok'`. `remaining` and
`over` are never below zero.

```typescript
import type { NgxCharacterCountAnnouncementFormatter } from '@ngx-signal-forms/toolkit/assistive';

readonly formatter: NgxCharacterCountAnnouncementFormatter = (
  state,
  { remaining, over },
) => {
  switch (state) {
    case 'warning':
    case 'danger':
      return `Plus que ${remaining} caractères.`;
    case 'exceeded':
      return `Limite dépassée de ${over} caractères.`;
  }
};
```

### NgxFormMarkingLegend

A line that explains the field marker, for example "\* indicates a required
field". Place it once where it reads well.

```html
<form [formRoot]="userForm" ngxSignalForm>
  <ngx-form-marking-legend />
  <!-- fields -->
</form>
```

Outside an `ngxSignalForm` form, pass the tree:
`<ngx-form-marking-legend [formTree]="userForm" />`.

| Input            | Type               | Default              | Description                                          |
| ---------------- | ------------------ | -------------------- | ---------------------------------------------------- |
| `formTree`       | `FieldTree`        | `ngxSignalForm` form | The form to describe.                                |
| `showMarkerWhen` | `FieldMarkingMode` | app config           | `'required'`, `'optional'`, or `'none'`.             |
| `text`           | `string`           | app config           | Legend text. `{marker}` is replaced with the marker. |
| `requiredMarker` | `string`           | app config           | Marker for `{marker}` in `'required'` mode.          |
| `optionalMarker` | `string`           | app config           | Marker for `{marker}` in `'optional'` mode.          |

- In `'required'` mode, it hides when the form has no required fields.
- In `'optional'` mode, it hides when the form has no optional fields.
- In `'none'` mode, it renders nothing.
- It is plain visible text, not a live region.

## Warnings

Create a warning with `warningError()` from `@ngx-signal-forms/toolkit`. See
[warnings](/docs/WARNINGS_SUPPORT).

## Theming

These components use the same CSS custom properties as `/form-field`. See the
[theming guide](/packages/toolkit/form-field/THEMING).

## Related documentation

- [Toolkit core](/packages/toolkit/README): configuration, auto-ARIA, and utilities
- [Form field wrapper](/packages/toolkit/form-field/README): the wrapper that uses these
  components
- [Headless primitives](/packages/toolkit/headless/README): signals only, no markup
- [Grouped fields and error summaries](/docs/COMPLEX_NESTED_FORMS)
