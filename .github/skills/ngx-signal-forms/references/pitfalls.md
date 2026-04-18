# Common Pitfalls

Mistakes that recur when using Angular Signal Forms and `@ngx-signal-forms/toolkit`.

## Signal Calls

| Wrong                          | Correct                      |
| ------------------------------ | ---------------------------- |
| `form.email.invalid()`         | `form.email().invalid()`     |
| `form.email.touched()`         | `form.email().touched()`     |
| `form().email.errors()`        | `form.email().errors()`      |
| `debugger [formTree]="form()"` | `debugger [formTree]="form"` |

Field accessors are signals — always call them: `form.email()` returns the field state, then `.invalid()` reads from it.

## Signal Forms Has No `untouched()` or `pristine()`

```typescript
// Wrong
form.email().untouched();
form.email().pristine();

// Correct
!form.email().touched();
!form.email().dirty();
```

## Submit Events — Use Native DOM Not ngSubmit

```html
<!-- Wrong -->
<form (ngSubmit)="save()">
  <!-- Correct with [formRoot] (preferred) -->
  <form [formRoot]="myForm">
    <!-- Correct without [formRoot] -->
    <form (submit)="save($event)" novalidate></form>
  </form>
</form>
```

With `[formRoot]`, configure submission in `form()` options. Without it, always call `event.preventDefault()`.

## Value Resets

`form.reset()` resets control state (touched, dirty, submitted) but NOT values:

```typescript
// Wrong — doesn't clear input values
this.myForm().reset();

// Correct
this.myForm().reset();
this.#model.set(initialValue);
```

## Immutable Array Updates

```typescript
// Wrong — mutates signal state directly
this.#model().items.push(newItem);

// Correct
this.#model.update((d) => ({ ...d, items: [...d.items, newItem] }));
```

## Import Location Mismatch

```typescript
// Wrong — importing form-field from root
import { NgxFormField } from '@ngx-signal-forms/toolkit';

// Correct
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
import { NgxHeadlessToolkit } from '@ngx-signal-forms/toolkit/headless';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';
```

## ARIA — Never Manual on Toolkit-Managed Controls

```html
<!-- Wrong — toolkit auto-ARIA already manages these -->
<input [formField]="form.email" aria-invalid="true" aria-required="true" />

<!-- Correct — let NgxSignalFormAutoAria handle it -->
<input id="email" [formField]="form.email" />
```

Only add ARIA manually for headless usage where you control the markup explicitly.

If you explicitly opt a control into `ngxSignalFormControlAria="manual"`, the
toolkit preserves your existing ARIA attributes instead of generating them.

## Wrapper Identity — Always Provide `id`

```html
<!-- Wrong — wrapper can't derive field identity -->
<ngx-signal-form-field-wrapper [formField]="form.email">
  <label>Email</label>
  <input [formField]="form.email" />
</ngx-signal-form-field-wrapper>

<!-- Correct — id enables automatic error/label linkage -->
<ngx-signal-form-field-wrapper [formField]="form.email">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field-wrapper>
```

## Removed / Non-Public APIs — Never Use

These were removed or are not public:

| Removed                        | Use Instead                           |
| ------------------------------ | ------------------------------------- |
| `'manual'` strategy            | `showErrors()` + manual signal        |
| `computeShowErrors()`          | `showErrors()`                        |
| `createShowErrorsSignal()`     | `showErrors()`                        |
| `canSubmit()`                  | `canSubmitWithWarnings()`             |
| `isSubmitting()`               | `submittedStatus()` from `[formRoot]` |
| `fieldNameResolver` config     | Provide `id` on bound control         |
| `strictFieldResolution` config | Removed — strict by default           |

## Renamed — Update the Name, Same Behavior

These still exist under a new name:

| Old                     | New                    |
| ----------------------- | ---------------------- |
| `appearance="standard"` | `appearance="stacked"` |
| `appearance="bare"`     | `appearance="plain"`   |

## Floating Labels Require a Placeholder Space

```html
<!-- Wrong — label won't float upward -->
<input id="email" [formField]="form.email" />

<!-- Correct — single space placeholder triggers float animation -->
<input id="email" [formField]="form.email" placeholder=" " />
```

Required only for `appearance="outline"` (floating label behavior).

## Angular Template Binding — Prefer Static Attributes for Literal Strings

```html
<!-- Wrong — Angular parses this as an expression, not a string literal -->
<ngx-signal-form-field-wrapper [strategy]="on-submit"
  >...</ngx-signal-form-field-wrapper
>

<!-- Correct — use a plain attribute for literal values -->
<ngx-signal-form-field-wrapper strategy="on-submit"
  >...</ngx-signal-form-field-wrapper
>
```

For literal string inputs, prefer the plain attribute form because it is shorter
and easier to scan. Use property binding only when the value comes from a real
template expression. In skill docs and examples, prefer the plain attribute form
for static strings so the canonical pattern stays obvious.

## Switch Semantics — Use a Real Switch, Not Just Switch Styling

