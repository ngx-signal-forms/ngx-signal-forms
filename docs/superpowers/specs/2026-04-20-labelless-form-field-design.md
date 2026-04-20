# Labelless form-field wrapper

## Problem

`NgxFormFieldWrapper` always reserves space for its label slot, regardless of
whether a `<label>` is actually projected. The effect is visible in each
layout:

- **Standard vertical** — the label `<div>` contributes a `row-gap` and
  (depending on whitespace) a line-height-sized blank row above the input.
- **Outline** — `.ngx-signal-form-field-wrapper__content` pads its top by
  `calc(label-outline-line-height + outline-label-gap + padding-vertical)` and
  `--_outline-min-height` factors in the same label line-height. Both reserve
  a floating-label slot that no longer exists, leaving the field measurably
  taller than the input requires.
- **Standard + horizontal** — the host grid reserves an 8rem (`--_horizontal-label-width`)
  left column, shifting the input rightward even when no label occupies it.

Consumers expect: omit the `<label>` → see only the input and its assistive
row, with no ghost label space in any layout.

## Non-goals

- Selection controls (`checkbox`, `switch`, `radio-group`). These require a
  visible label for accessibility and already manage their own grid
  templates. Removing the label there is a consumer bug we should not paper
  over.
- `plain` appearance. It already strips label-specific chrome; no changes
  needed.
- A new public input (e.g. `labelless`, `hasLabel`). The DOM already answers
  the question — layering an API on top would just duplicate state.

## Approach

Detect the absence of a projected `<label>` with pure CSS using `:has()` and
`:not()`. The file already relies on `:has()` for prefix/suffix detection
(browser support floor documented in `form-field-wrapper.scss:37` —
Chrome 105+, Firefox 121+, Safari 15.4+, Edge 105+). No JS, no Angular
content query, no new host classes.

Detection selector (scoped so a stray `<label>` nested in a prefix/suffix
slot cannot match):

```
:host(...):not(:has(.ngx-signal-form-field-wrapper__label label))
```

### Per-layout behavior

**1. Standard vertical (textual)**

- Hide `.ngx-signal-form-field-wrapper__label` (`display: none`).
- The `:host` flex `gap` only applies between rendered children, so the gap
  above the input disappears automatically once the label div is removed.

**2. Outline (textual)**

- Hide the label div (`display: none`).
- Reset the content container's top padding to `var(--_padding-vertical)`
  (drop the `calc(label-line-height + label-gap + padding-vertical)` stack
  used when a label is present).
- Override `--_outline-min-height` to
  `calc(var(--_input-outline-line-height) + var(--_padding-vertical) * 2)` so
  the minimum-height no longer reserves a floating-label row.

**3. Standard + horizontal (textual)**

- Collapse the host grid to a single content column:
  `grid-template-columns: minmax(0, 1fr)` and
  `grid-template-areas: 'content' 'assistive'`.
- Messages-top variant collapses to:
  `grid-template-areas: 'messages' 'content' 'assistive'`.
- Per product decision, no reserved label column — consumers who need
  vertical alignment across rows with/without labels can provide an empty
  `<label></label>` (it is visible to assistive tech only if it contains
  text) or restyle the grid themselves.

### Files touched

**Library**

- `packages/toolkit/form-field/form-field-wrapper.scss` — append a new
  section `// LABEL-LESS LAYOUT` containing the three scoped rulesets.
- `packages/toolkit/form-field/form-field-wrapper.spec.ts` — add
  `describe('without a label')` with one test per appearance covering the
  computed-style assertions (display, padding, grid-template-columns).
- `packages/toolkit/form-field/THEMING.md` — short "Rendering without a
  label" section describing the behavior and documenting the "project an
  empty `<label>`" escape hatch for grid-aligned rows.

**Demo** — new page at
`apps/demo/src/app/04-form-field-wrapper/labelless-fields/`

Four sections, each wrapping the existing appearance/orientation toggles so
every layout can be previewed:

1. **Search input with icon prefix** — canonical pattern. Prefix SVG icon,
   `placeholder="Search…"`, no visible `<label>`. Accessible name provided
   by `aria-label` on the `<input>`.
2. **Grouped fields under a shared heading** — phone number split into
   country / number / extension. A single `<h3>` labels the group; each
   individual wrapper omits its own label.
3. **Amount input with currency suffix** — number input in outline
   appearance with a `$` prefix. Card heading provides the semantic label.
4. **Side-by-side comparison grid** — same wrapper rendered with and
   without a label for each of the three layouts. The "at a glance"
   regression surface.
5. **Narrow inputs with wide errors** — the companion "small input"
   scenarios where a visible label would be disproportionate. All examples
   constrain the `<input>` itself (via `max-width` or `inline-size:
fit-content`), not the wrapper — the recommended pattern today. The
   wrapper stays full-width so the error message has horizontal room to
   render without clipping.
   - **Age** (~5ch wide, `min: 18`, `max: 120`). Triggering "Must be 18 or
     older" produces an error message visibly wider than the input.
   - **OTP code** — six single-character inputs in a row, labelless,
     sharing one wrapper-level error below the group.
   - **Zip code** (~7ch wide) with a pattern validator whose message
     ("Format: 12345 or 12345-6789") is intentionally longer than the
     input to expose wrapping behavior.

   Rendered across all three appearances. Purpose: validate that today's
   "constrain the input, not the wrapper" pattern produces readable errors
   with no layout changes. If the demo reveals cases where errors still
   clip or overflow awkwardly, those become evidence for a follow-up
   `compact` / `--ngx-form-field-inline-size` opt-in — explicitly out of
   scope for this spec.

Route registered in `04-form-field-wrapper`'s routes with a nav entry
following the pattern of `complex-forms` and `custom-controls`.

**E2E** — new file
`apps/demo-e2e/src/forms/04-form-field-wrapper/labelless-fields.spec.ts`
with a companion page object at
`apps/demo-e2e/src/page-objects/labelless-fields.page.ts`.

Tests:

1. Standard variant: label div `getComputedStyle(...).display === 'none'`.
2. Outline variant: `offsetHeight` of a labelless wrapper is materially
   smaller than a labelled wrapper on the same page (delta assertion, not
   pixel-exact).
3. Horizontal variant: input's `getBoundingClientRect().left` is flush
   against the wrapper's left edge (no reserved label column).
4. Narrow-input errors: for the Age/OTP/Zip section, trigger each
   validator and assert the error element's `clientWidth >= scrollWidth`
   (no horizontal overflow) AND the error's bounding-box width exceeds the
   input's `offsetWidth` (the error is not constrained to the input's
   narrow width).
5. Playwright snapshot of the comparison grid AND the narrow-inputs
   section.

## Testing strategy

- Unit tests target computed styles, not rendered pixel heights — the
  former are stable across browser quirks; the latter are flaky.
- E2E tests use delta assertions where absolute numbers would tie the test
  to padding token values.
- Snapshot coverage is limited to the one comparison-grid screenshot so the
  intent of the feature is captured, not every permutation.

## Risks

- **Stray nested `<label>` in a prefix/suffix slot** — handled by scoping
  the `:has()` selector to `.ngx-signal-form-field-wrapper__label label`
  rather than a generic `label` descendant.
- **Consumers rely on reserved label space for grid alignment** — surfaces
  as a visual regression only. Mitigated by the THEMING.md note pointing to
  the empty-`<label>` escape hatch.
- **`:has()` support** — already a documented baseline for this file; no
  net new risk.

## Out of scope for this spec

- Extending the behavior to selection controls.
- Any change to the `plain` appearance.
- Introducing a public input property.
- A `compact` / `--ngx-form-field-inline-size` opt-in for narrow wrappers
  with wide errors. The narrow-input demo (Section 5) documents today's
  behavior so the decision can be made against real evidence in a
  follow-up spec.
