# Custom Controls with Angular Signal Forms + Toolkit

This guide explains how custom form controls interact with Angular Signal Forms and the `@ngx-signal-forms/toolkit`.

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

## Toolkit Integration

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

Angular Signal Forms has no native warning concept. The toolkit uses a `warning::` prefix convention on error kinds. Custom controls should render warnings when using the toolkit:

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
<form [formRoot]="myForm" ngxSignalForm [errorStrategy]="'on-touch'">
  <ngx-signal-form-field-wrapper
    [formField]="myForm.country"
    fieldName="country"
    label="Country"
  >
    <app-custom-select [formField]="myForm.country" [options]="countries" />
  </ngx-signal-form-field-wrapper>
</form>
```

## Related

- [Angular Signal Forms Overview](./Angular%20Signal%20Forms%20Overview.md)
- [Package Architecture](./PACKAGE_ARCHITECTURE.md)
- [Warnings Support](./WARNINGS_SUPPORT.md)
