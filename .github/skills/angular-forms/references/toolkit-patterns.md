# @ngx-signal-forms/toolkit Patterns

Enhancement library for Angular Signal Forms. Provides automatic accessibility (ARIA), error display, and form field wrappers. **Always prefer this over manual error/ARIA markup.**

## Table of Contents

- [Setup](#setup)
- [Basic Pattern (Recommended)](#basic-pattern-recommended)
- [Error Display](#error-display)
- [Form Field Wrapper](#form-field-wrapper)
- [Fieldset (Grouped Fields)](#fieldset-grouped-fields)
- [When to Add `[ngxSignalForm]`](#when-to-add-ngxsignalform)
- [ARIA Rules](#aria-rules)

## Setup

```typescript
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

// Global config (app.config.ts) — optional, defaults are sensible
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

providers: [
  provideNgxSignalFormsConfig({
    autoAria: true, // default
    defaultErrorStrategy: 'on-touch', // default (WCAG recommended)
  }),
];
```

## Basic Pattern (Recommended)

Use `NgxSignalFormToolkit` — **no `[ngxSignalForm]` needed** for most forms:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormErrorComponent],
  template: `
    <form novalidate (submit)="onSubmit($event)">
      <label for="email">Email</label>
      <input id="email" type="email" [formField]="userForm.email" />
      <ngx-signal-form-error [formField]="userForm.email" fieldName="email" />

      <button type="submit" [disabled]="userForm().invalid()">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  readonly #model = signal<UserData>({ email: '' });

  protected readonly userForm = form(this.#model, (schemaPath) => {
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Enter a valid email' });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.userForm, async () => {
      await this.api.save(this.#model());
    });
  }
}
```

`submit()` from `@angular/forms/signals` marks all fields touched before running your callback, so `'on-touch'` strategy naturally works on submit too—no extra wiring needed.

## Error Display

### `<ngx-signal-form-error>`

Preferred way to show field errors. Handles `role="alert"` / `aria-live` automatically.

```html
<input id="email" [formField]="form.email" />
<ngx-signal-form-error [formField]="form.email" fieldName="email" />
```

- `fieldName` must match the `id` on the input for ARIA linking.
- Default strategy: `'on-touch'` (shows after blur or submit).
- For `'on-submit'` strategy, add `[ngxSignalForm]` to the form (see below).

### Error Display Strategies

| Strategy    | When errors appear                  |
| ----------- | ----------------------------------- |
| `on-touch`  | After blur or submit (**default**)  |
| `immediate` | As user types (real-time)           |
| `on-submit` | Only after first submission attempt |
| `manual`    | Programmatic control                |
| `inherit`   | From nearest `[ngxSignalForm]`      |

## Form Field Wrapper

`NgxFormField` bundles label, input, and auto-error into one component:

```typescript
@Component({
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <ngx-signal-form-field-wrapper [formField]="form.email" fieldName="email">
      <label for="email">Email</label>
      <input id="email" [formField]="form.email" />
    </ngx-signal-form-field-wrapper>
  `,
})
```

Use `appearance="outline"` for Material Design outlined style.

## Fieldset (Grouped Fields)

```html
<!-- Group with own error display per field -->
<ngx-signal-form-fieldset [fieldsetField]="form.address">
  <ngx-signal-form-field-wrapper
    [formField]="form.address.street"
    fieldName="street"
  >
    <label for="street">Street</label>
    <input id="street" [formField]="form.address.street" />
  </ngx-signal-form-field-wrapper>
  <ngx-signal-form-field-wrapper
    [formField]="form.address.city"
    fieldName="city"
  >
    <label for="city">City</label>
    <input id="city" [formField]="form.address.city" />
  </ngx-signal-form-field-wrapper>
</ngx-signal-form-fieldset>
```

Use `includeNestedErrors` when fields are plain `<input>` elements without their own error components.

## When to Add `[ngxSignalForm]`

Only add `[ngxSignalForm]` when you need one of these:

| Need                                  | Required? |
| ------------------------------------- | --------- |
| `'on-submit'` error strategy          | ✅ Yes    |
| Form-level `[errorStrategy]` override | ✅ Yes    |
| `submittedStatus` signal in DI        | ✅ Yes    |
| Default `'on-touch'` strategy         | ❌ No     |
| Automatic ARIA / error display        | ❌ No     |

```html
<!-- Only when using 'on-submit' strategy -->
<form
  [ngxSignalForm]="userForm"
  [errorStrategy]="'on-submit'"
  (submit)="save($event)"
>
  <ngx-signal-form-error [formField]="userForm.email" fieldName="email" />
</form>
```

## ARIA Rules

`NgxSignalFormAutoAriaDirective` (included in `NgxSignalFormToolkit`) auto-manages:

- `aria-invalid` — set when field is invalid and errors should show
- `aria-required` — set when field has `required()` validator
- `aria-describedby` — links input to its error/hint elements

**Do NOT manually add these attributes** when using `NgxSignalFormToolkit`. The toolkit reads field state signals and sets them correctly based on the active error strategy.

**Do NOT use `.ng-invalid` CSS classes** for styling—use `[aria-invalid="true"]` instead.

```css
/* Wrong */
.ng-invalid {
  border-color: red;
}

/* Correct */
[aria-invalid='true'] {
  border-color: red;
}
```
