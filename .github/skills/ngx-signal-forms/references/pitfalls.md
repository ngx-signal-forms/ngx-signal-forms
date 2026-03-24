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
import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
import { NgxHeadlessToolkit } from '@ngx-signal-forms/toolkit/headless';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';
```

## ARIA — Never Manual on Toolkit-Managed Controls

```html
<!-- Wrong — toolkit auto-ARIA already manages these -->
<input [formField]="form.email" aria-invalid="true" aria-required="true" />

<!-- Correct — let NgxSignalFormAutoAriaDirective handle it -->
<input id="email" [formField]="form.email" />
```

Only add ARIA manually for headless usage where you control the markup explicitly.

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
| `'bare'` appearance            | `'standard'`                          |
| `computeShowErrors()`          | `showErrors()`                        |
| `createShowErrorsSignal()`     | `showErrors()`                        |
| `canSubmit()`                  | `canSubmitWithWarnings()`             |
| `isSubmitting()`               | `submittedStatus()` from `[formRoot]` |
| `fieldNameResolver` config     | Provide `id` on bound control         |
| `strictFieldResolution` config | Removed — strict by default           |

## Floating Labels Require a Placeholder Space

```html
<!-- Wrong — label won't float upward -->
<input id="email" [formField]="form.email" />

<!-- Correct — single space placeholder triggers float animation -->
<input id="email" [formField]="form.email" placeholder=" " />
```

Required only for `appearance="outline"` (floating label behavior).

## Error Strategy `'on-submit'` Without `[formRoot]`

```html
<!-- Wrong — no submitted status source, errors never show -->
<form (submit)="save($event)" novalidate>
  <ngx-signal-form-field-wrapper
    [formField]="form.email"
    [strategy]="'on-submit'"
    >...</ngx-signal-form-field-wrapper
  >
</form>

<!-- Correct — [formRoot] provides submittedStatus context -->
<form [formRoot]="form" [errorStrategy]="'on-submit'">...</form>
```
