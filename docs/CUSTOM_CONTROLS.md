# Custom Controls with Angular Signal Forms + Toolkit

This guide explains how custom form controls interact with Angular Signal Forms and the `@ngx-signal-forms/toolkit`.

## When to read this guide

Skip this guide if every field is a native `<input>`, `<textarea>`, or
`<select>` inside `ngx-form-field-wrapper`. The toolkit defaults cover that.

Read it when you ship a custom control. The most common case is a
**field-shaped** combobox or closed select that should look like the
native text field next to it. The wrapper already owns that shell.
Keep the widget naked and inherit the public form-field tokens.

Also read it for:

- switch-style toggles that are more than a plain checkbox row
- slider or composite widgets
- third-party controls that already own some or all ARIA attributes
- cases where wrapper layout or auto-ARIA should follow an explicit
  control family instead of toolkit heuristics

## Angular Control Interfaces

Angular Signal Forms provides three interfaces for custom controls:

| Interface             | Use Case                                                  |
| --------------------- | --------------------------------------------------------- |
| `FormValueControl<T>` | Value-carrying controls (input, textarea, custom editors) |
| `FormUiControl`       | UI-only controls (no value, just focus/state/display)     |
| `FormCheckboxControl` | Toggle/checkbox-like inputs                               |

Pick in ten seconds:

- The control **reads and writes a value** (text, number, selection, date) →
  `FormValueControl<T>`. This is the right answer for almost every custom control.
