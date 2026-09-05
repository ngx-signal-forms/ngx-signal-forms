# Signal Forms

Signal Forms are stable in Angular v22 and experimental in v21. Prefer them for new v22+ applications. Preserve an existing application's form strategy unless the user authorizes a migration.

This repository owns this reference. The API details below were checked against installed Angular 22.1.4 declarations in `@angular/forms/types/signals.d.ts` and `_structure-chunk.d.ts`. Check the installed version before applying them elsewhere.

## Imports

You can import the following from `@angular/forms/signals`:

```ts
import {
  form,
  FormField,
  FormRoot,
  submit,
  // Rules for field state
  disabled,
  hidden,
  readonly,
  debounce,
  // Schema helpers
  applyWhen,
  applyEach,
  schema,
  // Custom validation
  validate,
  validateAsync,
  validateHttp,
  validateStandardSchema,
  // Metadata
  metadata,
} from '@angular/forms/signals';
```

## Creating a form

Use `form()` with a writable signal model. Its structure follows the model. Create it in an injection context, such as a component field initializer, or pass an `injector` in the form options.

Use `''` for an empty native text input, `false` for a checkbox, and `[]` for a multi-select. Native number inputs support `number | null`. Native date inputs support `string`, `Date`, or `number` models, including nullable date/numeric values. Choose a representation deliberately; `null` is not a valid replacement for `''` on a native text input.

```ts
import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-profile',
  imports: [FormField],
  template: `
    <label>Name <input [formField]="userForm.name" /></label>
    <label>Age <input type="number" [formField]="userForm.age" /></label>
    <label
      >Birthday <input type="date" [formField]="userForm.birthday"
    /></label>
  `,
})
export class Example {
  protected readonly userModel = signal({
    name: '',
    email: '',
    age: null as number | null,
    birthday: null as Date | null,
    address: {
      street: '',
      city: '',
    },
    hobbies: [] as string[],
  });

  protected readonly userForm = form(this.userModel);
}
```

## Validation

Import validators from `@angular/forms/signals`.

```ts
import {
  required,
  email,
  min,
  max,
  minLength,
  maxLength,
  pattern,
} from '@angular/forms/signals';
```

Use them in the schema function passed to `form()`. In Angular 22.1, standard validators accept `when`, including `email`, `pattern`, `min`, `max`, date limits, and length limits. `validateAsync` and `validateHttp` also accept `when`. For older versions, check their declarations or group rules with `applyWhen`.

The following fragment belongs in a component with the model fields shown:

```ts
protected readonly userModel = signal({
  name: '', email: '', age: null as number | null,
  password: '', description: '', zipCode: '', checkZip: false,
});

protected readonly userForm = form(this.userModel, (schemaPath) => {
  // Required
  required(schemaPath.email, { message: 'Email is required' });

  // Conditional required.
  required(schemaPath.name, {
    when({ valueOf }) {
      return (valueOf(schemaPath.age) ?? 0) > 10;
    },
  });

  // Email
  email(schemaPath.email, { message: 'Invalid email' });

  // Min/Max for numbers
  min(schemaPath.age, 18);
  max(schemaPath.age, 100);

  // MinLength/MaxLength for strings/arrays
  minLength(schemaPath.password, 8);
  maxLength(schemaPath.description, 500);

  // Pattern (Regex)
  pattern(schemaPath.zipCode, /^\d{5}$/, {
    when: ({ valueOf }) => valueOf(schemaPath.checkZip),
  });
});
```

## FieldTree, FieldState, and FormField

- `FieldTree<T>` is the callable tree returned by `form()`. Navigate its properties to reach child fields.
- `FieldState<T>` is the state returned when you call a field. Read signals such as `valid()` and `touched()` there.
- `FormField<T>` is the directive imported for `[formField]`. It binds a field to a UI control; it is not the form tree.

**RULE**: You must **CALL** a field as a function to access its state signals (valid, touched, dirty, hidden, etc.).

```ts
// f is a FieldTree.
const f = form(signal({ cat: { name: 'pirojok-the-cat', age: 5 } }));

f.cat.name; // Child FieldTree
f.cat.name.touched(); // ERROR: touched() does not exist on FieldTree

f.cat.name(); // FieldState: Calling it gives you access to signals
f.cat.name().touched(); // VALID: Accessing the signal
f.cat().name.touched(); // ERROR: f.cat() is state, it doesn't have children!
```

