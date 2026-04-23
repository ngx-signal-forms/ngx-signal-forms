# @ngx-signal-forms/toolkit/form-field

> Pre-styled form field wrapper and fieldset components — layout, labels, hints, errors, warnings, character counts, and ARIA in a single component.

## Why this entry point exists

Most Angular Signal Forms projects need the same things around each field: a label, error messages that appear at the right time, hints, character counts, and proper ARIA linking. The form-field wrapper handles all of this in one component.

If you need full control over markup, use [`/headless`](../headless/README.md) instead. If you only need the error/hint components without the wrapper layout, use [`/assistive`](../assistive/README.md).

## Import

```typescript
// Bundle import (recommended)
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

// Individual imports
import {
  NgxFormFieldWrapper,
  NgxFormFieldset,
} from '@ngx-signal-forms/toolkit/form-field';

// Assistive components are NOT re-exported from this entry point.
// Import them directly when used standalone:
// import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
```

`NgxFormField` bundles the wrapper, fieldset, and all assistive components (error, hint, character count, assistive row) for convenience. Individual assistive components should be imported from `@ngx-signal-forms/toolkit/assistive`.

## Quick start

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  form,
  schema,
  required,
  email,
  maxLength,
  FormField,
} from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [formRoot]="contactForm" ngxSignalForm>
      <ngx-form-field-wrapper
        [formField]="contactForm.email"
        appearance="outline"
      >
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          [formField]="contactForm.email"
          required
        />
        <ngx-form-field-hint>
          We'll never share your email
        </ngx-form-field-hint>
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper [formField]="contactForm.message">
        <label for="message">Message</label>
        <textarea
          id="message"
          [formField]="contactForm.message"
          required
        ></textarea>
        <ngx-form-field-character-count
          [formField]="contactForm.message"
          [maxLength]="500"
        />
      </ngx-form-field-wrapper>

      <button type="submit">Send</button>
    </form>
  `,
})
export class ContactFormComponent {
  readonly #model = signal({ email: '', message: '' });
  protected readonly contactForm = form(
    this.#model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Invalid email format' });
      required(path.message, { message: 'Message is required' });
      maxLength(path.message, 500, { message: 'Max 500 characters' });
    }),
  );
}
```

## Wrapper component

`ngx-form-field-wrapper` — wraps a form field with automatic error display, labels, hints, prefix/suffix slots, and ARIA.

| Input                | Type                                              | Default     | Description                                    |
| -------------------- | ------------------------------------------------- | ----------- | ---------------------------------------------- |
| `formField`          | `FieldTree` (required)                            | —           | The form field to wrap                         |
| `fieldName`          | `string`                                          | From `id`   | Explicit field name; derived from control `id` |
| `appearance`         | `'standard' \| 'outline' \| 'plain' \| 'inherit'` | `'inherit'` | Visual style variant                           |
| `strategy`           | `ErrorDisplayStrategy`                            | Inherited   | Override error display strategy                |
| `errorPlacement`     | `'top' \| 'bottom'`                               | `'bottom'`  | Render errors above or below the control       |
| `showRequiredMarker` | `boolean`                                         | Config      | Toggle the outlined required marker            |
| `requiredMarker`     | `string`                                          | Config      | Custom required marker text                    |

### Appearances

- **`standard`** — label above input, simple vertical layout
- **`outline`** — Material Design floating label with bordered container (requires CSS `:has()` — Chrome 105+, Firefox 121+, Safari 15.4+)
- **`plain`** — no field chrome; the wrapper still provides labels, errors, and field identity. Good for custom controls with their own visual treatment.
- **`inherit`** (default) — uses the value from `provideNgxSignalFormsConfig()`

### Orientation

- **`vertical`** — label above input (default)
- **`horizontal`** — label in a shared column to the left of the field control
- **`inherit`** (default input value) — uses the value from `provideNgxSignalFormsConfig()`

`appearance="outline"` always resolves to vertical because the floating-label
treatment depends on the label staying inside the field chrome. Selection rows
such as checkbox, switch, and radio-group controls keep their own inline
layouts even when `orientation="horizontal"` is requested.

Orientation changes a single wrapper, not the parent form grid. If you want one
field row per line in `standard + horizontal`, collapse the surrounding layout
in the page or feature container.

### Prefix and suffix slots

```html
<ngx-form-field-wrapper [formField]="form.amount">
  <span prefix aria-hidden="true">$</span>
  <label for="amount">Amount</label>
  <input id="amount" type="number" [formField]="form.amount" />
  <button suffix type="button" (click)="clear()" aria-label="Clear">✕</button>
</ngx-form-field-wrapper>
```

Decorative prefix/suffix icons should use `aria-hidden="true"`. Interactive suffix buttons need `type="button"` and a descriptive `aria-label`.

### Field name resolution

The wrapper needs a field name for ARIA linking. It resolves from the `fieldName` input first, then from the projected control's `id`. If neither is available the wrapper logs a one-shot `console.error` in dev mode, returns `null` from the affected signals, and skips ARIA wiring — render trees stay intact, but the field will not announce errors to assistive tech. Always provide an `id` (or explicit `fieldName`) for production accessibility.