```html
<!-- Wrong — visually switch-like, but still just a plain checkbox semantic -->
<input id="emailUpdates" type="checkbox" [formField]="form.emailUpdates" />

<!-- Correct — native checkbox plus real switch semantics -->
<input
  id="emailUpdates"
  type="checkbox"
  role="switch"
  [formField]="form.emailUpdates"
/>
```

Use a native checkbox with `role="switch"` on the actual bound control when the
UI is conceptually an on/off switch. This preserves native keyboard behavior and
lets toolkit auto-ARIA opt the control back in.

For custom controls or fallback-free wrapper behavior, prefer the explicit
semantics directive as well:

```html
<input
  id="emailUpdates"
  type="checkbox"
  role="switch"
  ngxSignalFormControl="switch"
  [formField]="form.emailUpdates"
/>
```

## Standalone Imports — Parent Imports Do Not Flow Into Child Templates

```typescript
// Wrong mental model
// Importing NgxSignalFormToolkit in the parent component does NOT make
// NgxSignalFormAutoAria available inside a child custom control template.

// Correct
@Component({
  imports: [FormField, NgxSignalFormToolkit],
  template: `<input [formField]="field()" role="switch" type="checkbox" />`,
})
export class SwitchControlComponent {}
```

## Custom Controls — Declare Semantics to Avoid Layout Heuristics

Without `ngxSignalFormControl`, the wrapper must infer the control kind from DOM heuristics. This can produce wrong wrapper layout (e.g., outlined text-field chrome around a slider) or suppress auto-ARIA for valid switch controls.

```html
<!-- Wrong — wrapper guesses control kind from DOM, may get layout wrong -->
<ngx-signal-form-field-wrapper appearance="plain" [formField]="form.rating">
  <label for="rating">Rating</label>
  <ngx-rating-control id="rating" [formField]="form.rating" />
</ngx-signal-form-field-wrapper>

<!-- Correct — explicit semantics give the wrapper stable contract -->
<ngx-signal-form-field-wrapper appearance="plain" [formField]="form.rating">
  <label for="rating">Rating</label>
  <ngx-rating-control
    id="rating"
    [ngxSignalFormControl]="{ kind: 'slider', layout: 'stacked' }"
    [formField]="form.rating"
  />
</ngx-signal-form-field-wrapper>
```

When multiple controls in a component use the same semantics, use `provideNgxSignalFormControlPresetsForComponent()` to set defaults once instead of repeating the object on every control.

Angular standalone imports are template-local. If the real `[formField]` host
element lives inside `SwitchControlComponent`, that component needs the toolkit
import in its own `imports` array.

The same rule applies to `ngxSignalFormControl`: import the toolkit bundle or
directive in the component that renders the actual control host.

## Nested Custom Controls May Need Explicit `fieldName`

```html
<!-- Fragile — wrapper relies on discovering identity from nested markup timing -->
<ngx-signal-form-field-wrapper [formField]="form.emailUpdates">
  <label for="emailUpdates">Email updates</label>
  <app-switch-control inputId="emailUpdates" [field]="form.emailUpdates" />
</ngx-signal-form-field-wrapper>

<!-- Safer for nested/dynamic controls -->
<ngx-signal-form-field-wrapper
  [formField]="form.emailUpdates"
  fieldName="emailUpdates"
>
  <label for="emailUpdates">Email updates</label>
  <app-switch-control inputId="emailUpdates" [field]="form.emailUpdates" />
</ngx-signal-form-field-wrapper>
```

When the actual bound control is nested inside a custom component or its `id` is
resolved dynamically, pass `fieldName` explicitly on the wrapper to keep error
IDs and described-by wiring deterministic.

## Error Strategy `'on-submit'` Without `[formRoot]`

```html
<!-- Wrong — no submitted status source, errors never show -->
<form (submit)="save($event)" novalidate>
  <ngx-signal-form-field-wrapper [formField]="form.email" strategy="on-submit"
    >...</ngx-signal-form-field-wrapper
  >
</form>

<!-- Correct — [formRoot] provides submittedStatus context -->
<form [formRoot]="form" ngxSignalForm errorStrategy="on-submit">...</form>
```

## Standalone `showErrors('on-submit')` Without `submittedStatus`

```typescript
// Wrong — silently never shows errors. Dev mode logs a one-shot
// console.warn('[ngx-signal-forms] showErrors(...) called with strategy "on-submit"...').
const visible = showErrors(form.email, 'on-submit');

// Correct — pass the submitted-status signal explicitly
const visible = showErrors(form.email, 'on-submit', () => submittedStatus());
```

Inside `form[formRoot][ngxSignalForm]` the wrapper, auto-ARIA, and headless
directives inherit `submittedStatus` from the form context automatically — this
pitfall only applies to standalone callers of `showErrors()` or
`createShowErrorsComputed()` outside that context (custom utilities,
hand-rolled components, services). Either pass the status, or move the work
inside the form context so inheritance can do it for you.