Similarly in a template:

```html
<!-- WRONG: Property 'hidden' does not exist on type 'FieldTree' -->
@if (bookingForm.hotelDetails.hidden()) { ... }

<!-- RIGHT: Call it first -->
@if (bookingForm.hotelDetails().hidden()) { ... }
```

## Disabled, readonly, and hidden

Control field status using rules in the schema.

```ts
import { disabled, readonly, hidden } from '@angular/forms/signals';

protected readonly userModel = signal({
  password: '', createAccount: false, shippingAddress: '',
  sameAsBilling: true, username: '',
});

protected readonly userForm = form(this.userModel, (schemaPath) => {
  // Conditionally disabled
  disabled(schemaPath.password, {
    when: ({ valueOf }) => !valueOf(schemaPath.createAccount),
  });

  // Conditionally hidden (does NOT remove from model, just marks as hidden)
  hidden(schemaPath.shippingAddress, {
    when: ({ valueOf }) => valueOf(schemaPath.sameAsBilling),
  });

  // Readonly
  readonly(schemaPath.username);
});
```

## Binding

Import `FormField` and use the `[formField]` directive.

```ts
import { FormField } from '@angular/forms/signals';
```

`FormField` synchronizes the value and supported control properties, including `disabled`, `readonly`, constraints, and `name`. Let it manage these bindings.

`hidden()` changes form participation but does not remove native controls from the DOM. Wrap native fields and their labels/feedback in `@if (!field().hidden())`. A custom control that declares a `hidden` input receives the state and must implement its own hiding behavior, or its parent must use `@if`.

**CRITICAL: FORBIDDEN ATTRIBUTES**
When using `[formField]`, you MUST NOT set the following attributes in the template (either static or bound):

- `min`, `max` (Use validators in the schema instead)
- `value`, `[value]`, `[attr.value]` on **text/number/date inputs** (Already handled by `[formField]`)
- `[attr.min]`, `[attr.max]`
- `[disabled]`, `[readonly]` (Already handled by `[formField]`)

Radio inputs need an option `value`. A checkbox binds a boolean through its checked state; it does not need a `value` and cannot represent a string-array selection through `[formField]`.

```html
<!-- CORRECT: value on radio specifies which option this button represents -->
<input type="radio" value="economy" [formField]="bookingForm.package.tier" />

<!-- WRONG: value binding on a regular input -->
<input [value]="someVar" [formField]="form.name" />
```

Do NOT do this: `<input min="1" [formField]>` or `<input [value]="val" [formField]>`.

```html
<!-- Input -->
<input [formField]="userForm.name" />

<!-- Checkbox -->
<input type="checkbox" [formField]="userForm.isAdmin" />

<!-- Select -->
<select [formField]="userForm.country">
  <option value="us">US</option>
</select>

<!-- Array-valued selection -->
<select multiple [formField]="userForm.hobbies">
  <option value="reading">Reading</option>
</select>
```

## Reactive Forms compatibility

Signal Forms use a model signal and `form()`, not `FormBuilder`. Keep `FormControl`, `FormGroup`, and related APIs when maintaining existing Reactive Forms. Migration requires authorization; do not replace a working form strategy as a side effect of another task.

## Accessing State

Each field in the form is a function that returns its state.

```ts
// Access the field by calling it
const emailState = this.userForm.email();

// Value (WritableSignal)
const value = this.userForm().value();

// Validation State (Signals)
const isValid = this.userForm().valid();
const isInvalid = this.userForm().invalid();
const errors = this.userForm().errors(); // Array of errors
const isPending = this.userForm().pending(); // Async validation pending

// Interaction State (Signals)
const isTouched = this.userForm().touched();
const isDirty = this.userForm().dirty();

// Availability State (Signals)
const isDisabled = this.userForm().disabled();
const isHidden = this.userForm().hidden();
const isReadonly = this.userForm().readonly();
```

Call the field before accessing its state. For an array-valued field, read structural `.length` without calling it:

```ts
form().invalid();
form.field().dirty();
form.field.subfield().touched();
form.a.b.c.d().value();
form.address.ssn().pending();
form().reset();

form.children.length;
form.client.addresses.length;
```

`field().reset()` clears touched/dirty state on that field and its descendants without changing the model value. `field().reset(value)` also sets the supplied value. Neither form implies restoring an initial snapshot; retain that snapshot explicitly if needed.

