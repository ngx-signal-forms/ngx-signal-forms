# Custom Controls with Angular Signal Forms + Toolkit

This guide explains how custom form controls interact with Angular Signal Forms and the `@ngx-signal-forms/toolkit`.

## When to read this guide

Most toolkit users do **not** need the APIs described here.

If your form uses native inputs, textareas, selects, and standard wrapper
usage, the toolkit defaults are usually enough and you can skip this guide.

Reach for this guide when you are working with:

- custom controls that implement Angular Signal Forms control interfaces
- switch-style toggles that are more than a plain checkbox row
- slider or composite widgets
- third-party controls that already own some or all ARIA attributes
- cases where wrapper layout or auto-ARIA should follow an explicit control family instead of toolkit heuristics

In short: this is mostly an **edge-case / custom-control integration guide**,
not a baseline requirement for ordinary forms.

## Angular Control Interfaces

Angular Signal Forms provides three interfaces for custom controls:

| Interface             | Use Case                                              |
| --------------------- | ----------------------------------------------------- |
| `FormValueControl<T>` | Text-like inputs (input, textarea, custom editors)    |
| `FormUiControl`       | UI-only controls (no value, just focus/state/display) |
| `FormCheckboxControl` | Toggle/checkbox-like inputs                           |

### FormValueControl\<T\>

The primary interface for custom controls that read and write a value:

```typescript
@Directive({
  selector: '[appCustomInput]',
  host: {
    '(input)': 'onChange($event.target.value)',
    '(blur)': 'onTouched()',
  },
})
export class CustomInputDirective implements FormValueControl<string> {
  readonly #el = inject(ElementRef<HTMLInputElement>);

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.#el.nativeElement.value = value ?? '';
  }

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
    '(change)': 'onChange($event.target.checked)',
    '(blur)': 'onTouched()',
  },
})
export class CustomToggleDirective implements FormCheckboxControl {
  readonly #el = inject(ElementRef<HTMLInputElement>);

  onChange: (value: boolean) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: boolean): void {
    this.#el.nativeElement.checked = value;
  }

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

- **auto** (default) for native-like controls that should inherit toolkit ARIA
- **manual** when the widget already owns its ARIA attributes and described-by chain

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

For native controls and simple wrapper usage, you normally do **not** need
`ngxSignalFormControl`, `ngxSignalFormControlAria="manual"`, or preset
providers. Those APIs are for the cases where the toolkit cannot safely infer
the desired control family or ARIA ownership from ordinary markup.

### Standalone imports are template-local

When a custom control renders the actual `[formField]` host element inside its
own template, import the toolkit auto-ARIA support in that **same standalone
component**.

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
- `NgxSignalFormAutoAriaDirective` when you only need auto-ARIA on the leaf
  control

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
  <ngx-signal-form-error [formField]="form.password" fieldName="password" />
</app-custom-field>
```

Or with headless primitives:

```html
<div
  ngxSignalFormHeadlessErrorState
  #errorState="errorState"
  [field]="form.password"
  fieldName="password"
>
  <app-custom-field [formField]="form.password" />

  @if (errorState.showWarnings() && errorState.hasWarnings()) {
  <div role="status" aria-live="polite">
    @for (warning of errorState.resolvedWarnings(); track warning.kind) {
    <span>{{ warning.message }}</span>
    }
  </div>
  }
</div>
```

## Custom Control Checklist

When building custom controls that work with the toolkit:

- [ ] Implement `FormValueControl<T>`, `FormCheckboxControl`, or `FormUiControl`
- [ ] Implement `focus()` method for `focusBoundControl()` support
- [ ] Call `onTouched()` on blur for strategy-aware error visibility
- [ ] Call `onChange()` on value change for reactive model updates
- [ ] Accept `disabled` and `invalid` signal inputs for state reflection
- [ ] Use `[formField]` directive binding (not manual wiring)
- [ ] Test that `focusFirstInvalid()` reaches your control

## Example: Complete Custom Select

```typescript
@Component({
  selector: 'app-custom-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <select
      #select
      (change)="onChange(select.value)"
      (blur)="onTouched()"
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

  readonly options = input<{ value: string; label: string }[]>([]);
  readonly disabled = input<boolean>(false);
  readonly invalid = input<boolean>(false);

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.#select().nativeElement.value = value ?? '';
  }

  focus(): void {
    this.#select().nativeElement.focus();
  }
}
```

Usage with toolkit:

```html
<form [formRoot]="myForm" ngxSignalForm errorStrategy="on-touch">
  <ngx-signal-form-field-wrapper [formField]="myForm.country">
    <label for="country">Country</label>
    <app-custom-select [formField]="myForm.country" [options]="countries" />
  </ngx-signal-form-field-wrapper>
</form>
```

## Related

- [Angular Signal Forms API](https://angular.dev/api/forms/signals)
- [Angular Public API Policy](./ANGULAR_PUBLIC_API_POLICY.md)
- [Package Architecture](./PACKAGE_ARCHITECTURE.md)
- [Warnings Support](./WARNINGS_SUPPORT.md)
