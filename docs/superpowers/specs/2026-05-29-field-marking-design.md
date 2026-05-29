# Design: Required/optional field marking (3 modes) + form-aware legend

**Date:** 2026-05-29
**Status:** Approved direction (pending spec review)

## Problem

The toolkit can only mark **required** fields with an asterisk, and even that
renders **only in `outline` appearance** (`showRequiredMarkerVisible` gates on
`isOutline()` in `form-field-wrapper.ts`). In the default `standard` (and
`plain`) appearance, no marker renders at all.

A designer asked us to stop showing asterisks: for an expert/internal app where
most fields are required, marking the _norm_ adds visual noise and an
"error-first" feel. The accepted best practice (GOV.UK, NN/g, Adrian Roselli)
is to mark the **exception** — i.e. mark optional fields — or mark nothing and
rely on accessible error handling.

The asterisk itself is not an accessibility problem: required state is conveyed
programmatically via `aria-required` (`auto-aria.ts`), independent of the visual
marker. Removing or changing the visual marker is a11y-neutral as long as
`aria-required` and accessible errors remain.

The library should not bake in one opinion. It should make all three marking
strategies first-class:

| Mode       | Behaviour                              |
| ---------- | -------------------------------------- |
| `required` | mark required fields (current default) |
| `optional` | mark optional (non-required) fields    |
| `none`     | mark nothing visually                  |

## Goals

- Single, clear config switch for the three modes.
- Markers render consistently across **all** appearances (standard, outline,
  plain), not outline-only.
- A reusable, mode-aware legend component the consumer places wherever it makes
  sense in a form/page.
- Per-instance overrides on the wrapper and legend (also powers a live demo).
- Programmatic `aria-required` stays intact regardless of mode.

## Non-goals (YAGNI)

- Auto-injecting the legend into the form directive or error summary.
- Per-field required/optional _detection_ config — required-ness comes from the
  field's validators (`field().required()`), not from marking config.
- Theming beyond single class hooks.

## Config

`packages/toolkit/core/types.ts` — `NgxSignalFormsConfig`:

```ts
// REPLACES showRequiredMarker: boolean
showMarkerWhen: 'required' | 'optional' | 'none'; // default 'required'
requiredMarker: string; // default ' *'
optionalMarker: string; // default ' (optional)'   (new)
requiredLegendText: string; // default '{marker} indicates a required field'  (new)
optionalLegendText: string; // default 'All fields are required unless marked {marker}'  (new)
```

`NgxSignalFormsUserConfig` gets the optional (`?`) variants. Defaults live in
`DEFAULT_NGX_SIGNAL_FORMS_CONFIG` (`tokens.ts`). `normalize-config.ts` and the
provider merge each new key with `??` like the existing string fields (so falsy
overrides such as `requiredMarker: ''` are preserved).

**Breaking change:** `showRequiredMarker` is removed. Migration is mechanical:
`true → showMarkerWhen: 'required'`, `false → showMarkerWhen: 'none'`. Acceptable
at `1.0.0-rc.9` (pre-stable). All internal usages updated (see Files touched).

### Marker text vs legend marker token

`{marker}` in legend text is replaced with the **trimmed** marker for the active
mode:

- `required` mode → trimmed `requiredMarker` (`' *'` → `*`):
  "\* indicates a required field"
- `optional` mode → trimmed `optionalMarker` (`' (optional)'` → `(optional)`):
  "All fields are required unless marked (optional)"

Both read naturally. `{marker}` is the only supported token; other text renders
verbatim. Consumers pass `$localize`'d strings for i18n.

## Wrapper changes (`form-field-wrapper.ts`)

Replace the boolean input with the mode, add the optional marker input:

```ts
readonly showMarkerWhen = input<'required' | 'optional' | 'none'>();  // override config
readonly requiredMarker = input<string>();                            // existing
readonly optionalMarker = input<string>();                            // new
```

Marker resolution (`computed`):

1. Resolve mode: input override → config.
2. Read `#boundControlIsRequired()` (already tracked).
3. Decide visible marker:
   - `required` mode + required field → render `requiredMarker`
   - `optional` mode + non-required field → render `optionalMarker`
   - otherwise → render nothing

**Remove the `isOutline()` gate** so markers render in all appearances. The
template already renders the marker span in the label slot; only the visibility
computed changes. The `data-show-required` host attribute generalises to
`data-marker="required" | "optional" | null` for CSS hooks.

Accessibility unchanged: both markers stay `aria-hidden="true"` (decorative);
`aria-required` continues to be managed by `auto-aria` independent of marking
mode, so screen-reader users are unaffected by the choice.

**Regression risk:** standard/plain fields currently show no marker. After this
change they will (when a mode is active). Visual snapshots / existing wrapper
specs must be reviewed and updated.

## Headless helper

New file `headless/src/lib/field-optionality.ts`, re-exported from the headless
barrel:

```ts
// Reactive summary of leaf-field optionality across a form tree.
function createFieldOptionalitySummary(tree: FieldTree<unknown>): {
  readonly hasRequired: Signal<boolean>;
  readonly hasOptional: Signal<boolean>;
};
```

Traversal inside `computed`s, evaluating `required()` on **leaf** fields
(controls), not container nodes:

- **Object nodes:** iterate the `[Symbol.iterator]` yielding `[key, childTree]`
  (confirmed in `@angular/forms/types/_structure-chunk.d.ts:189`).
- **Array nodes:** iterate array-like indices.
- **Leaf nodes** (not iterable / not array-like): call `node()` and read
  `state.required()`. Required leaf → contributes to `hasRequired`; non-required
  leaf → contributes to `hasOptional`.

Reading `required()` inside the computed makes the result reactive, so
conditionally-required fields update the legend. Short-circuiting per summed flag
is safe under signals (covered in the original legend analysis).