`valid()` is not the inverse of `invalid()`: while validation is pending with no errors, both are false.

## Submitting

For native forms in v22, prefer `<form [formRoot]="userForm">` with `FormRoot` imported and `submission.action` configured in `form()` options. `FormRoot` sets `novalidate`, prevents native submission, and calls `submit()` using that configuration. Do not add a second `(submit)` handler to this pattern. The complete booking example below includes the configuration.

`submit()` marks the submitted field tree as touched. Its action must return `Promise<TreeValidationResult>`, but the function does not need the literal `async` keyword. A resolved result can contain validation errors or indicate success with `null`, `undefined`, or `void`. Map service response payloads to that contract rather than returning arbitrary data.

Submission options in Angular 22.1.4:

| `ignoreValidators`       | Action eligibility                                                      |
| ------------------------ | ----------------------------------------------------------------------- |
| `'pending'`, the default | Blocks on validation errors. Pending validators do not block.           |
| `'none'`                 | Requires all validators to pass. Pending validation blocks the attempt. |
| `'all'`                  | Ignores both invalid and pending validators.                            |

These options gate the attempt; they do not wait for pending validation and retry automatically. Set an explicit policy when async validation must finish before saving. `onInvalid` is optional, for example to focus the first invalid control.

For programmatic submission, use `submit(fieldTree)` with configured options, or pass an action/options explicitly. Both of these action forms are valid when `save()` returns `Promise<void>`:

```ts
import { submit } from '@angular/forms/signals';

onSubmit() {
  return submit(this.userForm, async () => {
    await this.apiService.save(this.userModel());
  });
}

onSubmitWithoutAsyncKeyword() {
  return submit(this.userForm, () => this.apiService.save(this.userModel()));
}
```

## Handling Errors

`field().errors()` returns the errors array of ValidationError:

```ts
interface ValidationError {
  readonly kind: string;
  readonly message?: string;
}
```

For a valid result, validators may return `null`, `undefined`, or `void`. Return an error object such as `{ kind: 'reserved', message: 'Name is reserved' }` for a failure. Use the `error` option for custom errors on standard validators, or `message` for their default error kind; those options are mutually exclusive.

For this repository's warning and feedback policies, follow the `ngx-signal-forms` skill and toolkit documentation. Keep toolkit-specific APIs there rather than duplicating them in this Angular reference.

### Context

Functions passed to rules like `validate()`, `disabled()`, `applyWhen` take a context object. It is **CRITICAL** to understand its structure:

```ts
validate(
  schemaPath.username,
  ({
    value, // Signal<T>: Read the current value
    fieldTree, // ReadonlyFieldTree<T>: Navigate sub-fields
    state, // ReadonlyFieldState<T>: Access state.valid(), state.dirty()
    valueOf, // (path) => T: Read values of OTHER fields (tracking dependencies), e.g. valueOf(schemaPath.password)
    stateOf, // Read another path's readonly state
    pathKeys, // Signal<readonly string[]>: Path from root to this field
  }) => {
    // WRONG: if (touched()) ... (touched is not in context)
    // RIGHT: if (state.touched()) ...

    if (value() === 'admin') {
      return { kind: 'reserved', message: 'Username admin is reserved' };
    }
  },
);
```

### IMPORTANT: Paths are NOT Signals

Inside the `form()` callback, `schemaPath` and its children (e.g., `schemaPath.user.name`) are **NOT** signals and are **NOT** callable.

```ts
// WRONG - This will throw an error:
applyWhen(p.ssn, () => p.ssn().touched(), (ssnField) => { ... });

// RIGHT - Use stateOf() to get the state of a path:
applyWhen(p.ssn, ({ stateOf }) => stateOf(p.ssn).touched(), (ssnField) => { ... });

// RIGHT - Use valueOf() to get the value of a path:
applyWhen(p.ssn, ({ valueOf }) => valueOf(p.ssn) !== '', (ssnField) => { ... });
```

### Multiple Items

- Use `applyEach` for applying rules per item.
- **CRITICAL**: `applyEach` callback takes ONLY ONE argument (the item path), NOT two:

```ts
// CORRECT - single argument
applyEach(s.items, (item) => {
  required(item.name);
});

// WRONG - do NOT pass index
applyEach(s.items, (item, index) => {
  // ERROR: callback takes 1 argument
  required(item.name);
});
```

