---
title: '@ngx-signal-forms/toolkit/form-field'
sidebarTitle: 'form-field'
---

The styled field wrapper. Put a label and a control inside
`ngx-form-field-wrapper`. The wrapper shows errors and warnings at the right
time, links hints and messages to the control with ARIA, and adds a required
marker. `ngx-form-fieldset` groups related fields and shows group-level
messages.

Use this entry point when you accept the toolkit's field layout and theme it
with CSS variables. Use [`/assistive`](../assistive/README.md) when you keep
your own field layout, or [`/headless`](../headless/README.md) when you render
all markup yourself. See [choose your level](../../../README.md#choose-your-level).

## Import

```typescript
import { FormField } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
})
```

`NgxFormField` contains:

- `NgxFormFieldWrapper` (`ngx-form-field-wrapper`)
- `NgxFormFieldset` (`ngx-form-fieldset`)
- `NgxFormFieldHint`, `NgxFormFieldCharacterCount`, and `NgxFormFieldError`
- the auto-ARIA and control-semantics directives

It does not contain Angular's `FormRoot` or the toolkit's `ngxSignalForm`
directive. Import `NgxSignalFormToolkit` from the root entry point for those.
You need it in almost every form, because `<form [formRoot]>` needs `FormRoot`.

You can also import `NgxFormFieldWrapper` and `NgxFormFieldset` one by one.
The error summary component is not in this entry point. See
[Error summary](#error-summary).

## Quick start

For a complete component with submission and focus on the first invalid
field, use the [tested root starter](../../../README.md#quick-start). This
example adds a hint and a character count.

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
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'app-contact',
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  templateUrl: './contact.html',
})
export class ContactComponent {
  readonly model = signal({ email: '', message: '' });
  readonly contactForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email address' });
      required(path.message, { message: 'Message is required' });
      maxLength(path.message, 500, { message: 'Use 500 characters or fewer' });
    },
    {
      submission: {
        action: async (tree) => {
          // Send tree().value() to your API
        },
        onInvalid: createOnInvalidHandler(),
      },
    },
  );
}
```

```html
<!-- contact.html -->
<form [formRoot]="contactForm">
  <ngx-form-field-wrapper [formField]="contactForm.email">
    <label for="contact-email">Email</label>
    <input
      id="contact-email"
      type="email"
      autocomplete="email"
      [formField]="contactForm.email"
    />
    <ngx-form-field-hint>We never share your email.</ngx-form-field-hint>
  </ngx-form-field-wrapper>

  <ngx-form-field-wrapper [formField]="contactForm.message">
    <label for="contact-message">Message</label>
    <textarea id="contact-message" [formField]="contactForm.message"></textarea>
    <ngx-form-field-character-count [formField]="contactForm.message" />
  </ngx-form-field-wrapper>

  <button type="submit">Send</button>
</form>
```

You do not add a native `required` attribute. Angular's `[formField]` sets
`required` on native controls from the schema, and the wrapper reads the
required state from the field to show the marker. The character count reads
the limit from the `maxLength()` rule. Pass `[maxLength]` only to override it.

## Anatomy

You project these into the wrapper:

| Content         | Selector                                               | Notes                                                                                            |
| --------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Label           | `label` or any element with `ngxFormFieldLabel`        | Use `<label for>` for one control. See [grouped controls](#grouped-radio-and-checkbox-controls). |
| Control         | Any other content                                      | The element with `[formField]`. Give it an `id`.                                                 |
| Prefix          | Any element with `prefix`                              | Shows before the control, inside the field border.                                               |
| Suffix          | Any element with `suffix`                              | Shows after the control, inside the field border.                                                |
| Hint            | `ngx-form-field-hint`                                  | Linked to the control with `aria-describedby`.                                                   |
| Character count | `ngx-form-field-character-count` or `[characterCount]` | Shows on the right of the row below the control.                                                 |

The wrapper renders these itself:

- **Errors and warnings.** Below the control by default, or above it with
  `errorPlacement="top"`. Errors use `role="alert"`. Warnings use
  `role="status"`.
- **Marker.** ` *` after the label of a required field, by default. The
  marker is `aria-hidden`. The control carries `aria-required`.

```html
<ngx-form-field-wrapper [formField]="form.amount">
  <label for="amount">Amount</label>
  <span prefix aria-hidden="true">$</span>
  <input id="amount" type="number" [formField]="form.amount" />
  <button suffix type="button" aria-label="Clear amount" (click)="clear()">
    ✕
  </button>
