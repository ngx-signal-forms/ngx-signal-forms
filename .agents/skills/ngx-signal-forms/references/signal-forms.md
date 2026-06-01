# Angular Signal Forms — Base API Quick Reference

The toolkit builds on top of Angular Signal Forms. This reference covers the Angular-native layer that toolkit consumers need.

Angular Signal Forms is available in `@angular/core >= 21.1` and imported from `@angular/forms/signals`.

## Setup

```typescript
import {
  form,
  FormField,
  submit,
  // Validators
  required,
  email,
  minLength,
  maxLength,
  min,
  max,
  pattern,
  disabled,
  readonly,
  hidden,
  // Custom validation
  validate,
  validateHttp,
  customError,
  // Schema composition
  schema,
  apply,
  applyEach,
  applyWhenValue,
  // Standard Schema (Zod, Valibot, etc.)
  validateStandardSchema,
} from '@angular/forms/signals';
```

## Creating a Form

```typescript
readonly #model = signal<MyModel>({ email: '', name: '' });

protected readonly myForm = form(this.#model, (path) => {
  required(path.email);
  email(path.email, { message: 'Enter a valid email address' });
  required(path.name);
  minLength(path.name, 2);
});
```

`this.#model` is the source of truth. `myForm` is a reactive view.

## Template Binding

```html
<!-- Always use novalidate (added automatically by [formRoot]) -->
<form [formRoot]="myForm">
  <input id="email" type="email" [formField]="myForm.email" />
  <input id="name" [formField]="myForm.name" />
  <button type="submit">Submit</button>
</form>
```

## Field State Signals

```typescript
myForm.email(); // field state (call the signal)
myForm.email().valid();
myForm.email().invalid();
myForm.email().touched(); // true after blur
myForm.email().dirty(); // true after value change
myForm.email().pending(); // true during async validation
myForm.email().errors(); // errors on this field only
myForm.email().errorSummary(); // all errors including descendants

// NO untouched() or pristine() — use !touched() and !dirty()

// Programmatic state
myForm.email().markAsTouched();
myForm.email().markAsDirty();
myForm.email().focusBoundControl();
```

## Form-Level State

```typescript
myForm(); // root field state
myForm().valid();
myForm().invalid();
myForm().pending();
myForm().errorSummary(); // all errors in form
myForm().reset(); // resets touched/dirty (NOT values)

// To reset values too:
myForm().reset();
this.#model.set(initialValue);
```

## Form Submission with Toolkit

With `[formRoot]` (recommended):

```typescript
// Declare in form() — submit handler fires automatically
protected readonly myForm = form(this.#model, (path) => {
  required(path.email);
}, {
  submission: {
    action: async () => {
      await api.save(this.#model());
    },
    onInvalid: createOnInvalidHandler(),
  }
});
```

Without `[formRoot]` (fallback):

```typescript
protected async save(event: Event): Promise<void> {
  event.preventDefault();
  await submit(this.myForm, async (formData) => {
    await api.save(formData().value());
    return null; // success
  });
}
```

## Custom Validation

```typescript
// Field-level
validate(path.username, (ctx) => {
  if (ctx.value().includes(' '))
    return customError({ kind: 'no_spaces', message: 'No spaces' });
  return null;
});

// Cross-field
validate(path.confirmPassword, (ctx) => {
  if (ctx.value() !== ctx.valueOf(path.password))
    return customError({ kind: 'mismatch', message: 'Passwords must match' });
  return null;
});

// Async
validateHttp(path.username, {
  request: ({ value }) => (value() ? `/api/users/check/${value()}` : undefined),
  errors: (res) =>
    res.taken
      ? customError({ kind: 'taken', message: 'Username taken' })
      : null,
});
```

## Schema Composition

```typescript
const addressSchema = schema<Address>((path) => {
  required(path.street);
  required(path.city);
});

form(model, (path) => {
  apply(path.address, addressSchema); // static nested object
  applyEach(path.items, itemSchema); // array items
  applyWhenValue(path.payment, isCard, cardSchema); // conditional
});
```

## Dynamic Arrays

```typescript
readonly #data = signal({ items: [{ name: '' }] });
protected readonly myForm = form(this.#data, (path) => {
  applyEach(path.items, (item) => required(item.name));
});

addItem(): void {
  this.#data.update(d => ({ items: [...d.items, { name: '' }] }));
}
removeItem(i: number): void {
  this.#data.update(d => ({ items: d.items.filter((_, j) => j !== i) }));
}
```

## CSS Status Classes (Optional)

Angular Signal Forms does not add classes automatically. To enable them:

```typescript
import {
  provideSignalFormsConfig,
  NG_STATUS_CLASSES,
} from '@angular/forms/signals';

// Preset (ng-valid, ng-invalid, ng-touched, ng-dirty, ng-pending)
provideSignalFormsConfig({ classes: NG_STATUS_CLASSES });

// Custom
provideSignalFormsConfig({
  classes: {
    'is-invalid': (state) => state.invalid() && state.touched(),
    'is-valid': (state) => state.valid() && state.touched(),
  },
});
```

> Toolkit applies ARIA attributes instead of relying on CSS classes for accessibility.

## Custom Controls

Implement `FormValueControl<T>`:

```typescript
@Directive({
  selector: '[myControl]',
  host: { '(input)': 'onChange($event.target.value)', '(blur)': 'onTouched()' },
})
export class MyControlDirective implements FormValueControl<string> {
  readonly #el = inject(ElementRef<HTMLInputElement>);
  onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};
  writeValue(v: string): void {
    this.#el.nativeElement.value = v ?? '';
  }
  focus(): void {
    this.#el.nativeElement.focus();
  }
}
```