- In the template use `@for` to iterate over the items.
- For field arrays that can grow, shrink, or reorder, track the field item, such as `@for (item of form.items; track item)`. Reserve `$index` tracking for static collections. Keep an index alias when an action needs the current position.
- To remove an item from an array, just remove appropriate item from the array in the data.
- **`select` binding**: You CAN bind to `<select [formField]="form.country">`. Ensure options have `value` attributes.

### Nested @for Loops

**CRITICAL**: Angular does NOT have `$parent`. In nested loops, store outer index in a variable:

```html
<!-- WRONG - $parent does not exist -->
@for (item of form.items; track $index) { @for (option of item.options; track
$index) {
<button (click)="removeOption($parent.$index, $index)">Remove</button>
<!-- ERROR -->
} }

<!-- CORRECT - use let to store outer index -->
@for (item of form.items; track item; let outerIndex = $index) { @for (option of
item.options; track option) {
<button type="button" (click)="removeOption(outerIndex, $index)">Remove</button>
} }
```

### Submit button state

Keep submit enabled for invalid forms so an attempt can reveal submit-triggered feedback. Disable it while submitting. If the UX must also block clicks during async validation, add `pending()` and configure `ignoreValidators: 'none'` for programmatic attempts too.

```html
<button type="submit" [disabled]="taxForm().submitting()">Submit</button>
<!-- Optional policy: block clicks while validation is pending. -->
<button
  type="submit"
  [disabled]="taxForm().submitting() || taxForm().pending()"
>
  Submit
</button>
```

If you need the invalid flag for feedback, read `taxForm().invalid()`.

On inputs with `[formField]`, configure `disabled()` and `readonly()` in the schema instead of binding those properties again. This restriction does not apply to an internal input without `[formField]` in a custom control.

### Async Validation

Do not use `validate()` for async, instead use `validateAsync()`:

The following imports and component fields demonstrate a resource-backed validator:

**CRITICAL**:

1. The `params` option MUST be a function that returns the value to validate.
2. The `onError` handler is **REQUIRED** - it is NOT optional!

```ts
import { resource, signal } from '@angular/core';
import { form, validateAsync } from '@angular/forms/signals';

protected readonly userModel = signal({ username: '' });

protected readonly userForm = form(this.userModel, (s) => {
  validateAsync(s.username, {
    when: ({ value }) => value().length >= 3,
    debounce: 300,
    // 1. MUST be a function - params takes context and returns the value
    params: ({ value }) => value(),

    // 2. Create the resource - factory receives a Signal
    factory: (username) =>
      resource({
        params: username, // Use 'params' in resource()
        loader: async ({ params: value }) => {
          await new Promise<void>((resolve) => setTimeout(resolve, 1000));
          return value === 'taken';
        },
      }),

    // 3. Map success to errors
    onSuccess: (isTaken) =>
      isTaken
        ? { kind: 'taken', message: 'Username is already taken' }
        : undefined,

    // 4. Handle errors - THIS IS REQUIRED!
    onError: () => ({ kind: 'error', message: 'Validation failed' }),
  });
});
```

**WRONG Examples:**

```ts
// WRONG - params must be a function
validateAsync(s.username, {
  params: s.username, // ERROR: must be ({ value }) => value()
  // ...
});

// WRONG - missing onError (it's required!)
validateAsync(s.username, {
  params: ({ value }) => value(),
  factory: (username) => resource({/* ... */}),
  onSuccess: (result) => (result ? { kind: 'error' } : undefined),
  // ERROR: 'onError' is missing but required!
});
```

### Using Resource

**CRITICAL**: In Angular's `resource()`, use `params` for the input signal.

```ts
// CORRECT
resource({
  params: mySignal,
  loader: async ({ params: value }) => {
    /* ... */
  },
});

// WRONG
resource({
  request: mySignal, // ERROR: should be 'params'
  loader: async ({ request }) => {
    /* ... */
  },
});
```

The async validator's `debounce` option delays the validation operation without delaying model updates. Both `validateAsync` and `validateHttp` support it and `when` in 22.1. Both require `onError`. `validateHttp` uses a `request` callback, while a `resource()` factory uses `params`.

Use the separate `debounce()` form rule only when you intend to delay UI-to-model synchronization. A touch event also flushes the buffered update. `'blur'` delays it until blur:

```ts
import { debounce } from '@angular/forms/signals';

userForm = form(this.userModel, (s) => {
  // Delay model updates by 300ms
  debounce(s.username, 300);
  // Alternative: debounce(s.username, 'blur');
});
```

### Conditional validation

For a single rule, use its supported `{ when }` configuration. Use `applyWhen(path, condition, schemaFn)` to group rules. Its callback receives the path passed as the first argument, not an implicit parent.

```ts
import { signal } from '@angular/core';
import { applyWhen, disabled, form, pattern, required } from '@angular/forms/signals';

protected readonly model = signal({
  createAccount: false,
  status: 'single',
  password: '',
  spouse: { name: '', taxId: '' },
});

protected readonly taxForm = form(this.model, (path) => {
  disabled(path.password, {
    when: ({ valueOf }) => !valueOf(path.createAccount),
  });
  required(path.password, {
    when: ({ valueOf }) => valueOf(path.createAccount),
  });
  applyWhen(path.spouse, ({ valueOf }) => valueOf(path.status) === 'joint', (spouse) => {
    required(spouse.name);
    pattern(spouse.taxId, /^\d{9}$/);
  });
});
```

## Common Pitfalls (DO NOT DO THESE)

| Error Scenario         | WRONG (Common Mistake)                          | RIGHT (Correct Way)                                                                         |
| :--------------------- | :---------------------------------------------- | :------------------------------------------------------------------------------------------ |
| **Accessing Flags**    | `form.field.valid()`                            | `form.field().valid()`                                                                      |
| **Accessing value**    | `form.field.value()`                            | `form.field().value()`                                                                      |
| **Setting value**      | `form.field.set(x)`                             | Update model signal: `this.model.update(...)`                                               |
| **Form root flags**    | `form.invalid()`                                | `form().invalid()`                                                                          |
| **Double-calling**     | `form.field()()`                                | `form.field().value()`                                                                      |
| **Rules Context**      | `({ touched }) => touched()`                    | `({ state }) => state.touched()`                                                            |
| **Calling Paths**      | `applyWhen(p.foo, () => p.foo() === 'x')`       | `applyWhen(p.foo, ({ valueOf }) => valueOf(p.foo) === 'x')`                                 |
| **applyWhen args**     | `applyWhen(condition, () => {...})`             | `applyWhen(path, condition, schemaFn)` - needs 3 args                                       |
| **Array length**       | `form.items().length`                           | `form.items.length` (structural)                                                            |
| **Multi-select array** | `<select [formField]="form.tags">` (string[])   | Use `<select multiple [formField]="form.tags">`                                             |
| **readonly attribute** | `<input readonly [formField]>`                  | Use `readonly()` rule in schema                                                             |
| **min/max attributes** | `<input min="1" max="10">`                      | Use `min()` and `max()` rules in schema                                                     |
| **value binding**      | `<input [value]="val" [formField]="form.name">` | Let `FormField` bind the value; radio options supply their own `value`                      |
| **Conditional rules**  | `disabled(p.x, condition)`                      | Prefer `disabled(p.x, { when: condition })`; standard validators also accept `when` in 22.1 |
| **Submit callback**    | An action returning plain `void`                | Return a Promise, with or without the `async` keyword                                       |
| **Async params**       | `params: s.field`                               | `params: ({ value }) => value()`                                                            |
| **Async onError**      | Omitting `onError`                              | `onError` is REQUIRED in `validateAsync`                                                    |
| **resource() API**     | `request: signal`                               | `params: signal`                                                                            |
| **applyEach args**     | `applyEach(s.items, (item, index) => ...)`      | `applyEach(s.items, (item) => ...)`                                                         |
| **Nested @for**        | `$parent.$index`                                | Use `let outerIndex = $index`                                                               |
| **FormState import**   | `import { FormState }`                          | `FormState` does not exist, use `FieldState`                                                |
| **Native empty value** | `null` for a native text input                  | Use `''` for text; `number \| null` and `Date \| null` work with matching native inputs     |
| **Validate syntax**    | `validate(s.field, { value } => ...)`           | `validate(s.field, ({ value }) => ...)`                                                     |
| **Checkbox Array**     | `[formField]="form.tags"` (string[])            | Checkboxes ONLY bind to `boolean`                                                           |

## Custom controls