- The control is a **boolean toggle** with a checked state → `FormCheckboxControl`.
- The control carries **no value at all** — it only needs focus, disabled, or
  validation-state display (e.g. a composite's visual shell) → `FormUiControl`.

### FormValueControl\<T\>

The primary interface for custom controls that read and write a value:

```typescript
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

  // `value` is the only member the contract requires — Angular keeps it in
  // sync with the bound field in both directions.
  readonly value = model('');

  // `touch` is optional: emit it whenever the control should report
  // interaction (the `Field` directive marks the field touched in response).
  readonly touch = output();

  focus(): void {
    this.#el.nativeElement.focus();
  }

  // Optional reactive state inputs
  readonly disabled = input<boolean>(false);
  readonly invalid = input<boolean>(false);
}
```

### FormCheckboxControl

For toggle-like inputs with a checked state:

```typescript
@Directive({
  selector: '[appCustomToggle]',
  host: {
    '[checked]': 'checked()',
    '(change)': 'checked.set($event.target.checked)',
    '(blur)': 'touch.emit()',
  },
})
export class CustomToggleDirective implements FormCheckboxControl {
  readonly #el = inject(ElementRef<HTMLInputElement>);

  // `checked` is the only member the contract requires. A control that
  // implements `FormCheckboxControl` must not also define `value`.
  readonly checked = model(false);

  // Optional: report interaction so strategy-aware error visibility works.
  readonly touch = output();

  focus(): void {
    this.#el.nativeElement.focus();
  }
}
```

## Switch Semantics for Custom Toggle Controls

If your custom control represents an on/off switch rather than a plain checkbox,
document and implement it as a **switch**, not just a visually restyled boolean
field.

### Recommended pattern

Prefer a native checkbox as the actual bound control and add `role="switch"` to
that focusable element. When the toolkit should treat it as a switch for wrapper
layout and auto-ARIA, declare that explicitly with
`ngxSignalFormControl="switch"`:

```html
<label for="emailUpdates">Email updates</label>
<input
  id="emailUpdates"
  type="checkbox"
  role="switch"
  ngxSignalFormControl="switch"
  [formField]="form.emailUpdates"
/>
```

This keeps the built-in browser behavior for:

- focusability
- Space-key toggling
- click/touch toggling
- form participation

and lets the toolkit layer its own `aria-invalid`, `aria-required`, and
`aria-describedby` behavior on top.

### Why this matters

Per MDN, a switch is a checkbox-like control with **on/off** semantics. A proper
switch:

- exposes `role="switch"`
- uses a boolean checked state (`true` / `false`)
- does **not** use an indeterminate / mixed state
- is keyboard accessible with the Space key
- has an accessible name via a visible `<label>` or `aria-label`

Reference:

- [MDN: ARIA `switch` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/switch_role)

### What the toolkit does and does not do

The toolkit can enhance switch-like controls with:

- `aria-invalid`
- `aria-required`
- `aria-describedby`
- strategy-aware error visibility

The toolkit does **not** invent base switch semantics for you. If the underlying
control does not already behave like a switch, you still need to provide the
correct role, keyboard behavior, checked-state wiring, and accessible name.

If your control already owns `aria-describedby`, `aria-invalid`, or
`aria-required`, opt out of toolkit ARIA management on that host element with
`ngxSignalFormControlAria="manual"`. Use `buildAriaDescribedBy` from
`@ngx-signal-forms/toolkit` to assemble the described-by chain without
duplicating the toolkit's ID-generation conventions.

Practical ownership rule:

- **auto** (default) for standard native field hosts that should inherit toolkit ARIA
- **manual** when the widget already owns its ARIA attributes and described-by chain

Manual mode is about **who writes the `aria-*` attributes on the control host**.
It does **not** mean you stop using the wrapper. The wrapper can still provide:

- the visible `<label>`
- hint and error content
- field identity / error ID conventions
- validation context and strategy-aware visibility

`appearance="plain"` is also commonly paired with custom sliders and composite
controls for the same reason: the wrapper still contributes semantics and
feedback, while the widget keeps ownership of its own visual chrome. These are
related choices, but they are not the same choice.

## Field-shaped vs widget-shaped custom controls

This is the common custom-control path: a searchable combobox or a closed
select that should sit in the same row as Product Name and share its
outline, type scale, and placeholder color.

Decide the control family from the **visual contract**, not from "this is a
custom component".

| Shape         | Looks like                                       | Kind                    | Chrome                                                                         |
| ------------- | ------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------ |
| Field-shaped  | A text field (typed search, closed select)       | `input-like`            | Naked trigger. The wrapper owns border, focus, invalid, and input type tokens. |
| Widget-shaped | A slider, rating, datepicker, or other composite | `slider` or `composite` | The widget owns its chrome. Pair with `appearance="plain"` in most cases.      |

There is **no `select` kind**. A closed custom select is `input-like`.

### Wrapper owns the shell

Keep the trigger naked. Do not paint a widget border, padding, or focus
ring, then undo it with `:host-context`. The wrapper already has
`standard`, `outline`, and `plain`.

Join with one of these two paths:

1. **Combobox inference.** Put a stable `id` on an inner `role="combobox"`
   trigger. The wrapper infers `input-like`.
2. **Explicit `input-like`.** Put `id` and
   `ngxSignalFormControl="input-like"` on the `[formField]` host. Do **not**
   set `role="combobox"` on that host. This is the closed-select path.

```html
<!-- Path 1: inner combobox infers input-like -->
<ngx-form-field-wrapper [formField]="form.framework" appearance="outline">
  <label for="framework">Framework</label>
  <app-autocomplete inputId="framework" [formField]="form.framework" />
</ngx-form-field-wrapper>

<!-- Path 2: host declares input-like without a combobox role -->
<ngx-form-field-wrapper [formField]="form.frameworkSelect" appearance="outline">
  <label id="framework-select-label" for="frameworkSelect">Framework</label>
  <app-select
    id="frameworkSelect"
    ngxSignalFormControl="input-like"
    [attr.aria-labelledby]="'framework-select-label'"
    [formField]="form.frameworkSelect"
  />
</ngx-form-field-wrapper>
```

### Inherit public input tokens

Once the host is `input-like`, the wrapper applies the same public tokens
it uses on native text fields:

| Token                                | What it sets                                       |
| ------------------------------------ | -------------------------------------------------- |
| `--ngx-form-field-input-size`        | Standard appearance font size (default `0.875rem`) |
| `--ngx-form-field-input-line-height` | Standard line height (default `1.25rem`)           |
| `--ngx-form-field-input-font-family` | Font family (`inherit`)                            |
| `--ngx-form-field-input-weight`      | Font weight (`400`)                                |
| `--ngx-form-field-outline-input-*`   | Outline aliases of the same tokens                 |
| `--ngx-form-field-placeholder-color` | Placeholder / empty-select color                   |

Override those tokens on a parent `form` or page. Do not hardcode `rem`
on the widget. Inner text should use `font: inherit` and
`line-height: inherit` so the wrapper tokens win.

A closed select that shows placeholder copy (not a native
`::placeholder`) should color that copy with
`var(--_placeholder-color, var(--ngx-form-field-placeholder-color, …))`.
`--_placeholder-color` is the wrapper's resolved token. The public name
is the fallback when the widget is used outside the wrapper.

Do not restyle `composite` or `slider` as text fields.

**Runnable reference:**
[`custom-controls`](../apps/demo/src/app/04-form-field-wrapper/custom-controls)
puts a native Product Name input, an Angular Aria combobox, and a closed
select in the same form. Switch to Outline and they share type scale,
placeholder color, and content height.

Token tables:
[THEMING.md](../packages/toolkit/form-field/THEMING.md).

For combobox and select behavior, follow the Angular Aria guides:

- [Combobox](https://angular.dev/guide/aria/combobox)
- [Select](https://angular.dev/guide/aria/select)

To fully disable toolkit ARIA participation on a bespoke host, use
`ngxSignalFormAutoAriaDisabled` on the control element instead of an `ariaMode` value.

### Third-party component libraries

#### Angular Material

Use the semantics and ARIA behavior that Material already provides for
`mat-slide-toggle`. Do **not** try to layer toolkit auto-ARIA on top of
Material's internal control markup inside `mat-form-field`.

- keep Material in charge of switch semantics and error rendering
- use toolkit strategy alignment only at the form/policy level when needed
- if you need wrapper-style toolkit UI, prefer a native checkbox-based switch or
  a dedicated adapter component rather than mixing two field systems

#### PrimeNG

Treat PrimeNG toggle/switch components as library-owned widgets.

- if the PrimeNG component already exposes switch semantics and manages ARIA,
  avoid duplicating toolkit auto-ARIA on the internal control
- if you wrap it, verify the rendered DOM actually exposes the accessible name,
  checked state, and described-by linkage you expect
- if it does **not** expose switch semantics correctly, use an adapter or prefer
  a native checkbox-based implementation

#### ng-bootstrap / Bootstrap switch styling

This is usually the easiest integration path because it commonly rests on a
native checkbox.

- keep the actual control as `input[type="checkbox"]`
- add `role="switch"` when the UI is conceptually a switch
- let the toolkit enhance that input with its ARIA/error wiring

## Practical rule of thumb

- **Native checkbox + switch styling** → best fit with the toolkit
- **Library switch that already owns semantics** → let the library own semantics
- **Custom non-native widget** → you must supply switch semantics yourself before
  the toolkit can enhance it safely

## Toolkit Integration

For standard `<input>`, `<textarea>`, and `<select>` wrapper usage, you normally do **not** need
`ngxSignalFormControl`, `ngxSignalFormControlAria="manual"`, or preset
providers. Those APIs are for the cases where the toolkit cannot safely infer
the desired control family or ARIA ownership from ordinary markup.

Rule of thumb:

- if the toolkit can safely manage ARIA, stay in the default auto mode
- if the widget already manages ARIA correctly, switch only the ARIA ownership to manual
- if the widget also has its own visual treatment, `appearance="plain"` is often the right wrapper companion

## Standalone imports are template-local (the most common gotcha)

When a custom control renders the actual `[formField]` host element inside its
own template, import the toolkit auto-ARIA support in that **same standalone
component**. Getting this wrong fails silently: the form works, but the
projected control gets no `aria-invalid` / `aria-describedby` wiring.

Angular standalone imports are template-scoped:

- imports on the parent form component apply to the parent template only
- imports on the custom control component apply to the custom control template
- parent imports do **not** flow automatically into child component templates

That means this setup is correct for a switch-style custom control:

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

@Component({
  selector: 'ngx-switch-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit],
  template: `
    <input
      [id]="inputId()"
      type="checkbox"
      role="switch"
      ngxSignalFormControl="switch"
      [formField]="field()"
    />
  `,
})
export class SwitchControlComponent {
  readonly field = input<FieldTree<boolean>>();
  readonly inputId = input.required<string>();
}
```

If you import `NgxSignalFormToolkit` only in the parent form component, the
toolkit directives are available to the parent's `custom-controls.html`, but not
to the `<input [formField]>` declared inside `SwitchControlComponent`.

Use whichever import fits your component best:

- `NgxSignalFormToolkit` when you want the bundle import
- `NgxSignalFormAutoAria` when you only need auto-ARIA on the leaf
  control

## FAQ

### Does explicit switch control semantics break existing native switches?

No — not for the normal native switch pattern.

This still works out of the box:

```html
<input
  id="emailUpdates"
  type="checkbox"
  role="switch"
  [formField]="form.emailUpdates"
/>
```

The toolkit still recognizes that native pattern as a switch for wrapper and
auto-ARIA behavior.

### Do I now need `ngxSignalFormControl="switch"` for every switch?

No.

For a real native checkbox with `role="switch"`, the directive is optional.
Use the directive when you want explicit semantics, preset-driven defaults, or
the bound host is a custom/third-party control where the toolkit should not
have to guess.

### When do the new directives actually become useful?

They are mainly for advanced cases:

- custom hosts such as `<my-switch [formField]="..."></my-switch>`
- third-party widgets whose control family is not obvious from the bound host
- widgets that should opt into manual ARIA ownership
- cases where a whole feature should inherit preset semantics for sliders,
  composites, or switches

### Is this more boilerplate for the normal case?

No. The normal native switch case stays on the low-boilerplate path.

The new APIs are there so custom and third-party controls can become more
predictable without forcing extra ceremony onto native controls.

### focusBoundControl() and Focus

Angular's `focusBoundControl()` calls the `focus()` method on your custom control. The toolkit's `focusFirstInvalid()` and error-summary entries rely on this:

```typescript
// Angular calls your control's focus() method:
field().focusBoundControl();

// This works because your control implements:
focus(): void {
  this.#el.nativeElement.focus();
}
```

**If your custom control does not implement `focus()`**, these toolkit features will silently skip it:

- `focusFirstInvalid()` will not focus the control
- Error summary entry `focus()` will not navigate to the field
- Auto-ARIA `focusBoundControl()` calls will have no effect

### formFieldBindings

Angular's `formFieldBindings` signal tracks which `FormField` directives are bound to a field. Custom controls interact with this through the standard `[formField]` binding:

```html
<app-custom-datepicker [formField]="form.birthDate" />
```

The toolkit reads `formFieldBindings` internally for ARIA association and focus management.

### Warning Rendering in Custom Controls

Angular Signal Forms has no native warning concept. The toolkit uses a `warn:` prefix convention on error kinds. Custom controls should render warnings when using the toolkit:

```html
<app-custom-field [formField]="form.password">
  <!-- The toolkit's error component handles warnings automatically -->
  <ngx-form-field-error [formField]="form.password" fieldName="password" />
</app-custom-field>
```

Or with headless primitives:

```html
<div
  ngxHeadlessErrorState
  #errorState="errorState"
  [field]="form.password"
  fieldName="password"
>
  <app-custom-field [formField]="form.password" />

  @if (errorState.shouldShowWarnings() && errorState.hasWarnings()) {
  <div role="status" aria-live="polite">
    @for (warning of errorState.resolvedWarnings(); track warning.kind) {
    <span>{{ warning.message }}</span>
    }
  </div>
  }
</div>
```

### Publishing visibility for a custom standalone error surface

Both snippets above render **without** `<ngx-form-field-wrapper>` — the
bound control and the error/warning surface are siblings, not
ancestor/descendant. `NgxSignalFormAutoAria` normally learns a field's
resolved `strategy`/`warningStrategy` from `NgxFieldIdentity`, but that
service is only provided by `NgxFormFieldWrapper`, so a wrapper-less
surface has no DI path to publish an override through — and without one,
`aria-describedby` falls back to the ambient form context, which can
disagree with whatever the surface actually renders (a dangling id, or a
rendered-but-unreferenced region).

If your custom surface resolves error/warning visibility independently
(the way the snippets above do via `ngxHeadlessErrorState` or
`ngx-form-field-error`), register it with
`NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY` so auto-ARIA can read the
booleans it already computed instead of recomputing — and possibly
disagreeing with — its own cascade. The registry is provided by
`NgxSignalForm` at the `[ngxSignalForm]` host, so it is available
anywhere inside that form:

```ts
import { effect, inject } from '@angular/core';
import { NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY } from '@ngx-signal-forms/toolkit';

@Component({
  /* ... */
})
export class MyStandaloneErrorSurface {
  readonly #registry = inject(NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY, {
    optional: true,
  });

  // Whatever already gates your rendered live regions — e.g. an
  // `ngxHeadlessErrorState` view child's `shouldShowErrors`/
  // `shouldShowWarnings`, or your own computed signals.
  protected readonly errorVisible = /* ... */;
  protected readonly warningVisible = /* ... */;

  constructor() {
    effect((onCleanup) => {
      const fieldName = this.resolvedFieldName();
      if (!this.#registry || fieldName === null) return;

      const unregister = this.#registry.register({
        fieldName,
        errorContainerVisible: this.errorVisible,
        warningContainerVisible: this.warningVisible,
      });
      onCleanup(unregister);
    });
  }
}
```

Register the exact booleans you already used to decide whether your
`${fieldName}-error` / `${fieldName}-warning` elements are in the DOM —
not a strategy for auto-ARIA to re-resolve — so the published value can
never drift from what your surface actually renders. `NgxFormFieldError`
follows this same pattern; see `packages/toolkit/assistive/form-field-error.ts`
for the reference implementation.

## Field identity: `id` and `fieldName`

The toolkit's auto-ARIA wiring builds stable `"<field>-error"` and
`"<field>-warning"` IDs from either the wrapper's `fieldName` input or the
projected control's `id` attribute. For custom and third-party controls,
**one of these must resolve to a non-empty string** for `aria-describedby`
linkage to work.

Missing identity is handled **gracefully rather than fatally**:

- `resolvedFieldName()`, `errorId()`, and `warningId()` return `null`.
- The wrapper, error component, and headless directives skip their
  `aria-describedby` / ID wiring for that field — no unstable `"-error"`
  fragments, no runtime exceptions.
- In development mode, the headless field-name directive emits a one-shot
  `console.error` naming the missing input so the misconfiguration is
  easy to spot.

This is a resilience fallback, not a supported mode. Production accessibility
still depends on a stable field identity — always provide either `[fieldName]`
on the wrapper or an `id` on the bound control:

```html
<!-- Recommended for custom controls: give the host a stable id -->
<ngx-form-field-wrapper [formField]="form.country">
  <label for="country">Country</label>
  <app-custom-select id="country" [formField]="form.country" />
