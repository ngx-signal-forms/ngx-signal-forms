# Brand Theming

## Intent

A focused demo answering the FAQ's "How do I theme the built-in wrapper with
our brand tokens?" end to end: a distinctly non-default palette, wired
through the **public** CSS custom property surface only, covering every
stateful color (error, warning, disabled, focus) in **both** light and dark,
with contrast verified rather than assumed.

## Why a dedicated page, not a `fieldset-appearance` variant

`fieldset-appearance` already owns ~9 interacting display-control axes
(feedback appearance, surface tone, validation surface, list style,
placement, aggregation mode, …); folding a 10th ("brand theme on/off") into
that page's control panel would make the page harder to reason about without
adding anything specific to theming. Theming also naturally wants **its own
CSS scope** — a page whose only job is proving a palette override works, not
comparing structural/behavioral options.

A dedicated page also keeps the theming demo's palette CSS scoped to a single
class (`.brand-theming-panel--brand`) on this page's own panel. Toggling it
never touches `fieldset-appearance` or any other route, so none of the
existing `@layout`-tagged visual snapshots for other pages are affected.

## Toolkit features showcased

- The wrapper's public semantic color scale: `--ngx-form-field-color-primary`,
  `-error`, `-warning`, `-text`, `-text-secondary`, `-surface`, `-border`,
  `-border-hover`, `-disabled` (THEMING.md § "Semantic Color Scale").
- The cross-cutting feedback tokens that must be kept in sync with the
  semantic scale: `--ngx-signal-form-error-color`,
  `--ngx-signal-form-warning-color`, `--ngx-form-field-hint-color`
  (THEMING.md § "Error & Warning Messages" / "Hints").
- Dark-mode theming via the app's existing `.dark` class switch
  (`NgxThemeSwitcherComponent` in the header) — this page defines dark
  values for the brand palette, it does not add a second toggle.
- All four stateful colors on real form fields: a required field (danger,
  on load via `errorStrategy="immediate"`), a pattern-validated field
  (a second danger surface), a non-blocking `warn:` message once a budget
  input crosses a threshold (warning), and a permanently `disabled()` field
  (disabled background/opacity). Tab through the fields to see the brand
  focus ring.

Only the **public** `--ngx-form-field-*` / `--ngx-signal-form-*` tokens are
overridden — the internal `--_field-*` / `--_*` pseudo-private tokens
documented in THEMING.md's "Architecture: Semantic Layering" section are
never referenced.

## Palette + contrast

| Token                              | Light                | Dark                    |
| :--------------------------------- | :------------------- | :---------------------- |
| `-color-primary`                   | `#6d28d9`            | `#a78bfa`               |
| `-color-error` / `error-color`     | `#be123c`            | `#fda4af`               |
| `-color-warning` / `warning-color` | `#92400e`            | `#fcd34d`               |
| `-color-text`                      | `#1e1b4b`            | `#f5f3ff`               |
| `-color-text-secondary` / hint     | `rgba(30,27,75,.75)` | `rgba(245,243,255,.75)` |
| `-color-surface`                   | `#fdfaf6`            | `#1e1b3a`               |
| `-color-border`                    | `rgba(30,27,75,.5)`  | `rgba(245,243,255,.4)`  |
| `-color-border-hover`              | `#1e1b4b`            | `#f5f3ff`               |
| `-color-disabled`                  | `#ede9f9`            | `#14112a`               |
| panel background                   | `#f5f0ff`            | `#120f24`               |

Contrast ratios below are computed against **both** backgrounds a token can
actually render on — the input's own `-color-surface` and this page's panel
background (`#f5f0ff` light / `#120f24` dark) — since a token like `-color-
primary` sits on the input's border (adjacent to the surface) while its focus
box-shadow spreads out over the panel. Stating both, rather than picking one,
avoids the "which background is this really measured against" ambiguity
(WCAG 2.2 relative-luminance formula; alpha colors pre-blended against each
background before computing):

| Pair                     | Light (surface / panel) | Dark (surface / panel) | Requirement |
| :----------------------- | :---------------------- | :--------------------- | :---------- |
| text                     | 15.36:1 / 14.30:1       | 15.04:1 / 17.10:1      | ≥4.5:1      |
| error text               | 6.04:1 / 5.62:1         | 8.72:1 / 9.92:1        | ≥4.5:1      |
| warning text             | 6.81:1 / 6.34:1         | 11.44:1 / 13.01:1      | ≥4.5:1      |
| text-secondary (blended) | 6.97:1 / 6.72:1         | 8.94:1 / 9.82:1        | ≥4.5:1      |
| primary (border/UI)      | 6.83:1 / 6.36:1         | 6.06:1 / 6.89:1        | ≥3:1        |
| border (blended)         | 3.17:1 / 3.11:1         | 3.51:1 / 3.58:1        | ≥3:1        |

Every one of the twelve numbers above clears its WCAG floor on its own —
the "worse" of the surface/panel pair is never the one that would fail.

Disabled-state colors are intentionally excluded — WCAG 1.4.3/1.4.11 exempt
inactive UI components from the contrast requirement, and the toolkit's own
`-disabled-opacity` (`0.6`) already signals the state visually.

## Manual test checklist

1. Load the page: **Team name** and **Workspace URL** show the brand danger
   color immediately (no interaction needed).
2. Type `12345678` into **Monthly budget**: a `role="status"` warning appears
   in the brand warning color; the form stays submittable (warnings never
   block).
3. **Legacy workspace ID** renders with the brand disabled background at
   reduced opacity and cannot be edited.
4. Tab into any field: the focus ring uses the brand primary color.
5. Click **Stock theme**: every color reverts to the toolkit's default blue/
   red/amber palette — same markup, same fields.
6. Toggle dark mode from the header's theme switcher with **Brand theme**
   selected: the panel switches to the dark palette above, not the light
   one re-rendered on a dark background.

## Related

- [`packages/toolkit/form-field/THEMING.md`](../../../../../../packages/toolkit/form-field/THEMING.md) —
  full token catalog, the public-vs-internal convention, and the Scenario A/B/C
  recipes this page builds on.
- [`docs/FAQ.md`](../../../../../../docs/FAQ.md) — "How do I theme the built-in
  wrapper with our brand tokens?"
- [Fieldset Appearance](../fieldset-appearance/README.md) — the structural/
  behavioral counterpart to this page's purely visual focus.