Implement `FormValueControl<T>` with a `value` model, or `FormCheckboxControl` with a boolean `checked` model. Use one contract, not both. Emit `touch` on blur, not focus. Forward `focus(options)` to the actual interactive element.

This standalone control implements the text-value contract. Its internal input has no `[formField]`, so the control must forward its value and supported state itself. The parent binds `[formField]` to the component.

```ts
import {
  Component,
  ElementRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

@Component({
  selector: 'app-text-control',
  template: `
    @if (!hidden()) {
      <label>
        {{ label() }}
        <input
          #control
          [value]="value()"
          [name]="name()"
          [disabled]="disabled()"
          [readOnly]="readonly()"
          [required]="required()"
          (input)="value.set(control.value)"
          (blur)="touch.emit()"
        />
      </label>
    }
  `,
})
export class TextControl implements FormValueControl<string> {
  readonly label = input.required<string>();
  readonly value = model('');
  readonly name = input('');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly required = input(false);
  readonly hidden = input(false);
  readonly touch = output<void>();
  private readonly control = viewChild<ElementRef<HTMLInputElement>>('control');

  focus(options?: FocusOptions): void {
    this.control()?.nativeElement.focus(options);
  }
}
```

For a checkbox control, declare `readonly checked = model(false)`, bind `[checked]="checked()"` on its internal checkbox, and update `checked` from the native `change` event. Optional state inputs only reach the internal control if the component forwards them. For composite controls, emit `touch` when focus leaves the whole control, not when it moves between internal elements.

## Complete form example

These two files form a standalone component. Import it into an existing application or use it as the root component. The submission action stores a local snapshot so the example needs no service or backend. Replace that action with the application's save operation when integrating it.

### `src/app/app.ts`

```ts
import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  required,
  email,
  min,
  hidden,
  applyEach,
  validate,
} from '@angular/forms/signals';

@Component({
  selector: 'app-root',
  imports: [FormField, FormRoot, JsonPipe],
  templateUrl: './app.html',
})
export class App {
  protected readonly model = signal({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      age: null as number | null,
    },
    tripDetails: {
      destination: 'Mars',
      launchDate: '',
    },
    package: {
      tier: 'economy',
      extras: [] as string[],
    },
    companions: [] as Array<{ name: string; relation: string }>,
  });

  protected readonly savedBooking = signal<ReturnType<
    typeof this.model
  > | null>(null);

  protected readonly bookingForm = form(
    this.model,
    (s) => {
      required(s.personalInfo.firstName, { message: 'First name is required' });
      required(s.personalInfo.lastName, { message: 'Last name is required' });
      required(s.personalInfo.email, { message: 'Email is required' });
      email(s.personalInfo.email, { message: 'Invalid email address' });
      required(s.personalInfo.age, { message: 'Age is required' });
      min(s.personalInfo.age, 18, { message: 'Must be at least 18' });

      required(s.tripDetails.destination, {
        message: 'Destination is required',
      });
      required(s.tripDetails.launchDate, {
        message: 'Launch date is required',
      });
      validate(s.tripDetails.launchDate, ({ value }) => {
        const date = new Date(value());
        if (isNaN(date.getTime())) return undefined;
        const today = new Date();
        if (date < today) {
          return {
            kind: 'pastDate',
            message: 'Launch date must be in the future',
          };
        }
        return undefined;
      });

      // valueOf is used to access values of other fields in rules
      hidden(s.package.extras, {
        when: ({ valueOf }) => valueOf(s.package.tier) === 'economy',
      });

      applyEach(s.companions, (companion) => {
        required(companion.name, { message: 'Companion name required' });
        required(companion.relation, { message: 'Relation required' });
      });
    },
    {
      submission: {
        ignoreValidators: 'none',
        action: (booking) => {
          this.savedBooking.set(structuredClone(booking().value()));
          return Promise.resolve();
        },
        onInvalid: (booking) => {
          booking().errorSummary()[0]?.fieldTree().focusBoundControl();
        },
      },
    },
  );

  addCompanion() {
    this.model.update((m) => ({
      ...m,
      companions: [...m.companions, { name: '', relation: '' }],
    }));
  }

  removeCompanion(index: number) {
    this.model.update((m) => ({
      ...m,
      companions: m.companions.filter((_, i) => i !== index),
    }));
  }
}
```

### `src/app/app.html`

