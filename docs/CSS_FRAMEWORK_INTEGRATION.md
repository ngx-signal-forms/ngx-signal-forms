---
title: 'CSS framework integration'
sidebarTitle: 'CSS frameworks'
---

Integrate `@ngx-signal-forms/toolkit` with Bootstrap, Tailwind CSS, or Angular Material while keeping invalid styling in sync with toolkit error timing.

Use this guide when your app styles controls with an external CSS framework instead of relying on the default wrapper theme. If you are building a reusable wrapper for a full component library, also read [custom wrappers](./CUSTOM_WRAPPERS.md).

## Why native `:invalid` and status classes drift

Angular Signal Forms does not add status classes like `ng-invalid` by default unless you configure them with `provideSignalFormsConfig`. Even when enabled, `invalid()` flips immediately when a rule fails, while `on-touch` or `on-submit` timing hides the message until the user blurs or submits. Styling `invalid()` or native `:invalid` directly turns the field red before the user sees any message. Native validity also misses custom schema rules, server errors, and warnings.

## Recommended approach: style `aria-invalid`

`NgxSignalFormAutoAria` writes `aria-invalid="true"` on each control only while blocking errors are visible under the resolved display strategy. Style that attribute directly so visual borders and error messages stay in sync:

```css
input[aria-invalid='true'],
textarea[aria-invalid='true'],
select[aria-invalid='true'] {
  border-color: #dc3545;
}
```

## Bootstrap 5.3

### Style controls with `aria-invalid`

Add one rule so Bootstrap's `.form-control` follows toolkit timing instead of `.is-invalid`:

```css
.form-control[aria-invalid='true'] {
  border-color: var(--bs-form-invalid-border-color);
}
```

### Use `NgxFormFieldError` in Bootstrap markup

Start with the [quick start component](../README.md#quick-start), name its form `userForm`, and import `NgxFormFieldError` from `@ngx-signal-forms/toolkit/assistive` alongside `FormField` and `NgxSignalFormToolkit`:

```typescript
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
```

```html
<form [formRoot]="userForm" ngxSignalForm>
  <div class="mb-3">
    <label for="email" class="form-label">Email</label>
    <input
      id="email"
      type="email"
      class="form-control"
      [formField]="userForm.email"
    />
    <ngx-form-field-error [formField]="userForm.email" fieldName="email" />
  </div>
</form>
```

Bootstrap floating labels follow the same pattern:

```html
<div class="form-floating mb-3">
  <input
    id="email"
    type="email"
    class="form-control"
    placeholder="name@example.com"
    [formField]="userForm.email"
  />
  <label for="email">Email address</label>
  <ngx-form-field-error [formField]="userForm.email" fieldName="email" />
</div>
```

### Map Bootstrap tokens to `ngx-form-field-wrapper`

If you use `ngx-form-field-wrapper`, map Bootstrap's CSS custom properties onto the wrapper's public tokens:

```css
ngx-form-field-wrapper {
  --ngx-form-field-color-primary: var(--bs-primary, #0d6efd);
  /* Use a border color with >= 3:1 contrast against the field surface and page (Bootstrap's --bs-border-color is ~1.3:1 on white) */
  --ngx-form-field-color-border: var(--bs-secondary-color, #6c757d);
  --ngx-form-field-color-text: var(--bs-body-color, #212529);
  --ngx-form-field-color-text-secondary: var(--bs-secondary-color, #6c757d);
  --ngx-form-field-color-surface: var(--bs-body-bg, #ffffff);
  --ngx-form-field-color-disabled: var(--bs-secondary-bg, #e9ecef);
  --ngx-form-field-color-error: var(--bs-form-invalid-color, #dc3545);
  /* Use a warning color with >= 3:1 contrast for focus outlines (Bootstrap's --bs-warning is ~1.63:1 on white) */
  --ngx-form-field-color-warning: var(--bs-warning-text-emphasis, #664d03);

  --ngx-form-field-input-padding: 0.375rem 0.75rem;
  --ngx-form-field-radius: var(--bs-border-radius, 0.375rem);
  --ngx-signal-form-error-font-size: 0.875rem;
  --ngx-signal-form-error-margin-top: 0.25rem;
}
```

## Tailwind CSS 4

Use Tailwind's `aria-invalid:` variant on inputs so borders follow toolkit timing. Style `ngx-form-field-error` colors and font size through its CSS custom properties rather than utility classes on the host, because the component sets color and font size on its inner elements:

```html
<form [formRoot]="userForm" ngxSignalForm class="space-y-4">
  <div>
    <label for="email" class="block text-sm font-medium text-gray-700">
      Email
    </label>
    <input
      id="email"
      type="email"
      class="mt-1 block w-full rounded-md border border-gray-500 shadow-sm focus:outline-2 focus:outline-indigo-600 aria-invalid:border-red-700 aria-invalid:text-red-700"
      [formField]="userForm.email"
    />
    <ngx-form-field-error
      [formField]="userForm.email"
      fieldName="email"
      class="mt-1 [--ngx-signal-form-error-color:var(--color-red-600)] [--ngx-signal-form-error-font-size:0.875rem]"
    />
  </div>

  <button
    type="submit"
    class="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
  >
    Submit
  </button>
</form>
```

Variant comparison:

- `aria-invalid:` follows the toolkit's resolved error timing and includes schema and server errors (recommended).
- `invalid:` applies immediately on native constraint failure, ignoring toolkit timing.
- `user-invalid:` follows browser-defined interaction rules, not toolkit `on-touch` timing.

## Angular Material

Angular Material uses `mat-form-field` and `ErrorStateMatcher`. For Signal Forms controls, Material calls `ErrorStateMatcher.isSignalErrorState(field)` rather than the Reactive Forms `isErrorState` hook.

Keep Material's error-state predicate and rendered message visibility aligned, and let Material remain the owner of `aria-describedby` by marking controls with `ngxSignalFormControlAria="manual"`. See the [Material reference wrapper](../apps/demo-material/README.md) (including `ngxMatErrorSlot` and `ngxMatHintSlot`) and [custom wrappers](./CUSTOM_WRAPPERS.md).

## ARIA ownership and switches

`NgxSignalFormAutoAria` writes `aria-invalid` and `aria-describedby` on controls regardless of which CSS framework styles them. If a component library writes its own ARIA, add `ngxSignalFormControlAria="manual"` to the control so only one party owns those attributes.

For switches, prefer a native `<input type="checkbox" role="switch">` styled with your framework, or leave library switches such as `mat-slide-toggle` in charge of their own ARIA. See [custom controls](./CUSTOM_CONTROLS.md).

## Quick reference

| Framework        | Recommended invalid hook   | Notes                                                        |
| ---------------- | -------------------------- | ------------------------------------------------------------ |
| Bootstrap 5.3    | `[aria-invalid='true']`    | Pair with `.form-control` or map `--bs-*` to wrapper CSS     |
| Tailwind CSS 4   | `aria-invalid:*` variant   | Theme `ngx-form-field-error` with `--ngx-signal-form-*`      |
| Angular Material | `isSignalErrorState`       | Keep Material in charge of `aria-describedby`                |
| Default Angular  | `provideSignalFormsConfig` | Opt into custom status classes if your stylesheet needs them |

## Related documentation

- [Theming guide](../packages/toolkit/form-field/THEMING.md)
- [Custom wrappers](./CUSTOM_WRAPPERS.md)
- [Custom controls](./CUSTOM_CONTROLS.md)
- [Angular Signal Forms migration guide: automatic status classes](https://angular.dev/guide/forms/signals/migration#automatic-status-classes)
