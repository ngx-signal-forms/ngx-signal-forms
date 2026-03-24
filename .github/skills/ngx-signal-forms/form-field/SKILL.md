---
name: ngx-signal-forms-form-field
description: Implements @ngx-signal-forms/toolkit/form-field wrappers and fieldsets. Use when adding ngx-signal-form-field-wrapper, floating labels (outline appearance), grouped field summaries (NgxSignalFormFieldset), or custom controls that integrate with the wrapper layer. Part of the ngx-signal-forms skill suite.
---

# Toolkit Form Field

Implements the `@ngx-signal-forms/toolkit/form-field` entry point.

Read `../references/api.md` for the full export list and all component inputs.

## Principle

The form-field entry point provides a pre-styled field shell (label + control + feedback) that eliminates repeated layout boilerplate. Use it when the design wants consistent field presentation without custom markup. Use `headless/SKILL.md` when complete DOM control is needed.

## Workflow

1. **Import using `NgxFormField` bundle** from `@ngx-signal-forms/toolkit/form-field`. Don't import from the root package.

2. **Wrap controls in `ngx-signal-form-field-wrapper`:**
   - Bound control must have a stable `id` — the wrapper derives field identity from it.
   - Set `appearance="outline"` for modern outlined inputs; `appearance="standard"` for underlined; `appearance="inherit"` to follow parent config.
   - Add `placeholder=" "` (a single space) alongside `appearance="outline"` when you want the floating label animation.

3. **Error placement:**
   - Default for wrapper: `errorPlacement="bottom"`
   - Default for fieldset: `errorPlacement="top"`
   - Override per wrapper or per fieldset as needed — these are independent controls.

4. **Required marker:** Use `showRequiredMarker` on the wrapper or configure it globally via `provideNgxSignalFormsConfig({ showRequiredMarker: true })`.

5. **Use `NgxSignalFormFieldset` for grouped sections:**
   - Pass the **parent field tree** to `[fieldsetField]`.
   - Default: child wrapper errors + group-level errors each show separately. Set `includeNestedErrors` to show all child errors in the group summary.
   - Use `fields` input to restrict which fields count toward the group summary.

6. **Custom controls:** Implement `FormValueControl<T>` from `@angular/forms/signals`. Give the host a stable `id` so the wrapper links correctly.

## Basic Usage

```typescript
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'app-profile-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [formRoot]="profileForm" [errorStrategy]="'on-submit'">
      <ngx-signal-form-field-wrapper
        [formField]="profileForm.email"
        appearance="outline"
      >
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          [formField]="profileForm.email"
          placeholder=" "
        />
      </ngx-signal-form-field-wrapper>

      <ngx-signal-form-field-wrapper
        [formField]="profileForm.name"
        appearance="outline"
      >
        <label for="name">Full name</label>
        <input id="name" [formField]="profileForm.name" placeholder=" " />
        <ngx-form-field-hint>As it appears on your ID</ngx-form-field-hint>
      </ngx-signal-form-field-wrapper>

      <button type="submit">Save</button>
    </form>
  `,
})
export class ProfileFormComponent {
  readonly #model = signal({ email: '', name: '' });
  protected readonly profileForm = form(this.#model, (path) => {
    required(path.email);
    email(path.email);
    required(path.name);
  });
}
```

## Grouped Fieldset

```html
<!-- Group-level error summary at the top (fieldset default) -->
<ngx-signal-form-fieldset [fieldsetField]="form.address" fieldsetId="address">
  <legend>Address</legend>

  <ngx-signal-form-field-wrapper
    [formField]="form.address.street"
    appearance="outline"
  >
    <label for="street">Street</label>
    <input id="street" [formField]="form.address.street" placeholder=" " />
  </ngx-signal-form-field-wrapper>

  <ngx-signal-form-field-wrapper
    [formField]="form.address.city"
    appearance="outline"
  >
    <label for="city">City</label>
    <input id="city" [formField]="form.address.city" placeholder=" " />
  </ngx-signal-form-field-wrapper>
</ngx-signal-form-fieldset>
```

Use `includeNestedErrors` on the fieldset only when the overall summary must aggregate all child field errors into one list, e.g., for an accessibility-focused error summary at the top of the form.

## Error Handling

- If wrapper errors don't appear: confirm the bound control has an `id` attribute matching the field.
- If grouped summary duplicates child messages: remove `includeNestedErrors` or scope `fields` explicitly.
- If floating label doesn't animate: add `placeholder=" "` (a single space) and use `appearance="outline"`.
- For fully custom markup without wrapper assumptions, switch to `headless/SKILL.md`.