```html
<form [formRoot]="bookingForm">
  <h1>Interstellar Booking</h1>

  <section>
    <h2>Personal Info</h2>

    <label>
      First Name
      <input [formField]="bookingForm.personalInfo.firstName" />
      @if (bookingForm.personalInfo.firstName().touched() &&
      bookingForm.personalInfo.firstName().errors().length) {
      <span
        >{{ bookingForm.personalInfo.firstName().errors()[0].message }}</span
      >
      }
    </label>

    <label>
      Last Name
      <input [formField]="bookingForm.personalInfo.lastName" />
      @if (bookingForm.personalInfo.lastName().touched() &&
      bookingForm.personalInfo.lastName().errors().length) {
      <span>{{ bookingForm.personalInfo.lastName().errors()[0].message }}</span>
      }
    </label>

    <label>
      Email
      <input type="email" [formField]="bookingForm.personalInfo.email" />
      @if (bookingForm.personalInfo.email().touched() &&
      bookingForm.personalInfo.email().errors().length) {
      <span>{{ bookingForm.personalInfo.email().errors()[0].message }}</span>
      }
    </label>

    <label>
      Age
      <input type="number" [formField]="bookingForm.personalInfo.age" />
      @if (bookingForm.personalInfo.age().touched() &&
      bookingForm.personalInfo.age().errors().length) {
      <span>{{ bookingForm.personalInfo.age().errors()[0].message }}</span>
      }
    </label>
  </section>

  <section>
    <h2>Trip Details</h2>

    <label>
      Destination
      <select [formField]="bookingForm.tripDetails.destination">
        <option value="Mars">Mars</option>
        <option value="Moon">Moon</option>
        <option value="Titan">Titan</option>
      </select>
    </label>

    <label>
      Launch Date
      <input type="date" [formField]="bookingForm.tripDetails.launchDate" />
      @if (bookingForm.tripDetails.launchDate().touched() &&
      bookingForm.tripDetails.launchDate().errors().length) {
      <span
        >{{ bookingForm.tripDetails.launchDate().errors()[0].message }}</span
      >
      }
    </label>
  </section>

  <section>
    <h2>Package</h2>

    <label>
      <input
        type="radio"
        value="economy"
        [formField]="bookingForm.package.tier"
      />
      Economy
    </label>
    <label>
      <input
        type="radio"
        value="business"
        [formField]="bookingForm.package.tier"
      />
      Business
    </label>
    <label>
      <input
        type="radio"
        value="first"
        [formField]="bookingForm.package.tier"
      />
      First Class
    </label>

    @if (!bookingForm.package.extras().hidden()) {
    <div>
      <h3>Extras</h3>
      <!-- Multi-select for arrays must use select multiple -->
      <label for="booking-extras">Select extras</label>
      <select
        id="booking-extras"
        multiple
        [formField]="bookingForm.package.extras"
      >
        <option value="wifi">WiFi</option>
        <option value="gym">Gym</option>
      </select>
    </div>
    }
  </section>

  <section>
    <h2>Companions</h2>
    <button type="button" (click)="addCompanion()">Add Companion</button>

    @for (companion of bookingForm.companions; track companion) {
    <div>
      <label>Name <input [formField]="companion.name" /></label>
      @if (companion.name().touched() && companion.name().errors().length) {
      <span>{{ companion.name().errors()[0].message }}</span>
      }

      <label>Relation <input [formField]="companion.relation" /></label>
      @if (companion.relation().touched() &&
      companion.relation().errors().length) {
      <span>{{ companion.relation().errors()[0].message }}</span>
      }

      <button type="button" (click)="removeCompanion($index)">Remove</button>
    </div>
    }
  </section>

  @if (bookingForm().pending()) {
  <p role="status">Validation is pending. Submit again when it finishes.</p>
  }

  <button type="submit" [disabled]="bookingForm().submitting()">Submit</button>
</form>

@if (savedBooking(); as saved) {
<p role="status">Booking saved.</p>
<pre>{{ saved | json }}</pre>
}
```

## Recovering from Build Errors

If you encounter build errors, here are the most common fixes:

### `Property 'value' does not exist on type 'FieldTree'`

**Problem**: Accessing `.value()` directly on a field without calling it first.

```ts
// WRONG
const val = this.form.field.value();
// RIGHT
const val = this.form.field().value();
```

### `Property 'set' does not exist on type 'FieldTree'`

**Problem**: Trying to set values on the form tree. Signal Forms are model-driven.