### Custom controls

For non-native controls (sliders, date pickers, composites), declare control semantics on the `[formField]` host:

```html
<ngx-form-field-wrapper [formField]="form.rating" appearance="plain">
  <label for="rating">Rating</label>
  <app-star-rating
    id="rating"
    role="slider"
    [formField]="form.rating"
    ngxSignalFormControl="slider"
    ngxSignalFormControlAria="manual"
  />
</ngx-form-field-wrapper>
```

A native `input[type="checkbox"][role="switch"]` is recognized as a switch automatically — no extra directives needed. See [Custom Controls](../../docs/CUSTOM_CONTROLS.md) for detailed guidance.

### Warning support

Warnings (errors with `kind` starting with `warn:`) display automatically:

- When blocking errors are present: error styling (red border), warnings hidden
- When only warnings are present: warning styling (amber border), warnings shown
- Errors use `role="alert"`, warnings use `role="status"` (relying on the
  implicit live-region semantics of those roles — no explicit `aria-live`)

Warning **display timing** is independent from error timing. The projected
`NgxFormFieldError` accepts a `warningStrategy` input (default
`'immediate'`) so advisory messages stay visible even when errors are gated
by `'on-touch'` or `'on-submit'`. See
[`WARNINGS_SUPPORT.md`](../../docs/WARNINGS_SUPPORT.md#when-warnings-appear--warningstrategy).

## Fieldset component

`ngx-form-fieldset` — groups related fields with aggregated error display.

Use it when the validation belongs to the group as a whole — cross-field rules,
repeated row sections, or dense subsections that should
own a single summary. For radio groups and checkbox groups that should behave
like a single field with inline wrapper feedback, use
`ngx-form-field-wrapper` instead. If each child control should render its own feedback,
keep the fieldset in the default group-only mode and let the nested
`ngx-form-field-wrapper`s stay responsible for leaf errors. If you want the
aggregation signals without any prebuilt markup, drop down to
[`/headless`](../headless/README.md).

```html
<ngx-form-fieldset [fieldsetField]="form.address" fieldsetId="address">
  <legend>Shipping Address</legend>

  <ngx-form-field-wrapper
    [formField]="form.address.street"
    appearance="outline"
  >
    <label for="street">Street</label>
    <input id="street" [formField]="form.address.street" />
  </ngx-form-field-wrapper>

  <ngx-form-field-wrapper [formField]="form.address.city" appearance="outline">
    <label for="city">City</label>
    <input id="city" [formField]="form.address.city" />
  </ngx-form-field-wrapper>
</ngx-form-fieldset>
```

| Input                 | Type                                                                     | Default     | Description                                                    |
| --------------------- | ------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------- |
| `fieldsetField`       | `FieldTree` (required)                                                   | —           | Field tree to aggregate                                        |
| `fields`              | `FieldTree[]`                                                            | `null`      | Explicit field list (overrides tree traversal)                 |
| `fieldsetId`          | `string`                                                                 | Generated   | ID for ARIA linking                                            |
| `strategy`            | `ErrorDisplayStrategy`                                                   | Inherited   | Error display strategy                                         |
| `showErrors`          | `boolean`                                                                | `true`      | Toggle error display                                           |
| `includeNestedErrors` | `boolean`                                                                | `false`     | Include child field errors via `errorSummary()`                |
| `errorPlacement`      | `'top' \| 'bottom'`                                                      | `'bottom'`  | Render grouped messages before or after content                |
| `appearance`          | `'outline' \| 'plain'`                                                   | `'outline'` | Border-and-padding shell or semantic-only grouping             |
| `feedbackAppearance`  | `'auto' \| 'plain' \| 'notification'`                                    | `'auto'`    | Choose compact grouped text or surfaced notification cards     |
| `notificationTitle`   | `string`                                                                 | —           | Optional title for notification-style grouped feedback         |
| `listStyle`           | `'plain' \| 'bullets'`                                                   | `'bullets'` | Grouped message layout                                         |
| `surfaceTone`         | `'default' \| 'neutral' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'default'` | Base fieldset surface tint below the legend                    |
| `validationSurface`   | `'never' \| 'always'`                                                    | `'never'`   | Whether invalid/warning state should tint the fieldset surface |

### Error display modes

- **Group-only** (default) — shows only group-level errors. Use when nested fields display their own errors via wrappers.
- **Aggregated** (`includeNestedErrors`) — collects all nested errors. Use when fields don't have individual error display.

### Fieldset appearances

- **`outline`** (default) — the current bordered grouped section with inner padding
- **`plain`** — semantic-only grouping with no border, no padding, and no surfaced background; useful when you want the legend and grouped validation semantics without visible fieldset chrome

### Summary placement

- **`top`** — useful when grouped summaries should be read immediately after
  the legend or supporting copy.
- **`bottom`** (default) — useful when the user should scan the controls first
  and see the grouped summary after the section.

```html
<ngx-form-fieldset [fieldsetField]="form.deliveryMethod" errorPlacement="top">
  <legend>Delivery method</legend>
  <!-- grouped controls -->
</ngx-form-fieldset>
```

### Grouped feedback appearance

- **`feedbackAppearance="auto"`** (default) uses a surfaced notification card
  for grouped sections.
- **`plain`** always uses the compact `ngx-form-field-error` presentation.
- **`notification`** always uses `ngx-form-field-notification`.

This keeps the fieldset focused on grouped summaries and surfaced sections.
Radio groups and checkbox groups that should show inline errors and invalid
backgrounds now belong in `ngx-form-field-wrapper`, not `ngx-form-fieldset`.

### Fieldset surface behavior

- **`surfaceTone`** controls the base fill of the fieldset surface.
- **`validationSurface="never"`** (default) keeps the surface neutral and relies
  on the grouped message alone.
- **`validationSurface="always"`** tints every grouped section on validation
  state.

## Grouped radio/checkbox controls in the wrapper

Use `ngx-form-field-wrapper` when a radio group or checkbox group should behave
like a single field with wrapper-owned inline feedback.

```html
<ngx-form-field-wrapper
  [formField]="form.deliveryMethod"
  fieldName="delivery-method"
  errorPlacement="bottom"
>
  <span ngxFormFieldLabel>Delivery option *</span>

  <div class="delivery-options">
    <label>
      <input
        id="delivery-standard"
        type="radio"
        name="deliveryMethod"
        [formField]="form.deliveryMethod"
        value="standard"
      />
      <span>Standard</span>
    </label>

    <label>
      <input
        id="delivery-express"
        type="radio"
        name="deliveryMethod"
        [formField]="form.deliveryMethod"
        value="express"
      />
      <span>Express</span>
    </label>
  </div>
</ngx-form-field-wrapper>
```

Use a normal `<label for="..."></label>` for single controls. For grouped
radio/checkbox wrappers, project a neutral heading element such as
`<span ngxFormFieldLabel>` instead of an HTML `<label>` because the wrapper is
labelling the group container (`radiogroup`/`group`), not a single input.

When the wrapper detects a grouped radio or checkbox cluster, it uses a surfaced
background on the wrapper content instead of a text-field border. The feedback
still renders through the normal wrapper assistive row or `errorPlacement`
setting.

```html
<ngx-form-fieldset
  [fieldsetField]="form.contactMethod"
  surfaceTone="neutral"
  validationSurface="always"
>
  <legend>Preferred contact method</legend>
  <!-- radio group -->
</ngx-form-fieldset>
```

### Password group example

This is the common “two normal fields plus one group-level rule” case. The
wrappers keep ownership of leaf validation such as required/min-length, while
the fieldset is reserved for the shared cross-field message.

```html
<ngx-form-fieldset [fieldsetField]="form.passwords" fieldsetId="passwords">
  <legend>Passwords</legend>

  <ngx-form-field-wrapper [formField]="form.passwords.password">
    <label for="password">Password</label>
    <input
      id="password"
      type="password"
      [formField]="form.passwords.password"
    />
  </ngx-form-field-wrapper>

  <ngx-form-field-wrapper [formField]="form.passwords.confirm">
    <label for="confirm-password">Confirm password</label>
    <input
      id="confirm-password"
      type="password"
      [formField]="form.passwords.confirm"
    />
  </ngx-form-field-wrapper>

  <!-- The fieldset shows only "Passwords must match" -->
</ngx-form-fieldset>
```

```typescript
import { form, required, validateTree } from '@angular/forms/signals';

const signupForm = form(model, (path) => {
  required(path.passwords.password, { message: 'Password is required' });
  required(path.passwords.confirm, {
    message: 'Please confirm your password',
  });

  validateTree(path.passwords, ({ value }) => {
    const { password, confirm } = value();
    if (password && confirm && password !== confirm) {
      return { kind: 'mismatch', message: 'Passwords must match' };
    }
    return null;
  });
});
```

Can also be used as an attribute selector on native `<fieldset>` or `<div>`:

```html
<fieldset ngxFormFieldset [fieldsetField]="form.address" fieldsetId="address">
  <legend>Address</legend>
  <!-- ... -->
</fieldset>
```

## Theming

All components share a CSS custom properties system. See the [Theming Guide](./THEMING.md) for the full reference (~120 CSS custom properties covering layout, typography, feedback surfaces, and dark mode).

Quick example:

```css
:root {
  --ngx-form-field-focus-color: #007bc7;
  --ngx-form-field-color-border: rgba(50, 65, 85, 0.25);
  --ngx-signal-form-error-color: #db1818;
  --ngx-signal-form-feedback-font-size: 0.75rem;
}
```

## Related documentation

- [Theming guide](./THEMING.md) — complete CSS custom properties reference
- [Toolkit core](../README.md) — error strategies, ARIA, configuration
- [Assistive components](../assistive/README.md) — standalone error, hint, and count components
- [Headless primitives](../headless/README.md) — renderless directives for full custom UI
- [Custom controls](../../docs/CUSTOM_CONTROLS.md) — wrapping sliders, date pickers, and third-party widgets
- [CSS framework integration](../../docs/CSS_FRAMEWORK_INTEGRATION.md) — Tailwind, Bootstrap, Material

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
