# CSS Framework Integration

> How to integrate `@ngx-signal-forms/toolkit` with Bootstrap, Tailwind CSS, and Angular Material

Angular propagates supported validator metadata to native constraints. Native
validity still cannot represent all schema errors, server errors, or warnings.
For toolkit timing, style the rendered ARIA state or use the same visibility
predicate as the feedback.

**The toolkit's approach:** Uses ARIA attributes (`aria-invalid`, `aria-describedby`) for accessibility and styling via attribute selectors. If your CSS framework requires validation classes, use Angular's native `provideSignalFormsConfig`.

---

## The Problem

By default, Angular Signal Forms does **not** apply status classes like `ng-invalid` and `ng-valid` unless you configure them via `provideSignalFormsConfig` (or the `NG_STATUS_CLASSES` preset).
See [Angular Forms Signals Migration Guide](https://angular.dev/guide/forms/signals/migration#automatic-status-classes) for details.
When enabled, `invalid()` reflects validation errors immediately, so those classes apply as soon as validation fails:

```console
❌ Default Behavior (Poor UX):
┌─────────────────────────────┐
│ Email [red border]          │  ← Field turns red immediately
└─────────────────────────────┘
                                 ← No error message yet (shows on blur)

User thinks: "Why is this red? What did I do wrong?"
```

**Solution:** Either use ARIA attribute selectors (toolkit's approach) or configure classes to apply on-touch/on-submit.

---

## Toolkit's ARIA-Based Approach (Recommended)

The toolkit adds `aria-invalid="true"` for visible blocking errors under the
resolved display strategy. Use CSS attribute selectors:

```css
/* Style invalid fields using ARIA (works with any CSS framework) */
input[aria-invalid='true'] {
  border-color: #dc3545;
}
```

This aligns with the toolkit's `'on-touch'` error display strategy by default.

---

## Bootstrap 5.3

Bootstrap uses `.is-invalid` and `.is-valid` classes for form validation styling.

### Option A: ARIA Attribute Selectors (Recommended)

Override Bootstrap's default styles to use ARIA attributes:

```css
/* Override Bootstrap to use ARIA-based validation */
.form-control[aria-invalid='true'] {
  border-color: var(--bs-form-invalid-border-color);
}
```

### Using the Toolkit's Error Component

The Bootstrap and Tailwind templates below are rendering excerpts. Start with
the [tested root component](../README.md#quick-start), name its form `userForm`,
and replace its wrapper with the shown markup. Keep the model, validators, and
submission action. Add `NgxFormFieldError` to that component's imports alongside
Angular `FormField` and the root `NgxSignalFormToolkit` bundle:

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
    <!-- Toolkit handles ARIA, visibility, and strategy -->
    <ngx-form-field-error [formField]="userForm.email" fieldName="email" />
  </div>
</form>
```

Use Bootstrap tokens via CSS custom properties (no component overrides):

```scss
/* Bootstrap theme mapping for toolkit form-field */
ngx-form-field-wrapper {
  --ngx-form-field-color-primary: var(--bs-primary, #0d6efd);
  --ngx-form-field-color-border: var(--bs-border-color, #dee2e6);
  --ngx-form-field-color-text: var(--bs-body-color, #212529);
  --ngx-form-field-color-text-secondary: var(--bs-secondary-color, #6c757d);
  --ngx-form-field-color-surface: var(--bs-body-bg, #ffffff);
  --ngx-form-field-color-disabled: var(--bs-secondary-bg, #e9ecef);
  --ngx-form-field-color-error: var(--bs-form-invalid-color, #dc3545);
  --ngx-form-field-color-warning: var(--bs-warning, #ffc107);

  /* Optional alignment tweaks to match Bootstrap spacing */
  --ngx-form-field-input-padding: 0.375rem 0.75rem;
  --ngx-form-field-radius: var(--bs-border-radius, 0.375rem);
  --ngx-signal-form-error-font-size: 0.875rem;
  --ngx-signal-form-error-margin-top: 0.25rem;
}
```

### Floating Labels

Bootstrap's floating labels work with the toolkit:

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

---

## Tailwind CSS 4

Tailwind uses utility classes and supports the `invalid:` and `user-invalid:` variants.

### Toolkit-consistent Tailwind styling

Tailwind's `aria-invalid:` variant follows the toolkit-written attribute.
Native `user-invalid:` uses browser constraint validation and its own
interaction policy; it is not equivalent to toolkit `on-touch`.

```html
<form [formRoot]="userForm" ngxSignalForm class="space-y-4">
  <div>
    <label for="email" class="block text-sm font-medium text-gray-700">
      Email
    </label>
    <input
      id="email"
      type="email"
      class="mt-1 block w-full rounded-md border border-gray-500 shadow-sm aria-invalid:border-red-700 aria-invalid:text-red-700 focus:outline-2 focus:outline-indigo-600"
      [formField]="userForm.email"
    />
    <ngx-form-field-error
      [formField]="userForm.email"
      fieldName="email"
      class="mt-1 text-sm text-red-600"
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

**Key variants:**

- `invalid:` — Styles when field is invalid (immediate)
- `user-invalid:` uses native validity after browser-defined interaction, not toolkit timing
- `focus:invalid:` — Styles when focused and invalid

---

## Angular Material

Angular Material uses `mat-form-field` with its own error handling via `ErrorStateMatcher`.

### Signal Forms error matching

In Angular/Material 22.1.4, Signal Forms supplies interoperability and Material
calls the public `ErrorStateMatcher.isSignalErrorState(field)` hook for signal
fields. Do not assume only the Reactive Forms `isErrorState` hook runs.

Align both Material's error-state predicate and the rendered message visibility.
Status classes alone do not establish that contract. Use the maintained
[Material wrapper](../apps/demo-material/README.md), which also keeps Material
as the owner of `aria-describedby`. Its slot directives create embedded views;
computing a message in a directive alone does not render it.

For a complete, tested reference implementation of this pattern — including
warnings and grouped `mat-hint` output — see `apps/demo-material`'s
`ngxMatErrorSlot` / `ngxMatHintSlot` directives
(`apps/demo-material/src/app/wrapper/slot-directives.ts`).

---

## ARIA Accessibility

The toolkit automatically manages ARIA attributes regardless of CSS framework:

| Attribute          | Behavior                                                        |
| ------------------ | --------------------------------------------------------------- |
| `aria-invalid`     | Set to `"true"` when field is invalid AND errors should display |
| `aria-describedby` | Links to error message element IDs                              |

These associations support assistive technology. Test announcements with the
target browser and screen reader; DOM attributes alone cannot prove them.

### Disabling Auto-ARIA

For Angular Material (which handles its own ARIA):

```html
<input
  matInput
  [formField]="userForm.email"
  ngxSignalFormControlAria="manual"
/>
```

Import the root toolkit bundle or its control-semantics directive in this
template. Known runtime concern R01: configuration stores `autoAria: false`,
but the current auto-ARIA directive does not consume it. Use per-control manual
ownership instead. This limitation still needs a runtime regression test and fix.

## Switch / Toggle Components Across UI Libraries

If a control is visually presented as an on/off switch, the important question
is not the styling library — it is whether the **rendered, focusable control**
exposes real switch semantics.

Reference:

- [MDN: ARIA `switch` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/switch_role)

### Recommended toolkit-friendly pattern

Prefer a native checkbox with `role="switch"` on the actual bound control:

```html
<label for="emailUpdates">Email updates</label>
<input
  id="emailUpdates"
  type="checkbox"
  role="switch"
  [formField]="form.emailUpdates"
/>
```

That gives you:

- native focus and keyboard behavior
- native checked state
- toolkit auto-ARIA enhancement on the same element

### Angular Material

`mat-slide-toggle` should generally keep using Material's own accessibility and
error model.

- let Material own the switch semantics
- do not stack toolkit auto-ARIA on top of Material's internal switch control
- if you need toolkit-managed wrapper markup, build a dedicated adapter instead
  of mixing `mat-form-field` semantics with toolkit field semantics

### PrimeNG

PrimeNG switch/toggle components should be treated as library-owned widgets.

- if the rendered widget already exposes switch semantics, keep PrimeNG in
  charge of ARIA
- if you wrap it with toolkit primitives, inspect the final DOM and verify the
  accessible name and described-by chain
- if the DOM does not expose switch semantics cleanly, prefer a native checkbox
  adapter

### ng-bootstrap / Bootstrap switch styling

Bootstrap-style switches are usually native checkboxes with styling, which fits
the toolkit well.

- keep the checkbox as the real bound control
- add `role="switch"` when the interaction is conceptually a switch
- allow toolkit auto-ARIA to enhance the same native element

---

## Quick Reference

| Framework        | Invalid Class            | Valid Class     | Notes                                                      |
| ---------------- | ------------------------ | --------------- | ---------------------------------------------------------- |
| Bootstrap 5.3    | `is-invalid`             | `is-valid`      | Use with `.form-control`                                   |
| Tailwind CSS 4   | `aria-invalid:*` variant | Separate policy | Follows toolkit-written invalid state                      |
| Angular Material | Material error state     | Material policy | Use `isSignalErrorState` and matching message visibility   |
| Default Angular  | configurable             | configurable    | Configure via `provideSignalFormsConfig({ classes: ... })` |

---

## Related Documentation

- [Angular Signal Forms Migration Guide - Status Classes](https://angular.dev/guide/forms/signals/migration#automatic-status-classes)
- [Custom Form Status Classes in Angular Signal Forms](https://netbasal.medium.com/custom-form-status-classes-in-angular-signal-forms-388553becd68)
- [Form Field Theming](../packages/toolkit/form-field/THEMING.md)