</ngx-form-field-wrapper>
```

Add `aria-hidden="true"` to decorative prefix and suffix content. Give a
suffix button `type="button"` and an accessible name.

## Wrapper inputs

Only `formField` is required. Set the other inputs to change one field.
"Inherited" means the wrapper uses the app setting from
`provideNgxSignalFormsConfig()`, and the built-in value when the app sets
nothing. The error strategies also read the form's `ngxSignalForm` setting.
See [configuration](../README.md#configuration) and
[timing precedence](../../../docs/WARNINGS_SUPPORT.md#timing-and-configuration).

| Input             | Type                                                            | Default                             | Description                                                 |
| ----------------- | --------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| `formField`       | `FieldTree`                                                     | Required                            | The field whose state the wrapper shows.                    |
| `fieldName`       | `string`                                                        | The control's `id`                  | Name for the message ids. See [field name](#field-name).    |
| `strategy`        | `'immediate' \| 'on-touch' \| 'on-submit' \| 'inherit' \| null` | Inherited, built-in `'on-touch'`    | When errors show. `null` and `'inherit'` both inherit.      |
| `warningStrategy` | `'immediate' \| 'on-touch' \| 'on-submit' \| 'inherit'`         | Inherited, built-in `'on-touch'`    | When warnings show. Independent of `strategy`.              |
| `errorPlacement`  | `'top' \| 'bottom'`                                             | `'bottom'`                          | Show messages above or below the control.                   |
| `appearance`      | `'standard' \| 'outline' \| 'plain' \| 'inherit'`               | Inherited, built-in `'standard'`    | Field style. See [appearance](#appearance-and-orientation). |
| `orientation`     | `'vertical' \| 'horizontal' \| 'inherit'`                       | Inherited, built-in `'vertical'`    | Label above or beside the control.                          |
| `showMarkerWhen`  | `'required' \| 'optional' \| 'none'`                            | Inherited, built-in `'required'`    | Which fields get a marker.                                  |
| `requiredMarker`  | `string`                                                        | Inherited, built-in `' *'`          | Marker text for required fields.                            |
| `optionalMarker`  | `string`                                                        | Inherited, built-in `' (optional)'` | Marker text for optional fields.                            |
| `hideHintOnError` | `boolean`                                                       | Inherited, built-in `false`         | Hide the hint while an error or warning shows.              |

`hideHintOnError` only hides the hint visually. Screen readers still read it
through `aria-describedby`.

### Appearance and orientation

| Appearance | Look                                                                                                  | With `orientation="horizontal"` |
| ---------- | ----------------------------------------------------------------------------------------------------- | ------------------------------- |
| `standard` | Label above a bordered control.                                                                       | Label in a column to the left.  |
| `outline`  | One border around label and control. The label sits inside it, above the control, and does not move.  | Stays vertical.                 |
| `plain`    | No field border. Labels, messages, and ARIA still work. Good for custom controls with their own look. | Label in a column to the left.  |

Checkbox, switch, and radio-group controls keep their own inline layout and
ignore `orientation`. Orientation changes one wrapper, not the layout of the
form around it.

`outline` needs CSS `:has()` and native CSS nesting. See
[browser support](./THEMING.md#browser-support).

### Field name

The wrapper uses a field name to build the ids of its messages. It takes the
`fieldName` input first, then the `id` of the projected control. If it finds
neither, it logs an error in development mode and skips the ARIA links. The
field still renders, but screen readers do not hear its errors. Always give
the control an `id`, or set `fieldName`. See
[field identity](../../../docs/CUSTOM_CONTROLS.md#field-identity-id-and-fieldname).

## Custom controls

A widget such as a slider or a star rating declares its control kind on the
`[formField]` host. It usually uses `appearance="plain"`:

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

`ngxSignalFormControlAria="manual"` tells the toolkit that the control writes
its own ARIA. A control that should look like a text field, such as a
combobox, keeps the default appearance and lets the wrapper draw the border.
A native `input[type="checkbox"][role="switch"]` needs no extra attribute.
[Custom controls](../../../docs/CUSTOM_CONTROLS.md) explains control kinds,
when the toolkit writes ARIA on a control, and field-shaped versus
widget-shaped controls.

## Warnings

A validation error whose `kind` starts with `warn:` is a warning. Create it
with `warningError()` from the root entry point. The wrapper shows it in
amber with `role="status"`.

While a field shows blocking errors, the wrapper hides its warnings. Warnings have their own timing
(`warningStrategy`), so they can show early while errors wait for submit. See
[warnings](../../../docs/WARNINGS_SUPPORT.md) for submission with warnings.

## Grouped radio and checkbox controls

Use the wrapper, not the fieldset, for a radio group or checkbox group that
acts as one field. The wrapper gives the group `role="radiogroup"` or
`role="group"`, labels it, and shows the messages below it.

```html
<ngx-form-field-wrapper
  [formField]="form.deliveryMethod"
  fieldName="delivery-method"
>
  <span ngxFormFieldLabel>Delivery option</span>

  <label>
    <input
      id="delivery-standard"
      type="radio"
      value="standard"
      [formField]="form.deliveryMethod"
    />
    Standard
  </label>
  <label>
    <input
      id="delivery-express"
      type="radio"
      value="express"
      [formField]="form.deliveryMethod"
    />
    Express
  </label>
