# Toolkit Form Field

Implements the `@ngx-signal-forms/toolkit/form-field` entry point.

Use the [source index](../references/api.md) for public exports and component inputs.

## Principle

The form-field entry point provides a pre-styled field shell (label + control + feedback) that eliminates repeated layout boilerplate. Use it when the design wants consistent field presentation without custom markup. Use [headless](../headless/guide.md) when complete DOM control is needed.

## Workflow

1. **Import using `NgxFormField` bundle** from `@ngx-signal-forms/toolkit/form-field`. Don't import from the root package.

2. **Wrap controls in `ngx-form-field-wrapper`:**

- Give the bound control a stable `id`, or set the wrapper's `fieldName` explicitly. Keep an accessible label association in either case.
- For nested custom controls or dynamically identified inner controls, pass explicit `fieldName` on the wrapper instead of relying on implicit id discovery.
- Omit `appearance` to inherit configuration, whose built-in default is `standard`. Use `outline` or `plain` only for an intentional exception; set shared defaults in a provider rather than on every wrapper.
- `appearance="outline"` prints the label as a static caption inside the border. It does not float or animate, so it needs no `placeholder=" "` trick — write a real placeholder when the field wants one, or none at all.

3. **Error placement:**
   - Default for wrapper: `errorPlacement="bottom"`
   - Default for fieldset: `errorPlacement="bottom"` — set `errorPlacement="top"` when the group summary should sit directly below the legend.
   - Override per wrapper or per fieldset as needed — these are independent controls.

4. **Field marking:** Use `showMarkerWhen` (`'required' | 'optional' | 'none'`), plus optional `requiredMarker` / `optionalMarker`, on the wrapper or globally via `provideNgxSignalFormsConfig({ showMarkerWhen: 'required' })`. Markers render in every appearance and don't affect `aria-required`. Add the form-level `<ngx-form-marking-legend>` (from `@ngx-signal-forms/toolkit/assistive`) once per form to explain what the marker means.

5. **Use `NgxFormFieldset` for grouped sections:**
   - Pass the **parent field tree** to `[field]`.
   - Default: child wrapper errors + group-level errors each show separately. Set `includeNestedErrors` to show all child errors in the group summary.
   - Use `fields` input to restrict which fields count toward the group summary.
   - Style the group shell with `appearance="plain"` (semantic-only grouping, no border/padding), `surfaceTone`, and `validationSurface="always"` (tint invalid/warning groups). Control the grouped feedback with `feedbackAppearance` (`'auto' | 'plain' | 'notification'`), `notificationTitle`, and `listStyle`. See `../references/api.md` for the full input table.

6. **Use `form[formRoot]` for the baseline wrapper path; add `ngxSignalForm` when the form needs shared context.** Wrapper and fieldset components can render with the default `'on-touch'` fallback even without `ngxSignalForm`. Add `ngxSignalForm` when grouped sections, summaries, or custom wrapper integrations need inherited `'on-submit'`, `submittedStatus`, or injected form context.