```ts
// WRONG
this.form.address.street.set('Main St');
// RIGHT - update the model signal instead
this.model.update((m) => ({
  ...m,
  address: { ...m.address, street: 'Main St' },
}));
```

### `Type 'string[]' is not assignable to type 'string'`

**Problem**: Binding `[formField]` to an array field with a single-value `<select>`.

```html
<!-- WRONG - assignees is string[], select expects string -->
<select [formField]="form.assignees">
  ...
</select>

<!-- RIGHT - Use select multiple for array fields -->
<select multiple [formField]="form.assignees">
  <option value="us">US</option>
</select>
```

### `NG8022: Setting the 'readonly/min/max/value' attribute is not allowed`

**Problem**: Conflict between HTML attributes and `[formField]` directive.

```html
<!-- WRONG -->
<input [formField]="form.age" min="18" max="99" />
<input [formField]="form.name" [value]="'John'" />

<!-- RIGHT - Use rules in schema -->
min(s.age, 18); max(s.age, 99); // Then just:
<input [formField]="form.age" />
```

### `TS2322: Type 'string[]' is not assignable to type 'boolean'`

**Problem**: Binding a checkbox to an array field instead of a boolean field.

```html
<!-- WRONG - tags is string[] -->
<input type="checkbox" [formField]="form.tags" />

<!-- RIGHT - Use select multiple for array values -->
<select multiple [formField]="form.tags">
  <option value="a">A</option>
</select>

<!-- OR - Map to boolean fields in the model -->
protected readonly model = signal({ hasWifi: false, hasGym: false });
<input type="checkbox" [formField]="form.hasWifi" />
```

### `'when' does not exist in type` for a validator

Check the installed version and import source. Angular 22.1 standard validators support `when`; older declarations may differ. Use `applyWhen` to group rules or when the installed validator lacks the option.

```ts
pattern(s.ssn, /^\d{3}-\d{2}-\d{4}$/, {
  when: ({ valueOf }) => valueOf(s.status) === 'joint',
});

// Alternative for grouping rules or older validator configurations.
applyWhen(
  s.ssn,
  ({ valueOf }) => valueOf(s.status) === 'joint',
  (ssnPath) => {
    pattern(ssnPath, /^\d{3}-\d{2}-\d{4}$/);
  },
);
```

### `Expected 3 arguments, but got 2` for applyWhen

**Problem**: Missing the path argument in `applyWhen`.

```ts
// WRONG
applyWhen(isJoint, () => { ... });

// RIGHT - applyWhen(path, condition, schemaFn)
applyWhen(s.spouse, ({valueOf}) => valueOf(s.status) === 'joint', (spousePath) => {
  required(spousePath.name);
});
```

### `Module has no exported member 'FormState'`

**Problem**: Importing a non-existent type.

```ts
// WRONG
import { FormState } from '@angular/forms/signals';

// FormState does not exist. If you need type access, the form
// instance provides all necessary state through field().valid(), etc.
```

### `No pipe found with name 'number'` / `'json'` / `'date'`

Import the matching standalone pipe from `@angular/common` and add it to the component's `imports`: `DecimalPipe` for `number`, `JsonPipe` for `json`, and `DatePipe` for `date`. Keep formatting in the template rather than replacing pipes with ad hoc string formatting.

```ts
import { DatePipe, DecimalPipe, JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-booking-summary',
  imports: [DatePipe, DecimalPipe, JsonPipe],
  template: `
    <p>{{ totalPrice() | number: '1.2-2' }}</p>
    <p>{{ launchDate() | date: 'mediumDate' }}</p>
    <pre>{{ details() | json }}</pre>
  `,
})
export class BookingSummary {
  protected readonly totalPrice = signal(1234.5);
  protected readonly launchDate = signal(new Date());
  protected readonly details = signal({ destination: 'Mars' });
}
```

### `$parent.$index` in nested @for loops

**Problem**: Angular doesn't have `$parent`.

```html
<!-- WRONG -->
@for (item of items; track $index) { @for (sub of item.subs; track $index) {
<button (click)="remove($parent.$index, $index)">X</button>
} }

<!-- RIGHT -->
@for (item of items; track item; let outerIdx = $index) { @for (sub of
item.subs; track sub) {
<button type="button" (click)="remove(outerIdx, $index)">Remove</button>
} }
```