</ngx-form-field-wrapper>
```

Label the group with `<span ngxFormFieldLabel>`, not `<label>`. A `<label>`
names one control, but here the wrapper names the whole group. Do not type a
` *` into the label: the wrapper adds the marker. A projected
`ngx-form-field-hint` is linked to the group, unless you turn off auto-ARIA
on the wrapper.

## Fieldset

`ngx-form-fieldset` groups related fields under a `<legend>` and shows
messages that belong to the group. Use it for:

- rules across fields, such as "passwords must match"
- repeated sections, such as one address per row
- a section that shows one summary instead of a message per field

Each nested `ngx-form-field-wrapper` still shows its own field errors. The
fieldset shows only the group's own errors by default. To collect all nested
errors in the fieldset, add `includeNestedErrors`. Use that when the nested
fields have no wrapper. For radio and checkbox groups, use the
[wrapper](#grouped-radio-and-checkbox-controls).

```html
<ngx-form-fieldset [field]="form.passwords" fieldsetId="passwords">
  <legend>Passwords</legend>

  <ngx-form-field-wrapper [formField]="form.passwords.password">
    <label for="password">Password</label>
    <input
      id="password"
      type="password"
      autocomplete="new-password"
      [formField]="form.passwords.password"
    />
  </ngx-form-field-wrapper>

  <ngx-form-field-wrapper [formField]="form.passwords.confirm">
    <label for="confirm-password">Confirm password</label>
    <input
      id="confirm-password"
      type="password"
      autocomplete="new-password"
      [formField]="form.passwords.confirm"
    />
  </ngx-form-field-wrapper>

  <!-- The fieldset shows only "Passwords must match" -->
</ngx-form-fieldset>
```

```typescript
import { signal } from '@angular/core';
import { form, required, validateTree } from '@angular/forms/signals';

const model = signal({ passwords: { password: '', confirm: '' } });

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

You can also put the directive on a native element:
`<fieldset ngxFormFieldset [field]="form.address">`.

While the group shows errors, the fieldset hides its warnings. Warnings use their own timing, as in the wrapper.

See [grouped fields, arrays, and error summaries](../../../docs/COMPLEX_NESTED_FORMS.md)
for more patterns.

### Fieldset inputs

"Inherited" has the same meaning as for the [wrapper](#wrapper-inputs).

| Input                 | Type                                                                     | Default                          | Description                                                                                |
| --------------------- | ------------------------------------------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `field`               | `FieldTree`                                                              | Required                         | The group to validate.                                                                     |
| `fields`              | `FieldTree[] \| null`                                                    | `null`                           | Collect messages from these fields instead of from `field`.                                |
| `fieldsetId`          | `string`                                                                 | Generated                        | Id used for the message ids.                                                               |
| `strategy`            | `'immediate' \| 'on-touch' \| 'on-submit' \| 'inherit'`                  | Inherited, built-in `'on-touch'` | When errors show.                                                                          |
| `warningStrategy`     | `'immediate' \| 'on-touch' \| 'on-submit' \| 'inherit'`                  | Inherited, built-in `'on-touch'` | When warnings show.                                                                        |
| `submittedStatus`     | `'unsubmitted' \| 'submitting' \| 'submitted'`                           | From the form                    | Override the submit state used for `on-submit` timing.                                     |
| `includeNestedErrors` | `boolean`                                                                | `false`                          | Also show the errors of nested fields.                                                     |
| `showErrors`          | `boolean`                                                                | `true`                           | Set `false` to hide the fieldset messages.                                                 |
| `errorPlacement`      | `'top' \| 'bottom'`                                                      | `'bottom'`                       | Show messages after the legend or after the fields.                                        |
| `appearance`          | `'outline' \| 'plain'`                                                   | `'outline'`                      | `outline` draws a border and padding. `plain` draws neither.                               |
| `feedbackAppearance`  | `'auto' \| 'plain' \| 'notification'`                                    | `'auto'`                         | `notification` shows messages in a card. `plain` shows them as text. `auto` uses the card. |
| `notificationTitle`   | `string`                                                                 | None                             | Title of the notification card. Ignored with `feedbackAppearance="plain"`.                 |
| `listStyle`           | `'plain' \| 'bullets'`                                                   | `'bullets'`                      | Show several messages as a bulleted list or as plain lines.                                |
| `surfaceTone`         | `'default' \| 'neutral' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'default'`                      | Background color of the fieldset content.                                                  |
| `validationSurface`   | `'never' \| 'always'`                                                    | `'never'`                        | `always` tints the background when the group has an error or warning.                      |

## Error summary

The wrapper and fieldset show messages next to their fields. To list all
errors of a form in one place, use `ngx-form-field-error-summary` from
[`/assistive`](../assistive/README.md). Import it from
`@ngx-signal-forms/toolkit/assistive`.

## Theming

All components use CSS custom properties, with light and dark mode. See the
[theming guide](./THEMING.md) for the full list.

## Related documentation

- [Toolkit reference](../README.md): configuration, directives, and utilities
- [Assistive components](../assistive/README.md): errors, hints, counts, and summaries for your own layout
- [Headless primitives](../headless/README.md): state only, for fully custom markup
- [Custom controls](../../../docs/CUSTOM_CONTROLS.md)
- [Custom wrappers](../../../docs/CUSTOM_WRAPPERS.md)
- [CSS framework integration](../../../docs/CSS_FRAMEWORK_INTEGRATION.md)
