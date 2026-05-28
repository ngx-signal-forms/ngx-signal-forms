# Design: Configurable, form-aware required-field legend

**Date:** 2026-05-29
**Status:** Approved (pending spec review)

## Problem

The toolkit renders a required marker (`*` by default) next to required fields
(`form-field-wrapper.ts`). The marker is `aria-hidden="true"` and supplemented
by the control's `aria-required`, so screen-reader users are well served. But a
bare asterisk is undecoded for **sighted** users unless a legend ("\* indicates
a required field") appears somewhere on the form — a WCAG 3.3.2 (Labels or
Instructions) gap.

Today there is no built-in legend. Two demos hand-roll `<span>* Required
fields</span>` (`custom-controls.html`, `fieldset.form.html`); every other form
omits it. This design adds a first-class, reusable legend component.

Note: the `showRequiredMarker` default stays `true` — that is the accessible,
conventional choice and is out of scope here. This work addresses only the
missing legend.

## Goals

- A reusable legend component placed once per form.
- Legend text configurable globally (i18n, custom wording) and per-instance.
- Legend text stays in sync with the configured `requiredMarker` character.
- Legend hides automatically when the form has no required fields.

## Non-goals (YAGNI)

- Auto-injecting the legend into the form directive or error summary.
- A "mark optional fields" mode (`(optional)` instead of `*`).
- Theming beyond a single CSS class hook.

## Component

New assistive component, sibling to `form-field-error-summary.ts`:

- File: `packages/toolkit/assistive/form-required-legend.ts`
- Selector: `ngx-form-required-legend`
- Exported from the assistive entry point and the package barrel.

### Inputs

```ts
// Optional: falls back to NGX_SIGNAL_FORM_CONTEXT.form when omitted.
readonly formField = input<FieldTree<unknown>>();

// Overrides the config default entirely. '{marker}' is still substituted.
readonly text = input<string>();

// Overrides config requiredMarker for '{marker}' substitution. Mirrors the
// per-instance requiredMarker input on NgxFormFieldWrapper (form-field-wrapper.ts:415).
readonly requiredMarker = input<string>();
```

### Text resolution precedence

Text:

1. `[text]` input (if set)
2. `requiredLegendText` from config
3. Built-in default: `'{marker} indicates a required field'`

Marker (for `{marker}` substitution):

1. `[requiredMarker]` input (if set)
2. `requiredMarker` from config (default `' *'`)

The literal token `{marker}` is replaced with the **trimmed** resolved marker
(`' *'` → `*`). Trimming keeps the sentence clean when the marker leads the
string. `{marker}` is the only supported token; all other text renders verbatim.
Consumers pass `$localize`'d strings via config or `[text]` for i18n.

Because both `requiredMarker` and `requiredLegendText` are config tokens (not
hot-swappable at runtime), the per-instance `[requiredMarker]` / `[text]` inputs
are what enable live, reactive customization — used by the demo below.

### Form-field resolution

- When `[formField]` is provided, use it.
- Otherwise resolve `NGX_SIGNAL_FORM_CONTEXT.form` via `injectFormContext()`
  (`ngx-signal-form.ts:28`).
- If neither is available: dev-mode `console.error` (matching existing toolkit
  patterns, e.g. `NgxFormFieldWrapper` strict-identity warning) and render
  nothing.

## Form-awareness: hide when zero required fields

There is no built-in Angular aggregation of `required` across a tree (unlike
`errorSummary()`), so we traverse the `FieldTree` ourselves.

Headless helper (testable, reusable), new file
`headless/src/lib/required-state.ts`, re-exported from the headless barrel:

```ts
function anyFieldRequired(tree: FieldTree<unknown>): Signal<boolean>;
```

Traversal, inside a `computed`, short-circuiting on the first required field:

- **Object nodes:** iterate the `[Symbol.iterator]` that yields
  `[key, childTree]` (confirmed in
  `@angular/forms/types/_structure-chunk.d.ts:189`).
- **Array nodes:** iterate array-like indices.
- **Leaf nodes:** call `node()` and read `state.required()`.

Reading `required()` signals inside the `computed` makes visibility reactive,
so conditionally-required fields toggle the legend correctly.

**Short-circuit safety under signals:** if no field is required we read every
`required()` signal, so any later change re-runs the computed. Once a required
field is found we stop; the result (`true`) only changes when that specific
field flips, which re-triggers a full walk. Correct in both directions.

## Rendering & accessibility

```html
@if (visible()) {
<p class="ngx-form-required-legend">{{ resolvedText() }}</p>
}
```

- `visible()` = a required field exists AND a form tree resolved.
- Plain **visible** text (NOT `aria-hidden`). Unlike the asterisk, the legend
  _is_ the explanation and is useful to all users. Screen-reader users still
  get per-field `aria-required`, so the legend is supplementary, not a duplicate
  announcement.
- No `role` / live region — static guidance, not a status update.
- Single class hook `ngx-form-required-legend` for consumer styling.

## Config changes

`packages/toolkit/core/types.ts`:

```ts
interface NgxSignalFormsConfig {
  // ...existing...
  requiredLegendText: string;
}
interface NgxSignalFormsUserConfig {
  // ...existing...
  requiredLegendText?: string;
}
```

`packages/toolkit/core/tokens.ts` (`DEFAULT_NGX_SIGNAL_FORMS_CONFIG`):

```ts
requiredLegendText: '{marker} indicates a required field',
```

`packages/toolkit/core/utilities/normalize-config.ts`: merge
`requiredLegendText` with `??` like the other string fields, so falsy overrides
are preserved consistently with `requiredMarker`.

## Demo

New interactive demo page following the existing `*.page.ts` pattern, under
`apps/demo/src/app/04-form-field-wrapper/required-legend/` (same file layout as
the `custom-controls` demo: `*.page.ts`, `*.form.ts`, `*.html`, `*.model.ts`,
`*.content.ts`, `index.ts`, `README.md`). Registered in `app.routes.ts` and the
route-title registry.

Contents:

- Live controls: a text input bound to the legend `[text]`, and a text input
  bound to `[requiredMarker]`.
- The same `[requiredMarker]` is also bound to the field wrapper(s), so the
  rendered asterisks and the legend stay visibly in sync.
- A sample form mixing required and optional fields, plus a toggle that makes a
  field required/optional so the legend's auto-hide can be observed live.

## Testing

Headless `anyFieldRequired`:

- flat form with/without required fields
- nested object form
- array form
- conditionally-required field toggling visibility
- empty form / no fields

Component:

- config default substitution renders `* indicates a required field`
- `{marker}` sync when config `requiredMarker` customized (e.g. `' †'` → `†`)
- `[requiredMarker]` input overrides config for `{marker}` substitution
- `[text]` override (with and without `{marker}`)
- context fallback vs explicit `[formField]`
- missing form → dev error + renders nothing
- visibility toggles with required state

## Files touched

- `packages/toolkit/assistive/form-required-legend.ts` (new)
- `packages/toolkit/assistive/index.ts` (export)
- `packages/toolkit/headless/src/lib/required-state.ts` (new) + barrel export
- `packages/toolkit/core/types.ts`
- `packages/toolkit/core/tokens.ts`
- `packages/toolkit/core/utilities/normalize-config.ts`
- `apps/demo/src/app/04-form-field-wrapper/required-legend/` (new demo)
- `apps/demo/src/app/app.routes.ts` + route-title registry (demo-shared)
- Spec files for each of the toolkit changes above