</ngx-form-field-wrapper>

<!-- Or: name the wrapper explicitly when the control can't expose an id -->
<ngx-form-field-wrapper [formField]="form.country" fieldName="country">
  <label>Country</label>
  <app-custom-select [formField]="form.country" />
</ngx-form-field-wrapper>
```

### If the wrapper is your own

Both options above are inputs on `ngx-form-field-wrapper`. A wrapper **you**
wrote has neither: auto-ARIA on the projected control resolves the name from
the control's `id` and never asks your component, so a widget that generates
its own inner `id` produces `pn_id_42-error` while your wrapper renders
`country-error`. Nothing errors — `aria-describedby` simply points at an
element that does not exist.

Declare the name on your wrapper's host instead:

```typescript
import { NgxFieldIdentityProvider } from '@ngx-signal-forms/toolkit';

@Component({
  selector: 'my-field',
  hostDirectives: [
    { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
  ],
})
export class MyField {}
```

The directive provides `NgxFieldIdentity` on that host element, which is the
element injector your projected control resolves through. It is selectorless
on purpose — host placement is load-bearing, and a selector would invite
putting it somewhere that silently does nothing.

It publishes the **field name only**. Hint ids keep flowing through
`NGX_SIGNAL_FORM_HINT_REGISTRY` and display timing through
`NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY`, so adopting it for the name does
not disturb the rest of your wrapper.

Full contract in [`CUSTOM_WRAPPERS.md`](./CUSTOM_WRAPPERS.md); runnable
version in the
[`field-identity` demo](https://ngx-signal-forms.github.io/ngx-signal-forms/form-field-wrapper/field-identity/).

## Custom Control Checklist

When building custom controls that work with the toolkit:

- [ ] Implement `FormValueControl<T>`, `FormCheckboxControl`, or `FormUiControl`
- [ ] Expose the contract's required model — `readonly value = model<T>(...)` for
      `FormValueControl<T>`, `readonly checked = model(false)` for
      `FormCheckboxControl` (never define both on the same control)
- [ ] Implement `focus()` method for `focusBoundControl()` support
- [ ] Emit an optional `touch = output()` on blur for strategy-aware error visibility
- [ ] Update the `value`/`checked` model signal on user interaction so the bound field stays in sync
- [ ] Accept `disabled` and `invalid` signal inputs for state reflection
- [ ] Use `[formField]` directive binding (not manual wiring)
- [ ] Test that `focusFirstInvalid()` reaches your control
- [ ] Expose a stable `id` on the host (or set `fieldName` on the wrapper) so ARIA IDs resolve
- [ ] Field-shaped combobox / closed select: keep the trigger naked, use `input-like`, inherit `--ngx-form-field-input-*` (and outline aliases) plus `--ngx-form-field-placeholder-color`
- [ ] Widget-shaped slider / datepicker / composite: use `appearance="plain"` and do not restyle as a text field

## Example: Complete Custom Select

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
      [id]="selectId()"
      [value]="value()"
      (change)="value.set(select.value)"
      (blur)="touch.emit()"
      [disabled]="disabled()"
      [attr.aria-invalid]="invalid() ? 'true' : null"
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
  readonly disabled = input<boolean>(false);
  readonly invalid = input<boolean>(false);

  readonly value = model('');
  readonly touch = output();

  focus(): void {
    this.#select().nativeElement.focus();
  }
}
```

Usage with toolkit:

```html
<form [formRoot]="myForm" ngxSignalForm errorStrategy="on-touch">
  <ngx-form-field-wrapper [formField]="myForm.country">
    <label for="country-select">Country</label>
    <app-custom-select
      [selectId]="'country-select'"
      [formField]="myForm.country"
      [options]="countries"
    />
  </ngx-form-field-wrapper>
</form>
```

## Adapting an Existing Third-Party Widget

Everything above builds a control **from scratch**. This section is the
other case: you already have a widget — a datepicker, a rich-text editor, a
combobox — with its own value/change API, and you need a thin
`FormValueControl<T>` adapter around it rather than a new control.

**Runnable reference:** the custom-controls demo's "Date of Birth" field —
`apps/demo/src/app/shared/controls/legacy-datepicker-adapter.ts`, wrapping a
self-contained fake "legacy" datepicker widget
(`legacy-datepicker-widget.ts`) that has no Signal Forms awareness at all.
See that adapter's class-level doc comment for the full design writeup; this
section summarizes the four decisions it makes.

### 1. Value round-trip and type mismatch

The widget almost never speaks your model's type. Ours exposes a raw string
(`YYYY-MM-DD`, or garbage while the user is mid-typo); the field needs
`Date | null`. Use Angular Signal Forms' `transformedValue()` to own that
boundary in one place:

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

`parse` runs on every widget change event; `format` runs whenever `value`
changes from outside — including a programmatic `form().reset()` — so the
widget always redisplays what the model actually holds.

### 2. Touched propagation without a single native blur

Third-party widgets are often composites: a text input plus a trigger
button plus a popup with its own focusable elements (segments, calendar
days, list options). A plain `(blur)` on the widget's internal input fires
every time focus hops between those pieces — long before the user is done
with the widget as a whole.

Listen for `(focusout)` on the **adapter's own host** instead, and only
treat it as "the user left the control" when the newly focused element
(`event.relatedTarget`) is not contained anywhere inside that host:

```typescript
protected onHostFocusOut(event: FocusEvent): void {
  const related = event.relatedTarget;
  const relatedNode = related instanceof Node ? related : null;
  if (relatedNode === null || !this.#host.nativeElement.contains(relatedNode)) {
    this.touch.emit();
  }
}
```

This fires exactly once, whichever internal element focus was on when it
finally left — including out of a native `<dialog>` popup, which stays in
the same DOM subtree (so `contains()` still sees it) even while promoted to
the browser's top layer.

### 3. Where ARIA lands

If the widget renders its own internal `<input>`, that input — not the
adapter's host element — is the thing screen readers care about. Pair the
adapter with `ngxSignalFormControlAria="manual"` and `appearance="plain"` so
the wrapper still supplies the label, hint, and error content, and forward
`aria-describedby` / `aria-invalid` / `aria-required` down onto the widget's
real input through whatever passthrough inputs the widget exposes:

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

Because the adapter's host is not the focusable element, `id` cannot live on
that host — use `fieldName` on the wrapper (as above) instead of an `id`
attribute, and forward the same identifier into the widget as its internal
input's real `id`. This is the same "control can't expose an id" pattern
from [Field identity: `id` and `fieldName`](#field-identity-id-and-fieldname)
above, applied to a composite host. If the real widget you're wrapping
doesn't expose an ARIA passthrough at all, you don't get this choice — fall
back to whatever ARIA surface it does own, or treat the gap as a defect to
raise with the widget's maintainers.

### 4. Parse/invalid-input path

Report unparseable or partial input as a `kind: 'parse'` validation error —
the same built-in kind `transformedValue`'s own reference example uses, and
one the toolkit's `resolveErrorMessage` already renders through the normal
error surface with no extra wiring:

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

Because `transformedValue` is called inside the component bound via
`[formField]`, that error is reported to the nearest field automatically —
no manual `errors` input wiring required.

## Related

- [Angular Signal Forms API](https://angular.dev/api/forms/signals)
- [Angular Public API Policy](./ANGULAR_PUBLIC_API_POLICY.md)
- [Package Architecture](./PACKAGE_ARCHITECTURE.md)
- [Warnings Support](./WARNINGS_SUPPORT.md)
