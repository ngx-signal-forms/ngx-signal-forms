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
- For nested custom controls or dynamically identified inner controls, pass explicit `fieldName` on the wrapper instead of relying on implicit id discovery.
- Set `appearance="outline"` for modern outlined inputs; `appearance="stacked"` for label-above layout; `appearance="plain"` for minimal chrome; `appearance="inherit"` to follow parent config.
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

6. **Use `form[formRoot][ngxSignalForm]` for toolkit-backed forms.** The wrapper and fieldset components work best when they can inherit toolkit form context and submitted-status behavior from `ngxSignalForm`.

7. **Custom controls:** Implement `FormValueControl<T>`, `FormCheckboxControl`, or `FormUiControl` from `@angular/forms/signals`. Give the host a stable `id` so the wrapper links correctly.

- Use `appearance="plain"` for widget-style controls (sliders, star-rating, switch rows) where outlined or stacked default field chrome would look wrong.
- Declare control semantics explicitly with `ngxSignalFormControl` on the bound host. Without it, the wrapper falls back to DOM heuristics that can produce the wrong layout or ARIA behavior:

  ```html
  <!-- Native switch: role="switch" on the element + declare kind -->
  <input
    id="emailUpdates"
    type="checkbox"
    role="switch"
    ngxSignalFormControl="switch"
    [formField]="form.emailUpdates"
  />

  <!-- Native checkbox opt-in: declare kind so wrapper uses inline-control layout -->
  <input
    id="agreeToTerms"
    type="checkbox"
    ngxSignalFormControl="checkbox"
    [formField]="form.agreeToTerms"
  />

  <!-- Custom component: declare kind + layout; opt out of auto-ARIA when the
       component manages its own describedby/invalid attributes -->
  <ngx-rating-control
    id="rating"
    [ngxSignalFormControl]="{ kind: 'slider', layout: 'stacked', ariaMode: 'manual' }"
    [formField]="form.rating"
  />
  ```

- For `ariaMode: 'manual'` controls, assemble `aria-describedby` with `buildAriaDescribedBy` from `@ngx-signal-forms/toolkit` so the ID-naming conventions stay consistent:

  ```typescript
  import { computed } from '@angular/core';
  import { buildAriaDescribedBy } from '@ngx-signal-forms/toolkit';
  readonly sliderDescribedBy = computed(() =>
    buildAriaDescribedBy('rating', {
      baseIds: ['rating-hint'],
      showErrors: this.showErrors(),
    }),
  );
  ```

- When many controls of the same kind share the same semantics, use `provideNgxSignalFormControlPresetsForComponent()` in the host component `providers` instead of repeating the directive object:

  ```typescript
  providers: [
    ...provideNgxSignalFormControlPresetsForComponent({
      slider: { layout: 'custom', ariaMode: 'manual' },
    }),
  ];
  ```

  Then use the shorter `ngxSignalFormControl="slider"` (or a minimal object) on each control — the preset fills in `layout` and `ariaMode` automatically.

- For switch-style custom components that render their own `input[type="checkbox"][role="switch"]` internally, import `NgxSignalFormToolkit` in that child component's `imports`, since standalone imports do not cascade from the parent form.

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
    <form [formRoot]="profileForm" ngxSignalForm errorStrategy="on-submit">
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

- If wrapper errors don't appear: confirm the bound control has an `id` attribute matching the field, or add explicit `fieldName` when the control is nested.
- If grouped summary duplicates child messages: remove `includeNestedErrors` or scope `fields` explicitly.
- If floating label doesn't animate: add `placeholder=" "` (a single space) and use `appearance="outline"`.
- If a switch row collapses or inherits text-input styling: make sure the bound control declares `ngxSignalFormControl="switch"` (in addition to `role="switch"` for a11y) so the wrapper uses switch-specific layout.
- If a slider or composite control gets an outlined text-field shell: add `ngxSignalFormControl="slider"` (or `"composite"`) to the bound host so the wrapper picks up the correct layout.
- If auto-ARIA conflicts with a custom control's own ARIA attributes: add `ngxSignalFormControlAria="manual"` on the control host to suppress toolkit ARIA management. Use `buildAriaDescribedBy` to assemble the `aria-describedby` value manually.
- For fully custom markup without wrapper assumptions, switch to `headless/SKILL.md`.
