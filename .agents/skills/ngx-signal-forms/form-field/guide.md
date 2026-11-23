# Toolkit Form Field

Covers `@ngx-signal-forms/toolkit/form-field` (`NgxFormFieldWrapper`, `NgxFormFieldset`, and the `NgxFormField` bundle).
Use [api.md](../references/api.md) for exports and input signatures.
Switch to [assistive/guide.md](../assistive/guide.md) when you own field layout, or [headless/guide.md](../headless/guide.md) when you own all markup.

## Imports and setup

- Import `NgxFormField` from `@ngx-signal-forms/toolkit/form-field`. It bundles `NgxSignalFormAutoAria`, `NgxSignalFormControl`, `NgxFormFieldWrapper`, `NgxFormFieldHint`, `NgxFormFieldCharacterCount`, `NgxFormFieldError`, and `NgxFormFieldset`.
- `NgxFormField` omits `FormRoot` and `ngxSignalForm`. Import `FormRoot` from `@angular/forms/signals` for plain `'on-touch'` forms, or `NgxSignalFormToolkit` from `@ngx-signal-forms/toolkit` when the form uses `ngxSignalForm`.

## Wrapper usage

- Give the bound control a stable `id`, or set `fieldName` on `ngx-form-field-wrapper`. Use explicit `fieldName` for nested or dynamically identified controls.
- Omit `appearance` and `orientation` to inherit configured defaults (`'standard'` and `'vertical'`). Set shared defaults via `provideNgxSignalFormsConfig()` or `provideNgxSignalFormsConfigForComponent()` rather than repeating inputs on every wrapper.
- `appearance="outline"` renders the label as a static caption inside the border. It does not float, so use a real placeholder or omit `placeholder` (no `placeholder=" "` trick).
- `appearance="plain"` removes wrapper chrome while preserving labels, messages, and ARIA. It leaves projected control styles intact; if your app resets native controls, keep a visible border and keyboard focus indicator.
- `errorPlacement` defaults to `'bottom'` on both `ngx-form-field-wrapper` and `ngx-form-fieldset`. Set `errorPlacement="top"` on a fieldset to place the group summary directly below `<legend>`.
- Field marking uses `showMarkerWhen` (`'required' | 'optional' | 'none'`), `requiredMarker`, and `optionalMarker` globally or per wrapper. Markers render in all appearances without changing `aria-required`. Place `<ngx-form-marking-legend>` (from `/assistive`) once per form to explain the marker.
- **Opt-in valid border (RC.17+):** `ngx-form-field-wrapper` adds `ngx-signal-form-field-wrapper--valid` to a touched, valid field with no warnings. Set `--ngx-form-field-valid-border-color` to display a success border on textual fields (unset by default; inactive during hover or focus). Pair color with text or an icon if success must be conveyed without color.
- **Dark mode:** toolkit colors use CSS `light-dark()` and respond to `color-scheme` (`:root { color-scheme: light dark; }`, or `:root.dark { color-scheme: dark; }` for class toggles), not `.dark` selectors directly. See [THEMING.md](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/toolkit/form-field/THEMING.md#dark-mode).

## Grouped controls and fieldsets

- For a **selection group** (radio group or multi-checkbox group acting as one field), use `ngx-form-field-wrapper` with `<span ngxFormFieldLabel>` and `fieldName`, not `<label>` or `ngx-form-fieldset`.
- For related fields with cross-field rules or section summaries, use `ngx-form-fieldset`:
  - Pass the parent field tree to `[field]`.
  - Default mode renders direct group-level errors while child wrappers show their own errors. Set `includeNestedErrors` when the fieldset should aggregate child errors too.
  - Bind `fields` to restrict which fields count toward the summary (`fields=[]` collects nothing).
  - Customize with `appearance="plain"`, `surfaceTone`, `validationSurface="always"`, `feedbackAppearance` (`'auto' | 'plain' | 'notification'`), `notificationTitle`, and `listStyle`.

## Custom controls

Read [signal-forms.md#custom-controls](../references/signal-forms.md#custom-controls) and [core/guide.md#control-semantics-and-auto-aria](../core/guide.md#control-semantics-and-auto-aria) before wrapping a custom widget.

- **Field-shaped widgets** (comboboxes, closed custom selects) join as `input-like` so the wrapper draws border, focus, and invalid state around a naked trigger. An inner `[role="combobox"][id]` infers `input-like`; a closed select without that role sets `ngxSignalFormControl="input-like"`. There is no `select` kind.
- **Widget-shaped controls** (sliders, star ratings, composite widgets) use `appearance="plain"` and declare `ngxSignalFormControl` explicitly (for example `[ngxSignalFormControl]="{ kind: 'slider', layout: 'stacked', ariaMode: 'manual' }"`). Share repeated settings with `provideNgxSignalFormControlPresetsForComponent()`.
- When using `ariaMode: 'manual'` or `ngxSignalFormControlAria="manual"`, compose `aria-describedby` with `buildAriaDescribedBy` from `@ngx-signal-forms/toolkit`:

```typescript
readonly sliderDescribedBy = computed(() =>
  buildAriaDescribedBy('rating', {
    baseIds: ['rating-hint'],
    showErrors: this.showErrors(),
  }),
);
```

- For library switches that render `role="switch"` on a nested element (`mat-slide-toggle`, `p-toggleswitch`, Spartan switch), add `ngxSignalFormControl="switch"` and `ngxSignalFormControlAria="manual"` on the `[formField]` host, then bind ARIA on the inner switch.

## Basic usage

Inherits default appearance and `'on-touch'` timing with `FormRoot` alone:

```typescript
import { Component, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  FormRoot,
  required,
} from '@angular/forms/signals';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'app-profile-form',
  imports: [FormField, FormRoot, NgxFormField],
  template: `
    <form [formRoot]="profileForm">
      <ngx-form-field-wrapper [formField]="profileForm.email">
        <label for="email">Email</label>
        <input id="email" type="email" [formField]="profileForm.email" />
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper [formField]="profileForm.name">
        <label for="name">Full name</label>
        <input id="name" [formField]="profileForm.name" />
        <ngx-form-field-hint>As it appears on your ID</ngx-form-field-hint>
      </ngx-form-field-wrapper>

      <button type="submit" [disabled]="profileForm().submitting()">
        Save
      </button>
    </form>
  `,
})
export class ProfileFormComponent {
  readonly #model = signal({ email: '', name: '' });
  protected readonly savedProfile = signal<{
    email: string;
    name: string;
  } | null>(null);
  protected readonly profileForm = form(
    this.#model,
    (path) => {
      required(path.email);
      email(path.email);
      required(path.name);
    },
    {
      submission: {
        action: async (tree) => {
          this.savedProfile.set(tree().value());
        },
      },
    },
  );
}
```

### Submit-only variation

Import `NgxSignalForm` (or `NgxSignalFormToolkit`) from `@ngx-signal-forms/toolkit` and add it to the `<form>` while keeping the same `submission.action`:

```html
<form [formRoot]="profileForm" ngxSignalForm errorStrategy="on-submit">
  <!-- Same labeled fields and submit button -->
</form>
```

### Grouped fieldset

```html
<ngx-form-fieldset [field]="form.address" fieldsetId="address">
  <legend>Address</legend>

  <ngx-form-field-wrapper [formField]="form.address.street">
    <label for="street">Street</label>
    <input id="street" [formField]="form.address.street" />
  </ngx-form-field-wrapper>

  <ngx-form-field-wrapper [formField]="form.address.city">
    <label for="city">City</label>
    <input id="city" [formField]="form.address.city" />
  </ngx-form-field-wrapper>
</ngx-form-fieldset>
```

## Done

Verify the checks that apply to your change:

- Wrapped controls have a bound field, accessible label, and stable `id` or explicit `fieldName`; shared defaults come from config rather than repeated field overrides.
- Visible messages and ARIA agree across initial, touched, editing, and submitted states for the chosen strategies.
- Custom editable controls pass round-trip, invalid-input, reset, `focus(options)`, and composite focus-exit checks.
- Theme changes are checked in a real browser across supported `color-scheme` modes (including keyboard focus and axe). Report unrun checks.