7. **Custom controls:** Read the bundled [Angular control contract](../references/signal-forms.md#custom-controls) before implementation. For an existing widget, also read [value transformation](../references/signal-forms.md#value-transformation) and the deeper [widget adapter guide](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/docs/CUSTOM_CONTROLS.md#adapting-an-existing-third-party-widget). Give the actual control a stable ID and label; use explicit wrapper `fieldName` for nested widgets.

- Field-shaped custom controls (combobox, closed select that should look like a text field) are `input-like`. Keep the trigger naked so the wrapper owns border, focus, and invalid. Inner `role="combobox"` with an `id` infers `input-like`. A closed select without that role sets `ngxSignalFormControl="input-like"` on the host. There is no `select` kind. See the Angular Aria Combobox and Select guides.
- Use `appearance="plain"` for widget-style controls (sliders, star-rating, switch rows) where outlined or standard default field chrome would look wrong. Do not restyle `composite` or `slider` as text fields.
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

  <!-- Native checkbox opt-in uses the group preset; switches use inline-control. -->
  <input
    id="agreeToTerms"
    type="checkbox"
    ngxSignalFormControl="checkbox"
    [formField]="form.agreeToTerms"
  />

  <!-- Custom component: declare kind + layout; opt out of auto-ARIA when the
       component manages its own describedby/invalid attributes.
       NOTE: 'stacked' here is a CONTROL LAYOUT (NgxSignalFormControlLayout,
       still valid). It is NOT the renamed 'standard' appearance. -->
  <ngx-rating-control
    id="rating"
    [ngxSignalFormControl]="{ kind: 'slider', layout: 'stacked', ariaMode: 'manual' }"
    [formField]="form.rating"
  />
  ```

- `ariaMode: 'manual'` inside the `ngxSignalFormControl` config and the standalone `ngxSignalFormControlAria="manual"` attribute are equivalent — the config-object form is for declaring full semantics in one place, the standalone attribute for a one-off override when `kind`/`layout` already come from a preset or DOM heuristic (see the _Error Handling_ section below for an example).
- For either form, assemble `aria-describedby` with `buildAriaDescribedBy` from `@ngx-signal-forms/toolkit` so the ID-naming conventions stay consistent:

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

This complete native form inherits appearance and default `on-touch` timing.
Angular `FormRoot` owns submit and `novalidate`; no toolkit enhancer is needed.

```typescript
import { Component, signal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  required,
  email,
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

## Grouped Fieldset

```html
<!-- Group-level error summary (add errorPlacement="top" to move it above the fields) -->
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

Use `includeNestedErrors` on the fieldset only when the overall summary must aggregate all child field errors into one list, e.g., for an accessibility-focused error summary at the top of the form.

## Submit-only variation

For the component above, add `NgxSignalForm` from the package root to its
`imports` and change the form host to the following. Keep the same configured
`submission.action`; do not add a second submit handler.

```html
<form [formRoot]="profileForm" ngxSignalForm errorStrategy="on-submit">
  <!-- Keep the same labeled fields and submit button. -->
</form>
```

This changes error timing only. Warnings keep their independent inherited
timing unless `warningStrategy` is also set. For theme work, read the
[theming guide](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/packages/toolkit/form-field/THEMING.md) and
[browser checks](../testing/guide.md#browser-state-checks).

## Done

- The wrapper has a bound field, an accessible label, and stable message
  identity. Shared appearance defaults are not repeated as field exceptions.
- Feedback and ARIA agree before touch, after touch, and after submit under
  the chosen error and warning strategies.
- Custom editable controls pass model/widget round-trip, invalid-input, reset,
  focus forwarding, and composite focus-exit checks.
- Theme changes have browser evidence for supported themes, keyboard focus,
  and live-region transitions as well as axe. Report unperformed checks.

## Error Handling

- If wrapper errors don't appear: confirm the bound control has an `id` attribute matching the field, or add explicit `fieldName` when the control is nested.
- If grouped summary duplicates child messages: remove `includeNestedErrors` or scope `fields` explicitly.
- If a switch row collapses or inherits text-input styling: make sure the bound control declares `ngxSignalFormControl="switch"` (in addition to `role="switch"` for a11y) so the wrapper uses switch-specific layout.
- If a slider or composite control gets an outlined text-field shell: add `ngxSignalFormControl="slider"` (or `"composite"`) to the bound host so the wrapper picks up the correct layout. If a field-shaped combobox or closed select does **not** get the text-field shell, keep the trigger naked and join as `input-like` (combobox role + id, or explicit `ngxSignalFormControl="input-like"`). Do not add a `select` kind.
- If auto-ARIA conflicts with a custom control's own ARIA attributes: add `ngxSignalFormControlAria="manual"` on the control host to suppress toolkit ARIA management. Use `buildAriaDescribedBy` to assemble the `aria-describedby` value manually.
- For fully custom markup without wrapper assumptions, switch to [headless](../headless/guide.md).
