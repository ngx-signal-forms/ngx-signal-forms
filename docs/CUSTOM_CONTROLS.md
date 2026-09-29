# Custom controls

This guide is for app developers who put a custom input or widget inside a
form: a combobox, a closed select, a switch, a rating, a datepicker, or a
third-party widget. It shows how to bind the control to Angular Signal Forms
and how the toolkit adds its ARIA and layout to it.

## When to read this guide

Skip this guide if every field is a native `<input>`, `<textarea>`, or
`<select>` inside `ngx-form-field-wrapper`. The toolkit defaults cover that.

To wrap a whole component library or design system once, read
[Custom wrappers](./CUSTOM_WRAPPERS.md) instead.

Find your case:

| You have…                                                         | Do this                                                                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| A new control that reads and writes a value                       | [Build a custom control](#build-a-custom-control) with `FormValueControl<T>`                              |
| A new on/off control                                              | Use a native checkbox with `role="switch"`. See [Switches](#switches)                                     |
| A combobox or closed select that must look like a text field      | [Field-shaped controls](#field-shaped-vs-widget-shaped-custom-controls): kind `input-like`, naked trigger |
| A slider, rating, datepicker, or other composite widget           | [Widget-shaped controls](#field-shaped-vs-widget-shaped-custom-controls): `appearance="plain"`            |
| A widget that writes its own `aria-invalid` or `aria-describedby` | [`ngxSignalFormControlAria="manual"`](#aria-ownership)                                                    |
| A third-party widget with its own value API                       | [Adapt an existing widget](#adapting-an-existing-third-party-widget)                                      |
| A control that renders `[formField]` inside its own template      | [Import the toolkit in that component](#standalone-imports-are-template-local-the-most-common-gotcha)     |

## Build a custom control

Angular Signal Forms binds a custom control through `[formField]` when the
control implements one of two interfaces:

- **`FormValueControl<T>`** for a control that reads and writes a value
  (text, number, selection, date). It needs a `value` model. This fits almost
  every custom control.
- **`FormCheckboxControl`** for a boolean toggle. It needs a `checked` model.

Never define both `value` and `checked` on one control. `FormUiControl<T>` is
the shared base with optional state (`disabled`, `invalid`, and so on). It is
not an editable contract on its own.

```typescript
import {
  Directive,
  ElementRef,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

@Directive({
  selector: '[appCustomInput]',
  host: {
    '[value]': 'value()',
    '(input)': 'value.set($event.target.value)',
    '(blur)': 'touch.emit()',
  },
})
export class CustomInputDirective implements FormValueControl<string> {
  readonly #el = inject(ElementRef<HTMLInputElement>);

  // Required. Angular keeps it in sync with the bound field in both directions.
  readonly value = model('');

  // Report interaction when focus leaves, not when it enters.
  readonly touch = output();

  // Optional state that Angular passes in.
  readonly disabled = input(false);
  readonly invalid = input(false);

  // focusFirstInvalid() and error summaries call this.
  focus(options?: FocusOptions): void {
    this.#el.nativeElement.focus(options);
  }
}
```

A `FormCheckboxControl` has the same shape, with
`readonly checked = model(false)` instead of `value`.

Use the control inside the wrapper like a native input. Give it a stable `id`
and a `<label for>`:

```html
<ngx-form-field-wrapper [formField]="form.nickname">
  <label for="nickname">Nickname</label>
  <input id="nickname" appCustomInput [formField]="form.nickname" />
</ngx-form-field-wrapper>
```

The toolkit adds `aria-invalid`, `aria-required`, and `aria-describedby` to
the `[formField]` host. Do not bind `aria-invalid` from Angular's raw
`invalid` flag yourself. The toolkit applies it at the right moment.

### Focus

Angular's `focusBoundControl()` calls your control's `focus()` method. The
toolkit relies on it:

- `focusFirstInvalid()` and `createOnInvalidHandler()` move focus to the first
  invalid field. If your control has no `focus()`, focus does not move there,
  and the toolkit tries the next invalid field.
- Error summary entries call `focus()`. Without it, selecting an entry does
  nothing.

Forward `focus(options)` to the element the user actually types in or
operates.

## Standalone imports are template-local (the most common gotcha)

Angular resolves directives in the template that declares the element. When
your component renders the `[formField]` element in its own template, import
the toolkit in that component. Imports on the parent form do not reach it.

If you get this wrong, nothing fails. The form works, but the control gets no
`aria-invalid` or `aria-describedby`.

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

@Component({
  selector: 'app-switch-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // FormField and auto-ARIA must be imported HERE, next to the <input>.
  imports: [FormField, NgxSignalFormToolkit],
  template: `
    <input
      [id]="inputId()"
      type="checkbox"
      role="switch"
      [formField]="field()"
    />
  `,
})
export class SwitchControlComponent {
  readonly field = input.required<FieldTree<boolean>>();
  readonly inputId = input.required<string>();
}
```

Import `NgxSignalFormToolkit` for the full bundle, or `NgxSignalFormAutoAria`
if you only need auto-ARIA.

## Control kinds

The toolkit sorts each control into a **kind**. The wrapper uses the kind to
pick a layout. The built-in kinds are `input-like`, `standalone-field-like`,
`switch`, `checkbox`, `radio-group`, `slider`, and `composite`. There is no
`select` kind: a closed custom select is `input-like`.

### Inferred kind vs. auto-ARIA eligibility

The toolkit makes two separate decisions for each control:

- **Kind**: which wrapper layout the control gets.
- **Auto-ARIA eligibility**: whether the toolkit writes `aria-invalid`,
  `aria-required`, and `aria-describedby` on the control.

The two do not always agree:

| Markup                                                                  | Inferred kind                        | Auto-ARIA by default                                  |
| ----------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| `input` of a text-like type (`text`, `email`, `date`, …)                | `input-like`                         | Yes                                                   |
| `textarea`, `select`                                                    | `standalone-field-like`              | Yes                                                   |
| `input[type="range"]`                                                   | `slider`                             | Yes                                                   |
| `input[type="checkbox"]`                                                | `checkbox`                           | No. Add `ngxSignalFormControl="checkbox"` to opt in   |
| `input[type="checkbox"][role="switch"]`                                 | `switch`                             | Yes. No attribute needed                              |
| `input[type="radio"]`                                                   | `radio-group`                        | No. Add `ngxSignalFormControl="radio-group"`          |
| Custom host with `role="switch"`, `"slider"`, or `"radiogroup"`         | `switch`, `slider`, or `radio-group` | Yes                                                   |
| Custom host with `role="combobox"`, or an inner `[role="combobox"][id]` | `input-like`                         | Yes                                                   |
| `<button>` host                                                         | `composite`                          | Yes                                                   |
| Other custom host                                                       | none, until you declare one          | Yes. Opt out with `ngxSignalFormControlAria="manual"` |

Native checkboxes and radios are not eligible by default because they often
sit in a group. In a group, the wrapper puts `role`, `aria-labelledby`,
`aria-describedby`, and `aria-required` on the group container. The same
attributes on each input would repeat or contradict the group. A switch is
always a single control, so it is eligible.

### Declare a kind

When inference is wrong or missing, declare the kind on the `[formField]`
host:

```html
<app-star-rating
  id="productRating"
  role="slider"
  ngxSignalFormControl="slider"
  ngxSignalFormControlAria="manual"
  [formField]="form.productRating"
/>
```

`ngxSignalFormControl` comes with `NgxSignalFormToolkit` and `NgxFormField`.
Each kind has a preset with a layout and an ARIA mode (`'auto'` or
`'manual'`). Change presets with `provideNgxSignalFormControlPresets()`. A
preset's ARIA mode applies only to a control that is already eligible and
carries one of the `ngxSignalFormControl*` attributes.

## ARIA ownership

Each ARIA attribute on a control needs exactly one writer: the toolkit or the
widget. Two writers overwrite each other.

| Mode                                | Use it when                                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auto (default)                      | The toolkit can safely write `aria-invalid`, `aria-required`, and `aria-describedby` on the host.                                                       |
| `ngxSignalFormControlAria="manual"` | The widget already writes those attributes, or they belong on an inner element the toolkit does not reach. The toolkit stops writing them on this host. |
| `ngxSignalFormAutoAriaDisabled`     | The toolkit must not touch this host at all.                                                                                                            |

Manual mode changes only who writes the `aria-*` attributes. The wrapper still
renders the label, the hint, and the error and warning messages, and it still
applies the error timing.

In manual mode, build the `aria-describedby` value with `buildAriaDescribedBy`
from `@ngx-signal-forms/toolkit`, so the IDs match the ones the wrapper
renders (`<fieldName>-error`, `<fieldName>-warning`). For a working example,
see [Where ARIA lands](#3-where-aria-lands).

Inside `ngx-form-field-wrapper` or a custom wrapper, a manual control can
inject `NgxFieldIdentity` to read the resolved field name, the message IDs,
and the hint IDs. See the
[member table](./CUSTOM_WRAPPERS.md#ngxfieldidentity).

If an integration cannot put the attribute in the template, it can provide
`NGX_SIGNAL_FORM_ARIA_MODE` (a `Signal<'auto' | 'manual' | null>`) from a
directive on the control's own element. Auto-ARIA reads it from that element
only, not from an ancestor. The Material reference wrapper does this in its
per-control directives.

The element that gets the managed attributes needs a role that supports
`aria-required`, such as `combobox`, `textbox`, or `radiogroup`. Native
`input`, `select`, and `textarea` already have one. A custom host with no
role gets no `aria-required`.

## Switches

For an on/off control, bind a native checkbox and add `role="switch"`:

```html
<label for="emailUpdates">Email updates</label>
<input
  id="emailUpdates"
  type="checkbox"
  role="switch"
  [formField]="form.emailUpdates"
/>
```

You do not need `ngxSignalFormControl="switch"`. The toolkit infers the
`switch` kind and adds its ARIA. The native checkbox gives you focus, the
Space key, click and touch toggling, and form participation.

A switch has on/off semantics. It uses a boolean checked state and no mixed
state, and it needs an accessible name from a `<label>` or `aria-label`. See
[MDN: ARIA `switch` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/switch_role).

The toolkit adds `aria-invalid`, `aria-required`, `aria-describedby`, and
error timing. It does not add switch behavior. A non-native switch must supply
its own role, keyboard handling, checked state, and name.

Library switches:

- **Bootstrap or ng-bootstrap switch styling** sits on a native checkbox. Add
  `role="switch"` and let the toolkit add its ARIA.
- **Angular Material `mat-slide-toggle`** and **PrimeNG toggles** own their
  switch semantics and ARIA. Let the library keep them. Add
  `ngxSignalFormControlAria="manual"`, or use a
  [custom wrapper](./CUSTOM_WRAPPERS.md). Check the rendered DOM for the
  accessible name, the checked state, and the `aria-describedby` link.

## Field-shaped vs widget-shaped custom controls

Pick the kind from what the control looks like, not from the fact that it is
a custom component.

| Shape         | Looks like                                       | Kind                    | Chrome                                                                   |
| ------------- | ------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------ |
| Field-shaped  | A text field (typed search, closed select)       | `input-like`            | Naked trigger. The wrapper draws border, focus, invalid state, and type. |
| Widget-shaped | A slider, rating, datepicker, or other composite | `slider` or `composite` | The widget draws its own chrome. Use `appearance="plain"` in most cases. |

### Wrapper owns the shell

For a field-shaped control, keep the trigger naked. Do not draw a border,
padding, or focus ring on it and then undo it with `:host-context`. The
wrapper already has the `standard`, `outline`, and `plain` appearances.

Use one of these two paths. Do not mix them on one control.

1. **Inner combobox.** The control renders an inner `role="combobox"`
   element with a stable `id`. The wrapper infers `input-like` and the
   toolkit writes the ARIA attributes on that inner element.
2. **Declared `input-like` host.** Put an `id` and
   `ngxSignalFormControl="input-like"` on the `[formField]` host. Do not put
   `role="combobox"` on that host. Use this path for a closed select.

```html
<!-- Path 1: inner combobox -->
<ngx-form-field-wrapper [formField]="form.framework">
  <label for="framework">Framework</label>
  <app-autocomplete inputId="framework" [formField]="form.framework" />
</ngx-form-field-wrapper>

<!-- Path 2: host declares input-like -->
<ngx-form-field-wrapper [formField]="form.frameworkSelect">
  <label id="framework-select-label" for="frameworkSelect">Framework</label>
  <app-select
    id="frameworkSelect"
    ngxSignalFormControl="input-like"
    [attr.aria-labelledby]="'framework-select-label'"
    [formField]="form.frameworkSelect"
  />
</ngx-form-field-wrapper>
```

In path 1, the field name comes from the `[formField]` host's `id` if it has
one. Otherwise it comes from the inner combobox's `id`. The toolkit builds the
message IDs (`<fieldName>-error`, `<fieldName>-warning`) from that name. A
standalone `<ngx-form-field-error>` next to the control cannot see the inner
combobox, so give it the same name through its `fieldName` input.

If the host has its own `aria-describedby`, the toolkit copies those IDs to the
inner combobox and logs a warning in development mode. Put
`aria-describedby` on the combobox itself to avoid the warning.

### Inherit public input tokens

An `input-like` control gets the same public CSS tokens as a native text
field:

| Token                                | What it sets                              |
| ------------------------------------ | ----------------------------------------- |
| `--ngx-form-field-input-size`        | Font size in the standard appearance      |
| `--ngx-form-field-input-line-height` | Line height                               |
| `--ngx-form-field-input-font-family` | Font family                               |
| `--ngx-form-field-input-weight`      | Font weight                               |
| `--ngx-form-field-outline-input-*`   | The same tokens in the outline appearance |
| `--ngx-form-field-placeholder-color` | Placeholder and empty-select color        |

Set these tokens on a parent `form` or page. Do not hardcode `rem` values on
the widget. Give inner text `font: inherit` and `line-height: inherit` so the
tokens apply.

A closed select that shows placeholder text (not a native `::placeholder`)
colors it with
`var(--_placeholder-color, var(--ngx-form-field-placeholder-color, …))`.
`--_placeholder-color` is the value the wrapper resolved. The public token is
the fallback outside the wrapper.

Do not style `slider` or `composite` controls as text fields.

See [THEMING.md](../packages/toolkit/form-field/THEMING.md) for all tokens,
and the Angular Aria guides for
[combobox](https://angular.dev/guide/aria/combobox) and
[select](https://angular.dev/guide/aria/select) behavior.

**Runnable reference:** the
[`custom-controls` demo](../apps/demo/src/app/04-form-field-wrapper/custom-controls)
puts a native input, an Angular Aria combobox, and a closed select in one
form. In the outline appearance, they share type scale, placeholder color,
and height.

### Padding ownership recipe for field-shaped autocomplete adapters

A field-shaped autocomplete usually needs no extra CSS. The wrapper removes
the trigger's border and padding and applies the input tokens. Use this
recipe when the adapter also renders a prefix icon, a clear button, or a
popup.

1. **Field shell.** The wrapper draws the bordered box. Size it with
   `--ngx-form-field-padding-horizontal` and
   `--ngx-form-field-padding-vertical`. The adapter never draws its own border
   or background around the trigger.
2. **Text and placeholder.** The input tokens above apply to the trigger.
   Use `font: inherit` and `line-height: inherit` on it.
3. **Prefix and suffix.** Project them into the `[prefix]` and `[suffix]`
   slots. `--ngx-form-field-prefix-gap` and `--ngx-form-field-suffix-gap` set
   the gap between items in a slot. `--ngx-form-field-prefix-color` and
   `--ngx-form-field-suffix-color` set their color. The gap between a slot and
   the border is fixed.
4. **Popup.** The popup belongs to the adapter. The shell
   (`.ngx-signal-form-field-wrapper__content`) is `position: relative`, so a
   popup in the default slot can position itself against it. To align the
   popup with the visible 1px border, use `inset-inline-start: -1px`. This
   also works with `dir="rtl"`.
5. **A trigger whose padding you cannot remove.** Set
   `--ngx-form-field-padding-horizontal: 0` on that one wrapper (with a
   class, not globally) and give the adapter the same padding itself.

A widget-shaped control with its own full chrome uses `appearance="plain"`
instead. None of the steps above apply to it.

The `custom-controls` demo's mocked autocomplete applies this recipe. See
"Padding ownership recipe" in
[THEMING.md](../packages/toolkit/form-field/THEMING.md) for the geometry.

## Field identity: `id` and `fieldName`

The toolkit builds the message IDs `<fieldName>-error` and
`<fieldName>-warning` from a field name. In `ngx-form-field-wrapper`, the name
comes from the wrapper's `fieldName` input or from the bound control's `id`.
Give every custom control one of the two:

```html
<!-- Preferred: a stable id on the control -->
<ngx-form-field-wrapper [formField]="form.country">
  <label for="country">Country</label>
  <app-custom-select id="country" [formField]="form.country" />
</ngx-form-field-wrapper>

<!-- When the control cannot expose an id: name the wrapper -->
<ngx-form-field-wrapper [formField]="form.country" fieldName="country">
  <label>Country</label>
  <app-custom-select [formField]="form.country" />
</ngx-form-field-wrapper>
```

Without a name, the toolkit skips the `aria-describedby` and ID wiring for
that field. It does not throw. In development mode, the console reports the
missing name. Treat that as a bug: the messages then have no link to the
control.

If the wrapper is your own component, it has no `fieldName` input unless you
add one. Auto-ARIA then takes the name from the control's `id`. When a widget
generates its own inner `id`, add `NgxFieldIdentityProvider` to your wrapper.
See
[Custom wrappers](./CUSTOM_WRAPPERS.md#when-the-field-name-is-not-the-control-id).

## Warnings in custom controls

Angular Signal Forms has no warning concept. The toolkit treats an error whose
`kind` starts with `warn:` as a warning. Inside `ngx-form-field-wrapper`,
warnings render for you.

Without a wrapper, put `<ngx-form-field-error>` next to the control:

```html
<label for="password">Password</label>
<app-password-input id="password" [formField]="form.password" />
<ngx-form-field-error [formField]="form.password" fieldName="password" />
```

To render the messages yourself, use the headless error state:

<!-- prettier-ignore -->
```html
<div
  ngxHeadlessErrorState
  #errorState="errorState"
  [field]="form.password"
  fieldName="password"
>
  <label for="password">Password</label>
  <app-password-input id="password" [formField]="form.password" />

  <div role="status">
    @if (errorState.shouldShowWarnings() && errorState.hasWarnings()) {
      @for (warning of errorState.resolvedWarnings(); track $index) {
        <span>{{ warning.message }}</span>
      }
    }
  </div>
</div>
```

Keep the `role="status"` element in the DOM before its first message appears.
Do not create it inside the same `@if` as the message, or screen readers can
miss the first announcement. Give it the warning ID only while it shows a
warning, and link that ID from the control with the same condition.

### Publishing visibility for a custom standalone error surface

`<ngx-form-field-error>` tells auto-ARIA when its messages show. Your own
message element must do the same through
`NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY`, or `aria-describedby` can point
to a message that is not rendered. See
[Custom wrappers: visibility registry](./CUSTOM_WRAPPERS.md#visibility-registry-tell-auto-aria-when-messages-show).

## Example: complete custom select

This control wraps a native `<select>`. It uses path 1: the inner element has
`role="combobox"` and an `id`, so the toolkit writes the ARIA attributes on
the `<select>` that the user operates.

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

@Component({
  selector: 'app-custom-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <select
      #select
      role="combobox"
      [id]="selectId()"
      [value]="value()"
      [disabled]="disabled()"
      (change)="value.set(select.value)"
      (blur)="touch.emit()"
    >
      <option value="">-- Select --</option>
      @for (option of options(); track option.value) {
        <option [value]="option.value">{{ option.label }}</option>
      }
    </select>
  `,
})
export class CustomSelectComponent implements FormValueControl<string> {
  readonly #select =
    viewChild.required<ElementRef<HTMLSelectElement>>('select');

  readonly selectId = input.required<string>();
  readonly options = input<{ value: string; label: string }[]>([]);
  readonly disabled = input(false);

  readonly value = model('');
  readonly touch = output();

  focus(options?: FocusOptions): void {
    this.#select().nativeElement.focus(options);
  }
}
```

The host has no `id`, so the field name comes from the inner `<select>`'s
`id`. Import `FormField`, `NgxSignalFormToolkit`, and `NgxFormField` in the
component that declares this template:

```html
<form [formRoot]="myForm">
  <ngx-form-field-wrapper [formField]="myForm.country">
    <label for="country">Country</label>
    <app-custom-select
      selectId="country"
      [options]="countries"
      [formField]="myForm.country"
    />
  </ngx-form-field-wrapper>
</form>
```

## Adapting an existing third-party widget

The sections above build a control from scratch. This section covers a widget
you already have, such as a datepicker, a rich-text editor, or a combobox,
with its own value and change API. You write a thin `FormValueControl<T>`
adapter around it.

The `custom-controls` demo's "Date of Birth" field uses a
[datepicker adapter](../apps/demo/src/app/shared/controls/legacy-datepicker-adapter.ts)
around a [fake legacy widget](../apps/demo/src/app/shared/controls/legacy-datepicker-widget.ts).
Study it for the value conversion. It is not a complete recipe for ARIA or
for `focus(options)`: your adapter must still pick one ARIA writer on the
real input and forward focus options to the widget.

### 1. Value round-trip and type mismatch

The widget rarely uses your model's type. The demo widget gives a raw string
(`YYYY-MM-DD`, or invalid text while the user types). The field needs
`Date | null`. Use Angular's `transformedValue()` to convert in one place:

```typescript
protected readonly rawValue = transformedValue(this.value, {
  parse: (raw: string): ParseResult<Date | null> => {
    /* raw text -> Date | null, or { error: { kind: 'parse', message } } */
  },
  format: (value: Date | null): string => {
    /* Date | null -> raw text */
  },
});
```

Send widget changes to `rawValue.set()` so `parse` runs. Model changes run
`format`. In a bound field, `field().reset()` clears parse errors and formats
the current model value again. `field().reset(value)` sets a new value.
Neither restores an initial snapshot. See the
[Angular Signal Forms API](https://angular.dev/api/forms/signals).

### 2. Touched state without a single native blur

A composite widget has several focusable parts: an input, a trigger button,
and a popup with days or options. A `(blur)` on the inner input fires each
time focus moves between those parts.

Listen for `(focusout)` on the adapter's host. Emit `touch` only when the
newly focused element (`event.relatedTarget`) is outside the host:

```typescript
protected onHostFocusOut(event: FocusEvent): void {
  const related = event.relatedTarget;
  const relatedNode = related instanceof Node ? related : null;
  if (relatedNode === null || !this.#host.nativeElement.contains(relatedNode)) {
    this.touch.emit();
  }
}
```

This fires once, when focus leaves the whole widget. It also works for a
popover in the browser's top layer, because the popover stays inside the
host in the DOM.

### 3. Where ARIA lands

If the widget renders its own inner `<input>`, screen readers use that input,
not the adapter's host. Put `ngxSignalFormControlAria="manual"` on the adapter
and use `appearance="plain"`. The wrapper still renders the label, hint, and
messages. Pass `aria-describedby`, `aria-invalid`, and `aria-required` to the
widget's real input through its own inputs:

```html
<ngx-form-field-wrapper
  appearance="plain"
  [formField]="form.birthDate"
  fieldName="birthDate"
>
  <label id="birthDate-label" for="birthDate">Date of birth</label>
  <ngx-legacy-datepicker-adapter
    [controlId]="'birthDate'"
    [labelledBy]="'birthDate-label'"
    ngxSignalFormControlAria="manual"
    [describedBy]="birthDateDescribedBy()"
    [formField]="form.birthDate"
  />
</ngx-form-field-wrapper>
```

The adapter's host is not the focusable element, so do not put the `id` on
the host. Set `fieldName` on the wrapper and pass the same value to the
widget as its inner input's `id`. If the widget has no way to receive ARIA
attributes, use what it does support, and report the gap to its maintainers.

### 4. Invalid input

Report text that cannot be parsed as an error with `kind: 'parse'`. The
toolkit shows it like any other error:

```typescript
if (!isRealCalendarDate) {
  return {
    error: {
      kind: 'parse',
      message: `"${trimmed}" is not a real calendar date`,
    },
  };
}
```

Inside a Signal Forms field, `transformedValue` reports parse errors to the
field for you. Outside one, read `rawValue.parseErrors()` yourself. Return
`{ value }` for a parsed value, or `{ error }` to keep the previous model value
and show the error. Returning both updates the model and reports the error.

## Custom control checklist

- [ ] Implement `FormValueControl<T>` (a `value` model) or
      `FormCheckboxControl` (a `checked` model). Never both.
- [ ] Update the model on user input so the field stays in sync.
- [ ] Forward `focus(options)` to the element the user operates.
- [ ] Emit `touch` when focus leaves the whole control, not on focus entry or
      internal focus moves.
- [ ] Bind with `[formField]`. Do not wire the value by hand.
- [ ] Give the control a stable `id`, or set `fieldName` on the wrapper.
- [ ] Import `FormField` and the toolkit in the component whose template
      declares the `[formField]` element.
- [ ] Give each ARIA attribute one writer. Use
      `ngxSignalFormControlAria="manual"` when the widget writes its own.
- [ ] Field-shaped: keep the trigger naked, use `input-like`, and inherit the
      input tokens.
- [ ] Widget-shaped: use `appearance="plain"` and do not style it as a text
      field.
- [ ] Test that `focusFirstInvalid()` reaches the control.
- [ ] Test model-to-widget and widget-to-model updates, invalid input, and
      reset.

## Related

- [Custom wrappers](./CUSTOM_WRAPPERS.md)
- [Warnings, timing, and messages](./WARNINGS_SUPPORT.md)
- [Form field wrapper reference](../packages/toolkit/form-field/README.md)
- [Angular Signal Forms API](https://angular.dev/api/forms/signals)

## For maintainers

- Eligibility rules: [ADR-0001](./decisions/0001-control-semantics-architecture.md#auto-aria-eligibility-boundary).
- The padding recipe is locked by
  `packages/toolkit/form-field/form-field-wrapper.autocomplete-padding.browser.spec.ts`.