## Legend component

New assistive component `packages/toolkit/assistive/form-marking-legend.ts`
(selector `ngx-form-marking-legend`), sibling to `form-field-error-summary.ts`,
exported from the assistive entry point and barrel. Consumer places it anywhere
in the form/page. Class `NgxFormMarkingLegend`.

### Inputs

```ts
readonly formField = input<FieldTree<unknown>>();                     // optional; falls back to NGX_SIGNAL_FORM_CONTEXT.form
readonly showMarkerWhen = input<'required' | 'optional' | 'none'>();  // override config (parity + live demo)
readonly text = input<string>();                                      // override resolved default text entirely
readonly requiredMarker = input<string>();                            // override config for {marker}
readonly optionalMarker = input<string>();                            // override config for {marker}
```

### Resolution

- Mode: `showMarkerWhen` input → config.
- Text: `[text]` input → mode default (`requiredLegendText` for `required`,
  `optionalLegendText` for `optional`). `none` → render nothing.
- `{marker}` → trimmed marker for the active mode (`requiredMarker` for
  `required`, `optionalMarker` for `optional`), with per-instance input override.
- Form tree: `[formField]` → ambient `NGX_SIGNAL_FORM_CONTEXT.form`
  (`ngx-signal-form.ts:28`). Neither available → dev-mode `console.error` and
  render nothing.

### Visibility (form-aware)

Using `createFieldOptionalitySummary(tree)`:

- `required` mode → visible when `hasRequired()`
- `optional` mode → visible when `hasOptional()`
- `none` mode → never visible

### Rendering & a11y

```html
@if (visible()) {
<p class="ngx-form-marking-legend">{{ resolvedText() }}</p>
}
```

Plain **visible** text (NOT `aria-hidden`) — the legend is the explanation and
is useful to everyone; screen-reader users still get per-field `aria-required`,
so it is supplementary, not a duplicate announcement. No `role` / live region.

## Demo

New interactive demo at `apps/demo/src/app/04-form-field-wrapper/field-marking/`
following the existing `*.page.ts` layout (`*.page.ts`, `*.form.ts`, `*.html`,
`*.model.ts`, `*.content.ts`, `index.ts`, `README.md`). Registered in
`app.routes.ts` + route-title registry.

Live controls (all bound to both the wrappers and the legend so everything stays
in sync):

- mode selector: `required` / `optional` / `none`
- `requiredMarker` text input
- `optionalMarker` text input
- legend `text` override input

Sample form mixing required and optional fields, plus a toggle that flips one
field's required-ness, so the markers, the legend text, and the legend's
auto-hide can all be observed live.

## Testing

`createFieldOptionalitySummary`:

- flat form: all required / all optional / mixed → correct `hasRequired` /
  `hasOptional`
- nested object form; array form
- conditionally-required field toggling both flags
- empty form / no leaf fields → both false

Wrapper:

- `required` mode renders `requiredMarker` on required fields only
- `optional` mode renders `optionalMarker` on non-required fields only
- `none` mode renders no marker
- markers render in standard, outline, and plain appearance
- input overrides (`showMarkerWhen`, `requiredMarker`, `optionalMarker`)
- `aria-required` present/absent independent of marking mode (no regression)
- `data-marker` attribute reflects the rendered marker kind

Legend:

- mode-specific default text + `{marker}` substitution (required & optional)
- `[text]` override; per-instance marker overrides
- `none` mode → renders nothing
- context fallback vs explicit `[formField]`; missing form → dev error + nothing
- visibility tracks `hasRequired` / `hasOptional` reactively

Config:

- defaults present; `showMarkerWhen` default `'required'`
- each key merges via `??`; falsy override (`requiredMarker: ''`) preserved
- removed `showRequiredMarker` no longer referenced anywhere

## Files touched

Toolkit:

- `packages/toolkit/core/types.ts` (config interfaces)
- `packages/toolkit/core/tokens.ts` (defaults)
- `packages/toolkit/core/utilities/normalize-config.ts`
- `packages/toolkit/core/providers/config.provider.ts` (merge new keys)
- `packages/toolkit/form-field/form-field-wrapper.ts` (mode logic, drop outline gate)
- `packages/toolkit/headless/src/lib/field-optionality.ts` (new) + barrel
- `packages/toolkit/assistive/form-marking-legend.ts` (new) + assistive barrel

Consumers / migration of removed `showRequiredMarker`:

- `apps/demo-primeng/*` — note: `prime-form-field.ts` has its **own** local
  `showRequiredMarker` input (a custom wrapper, not toolkit config). Leave its
  public input name as-is; only toolkit-config usages migrate. No toolkit-config
  usage exists in demo-primeng today, so no code change is required there.

Docs (update config name `showRequiredMarker` → `showMarkerWhen`, document
`optionalMarker` / legend / 3 modes / all-appearance rendering):

- `packages/toolkit/README.md`
- `packages/toolkit/form-field/README.md`
- `packages/toolkit/form-field/THEMING.md` (add optional-marker CSS vars +
  `data-marker` hook)
- `.github/instructions/ngx-signal-forms-toolkit.instructions.md`
- `.github/skills/ngx-signal-forms/references/api.md`
- `.github/skills/ngx-signal-forms/form-field/SKILL.md`
- `packages/toolkit/core/utilities/cascading-resolver.ts` (doc-comment example)

Demo:

- `apps/demo/src/app/04-form-field-wrapper/field-marking/` (new)
- `apps/demo/src/app/app.routes.ts` + route-title registry (demo-shared)

Specs: a `*.spec.ts` alongside each new/changed toolkit unit
(`normalize-config.spec.ts`, `form-field-wrapper.spec.ts`, new
`field-optionality.spec.ts`, new legend spec).
