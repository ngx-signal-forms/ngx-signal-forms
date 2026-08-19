# Form Field & Toolkit Theming Guide

A comprehensive guide to styling `@ngx-signal-forms/toolkit` components using standard CSS Custom Properties.

## Contents

- [Browser support](#browser-support)
- [Control-aware styling hooks](#control-aware-styling-hooks)
- [1. Shared Feedback (base layer)](#1-shared-feedback-base-layer)
- [2. Headless & standalone components](#2-headless--standalone-components) —
  [Error & warning messages](#error--warning-messages) · [Hints](#hints) ·
  [Grouped panel feedback](#grouped-panel-feedback-panel-presentation) · [Error summary](#error-summary) ·
  [Character count](#character-count) · [Marking legend](#marking-legend) ·
  [Assistive row](#assistive-row) · [Fieldset](#fieldset)
- [3. Form field component](#3-form-field-component) —
  [Layout modes](#layout-modes-standard-outline-and-plain) · [Semantic color scale](#semantic-color-scale-the-knobs) ·
  [Specific overrides](#specific-overrides) · [States & focus](#states--focus) ·
  [Horizontal layout](#horizontal-layout) · [Selection groups](#wrapper-selection-groups) ·
  [Selection target size](#selection-target-size)
- [4. Recipes & common scenarios](#4-recipes--common-scenarios)
- [Rendering without a label](#rendering-without-a-label)

## Overview

### What is this?

A theming system based entirely on **CSS Custom Properties (Variables)**. It exposes a public API of CSS variables that control colors, spacing, typography, and layout across the toolkit components.

### Why use it?

- **Encapsulation:** Modify styles safely without hacking component internals or using `::ng-deep`.
- **Runtime Theming:** Support Light/Dark modes or multiple themes instantly without rebuilding.
- **Framework Integration:** Easily map tokens from Bootstrap, Tailwind, or Material to the toolkit.

### Browser support

The toolkit ships its component styles as native CSS (no Sass). The
minimum browser versions supported by the published package are driven
by the most demanding features used:

| Feature                                        | Chrome | Edge | Safari | Firefox |
| :--------------------------------------------- | :----- | :--- | :----- | :------ |
| CSS custom properties                          | 49     | 15   | 9.1    | 31      |
| `:has(...)` (required by `appearance=outline`) | 105    | 105  | 15.4   | 121     |
| Native CSS nesting                             | 112    | 112  | 16.5   | 117     |
| `color-mix()`                                  | 111    | 111  | 16.2   | 113     |

The effective baseline is the **most demanding** row, not any single
feature: each component stylesheet uses native nesting on every rule,
so the `:has(...)` row's lower Safari threshold does **not** relax
the overall minimum. That lands the toolkit's effective baseline at
**Chrome 112, Edge 112, Safari 16.5, Firefox 121** (Jan 2024). Older
evergreen browsers may render a flattened approximation — the design
tokens still resolve — but nested selectors, hover/invalid overrides,
and the outline appearance depend on the features above.

Progressive enhancements (`interpolate-size: allow-keywords`,
`@supports` blocks for grouped notification animations,
`prefers-contrast: more`, `forced-colors: active`) are gated behind
feature queries, so they only apply where supported.

### Control-aware styling hooks

`ngx-form-field-wrapper` exposes stable data attributes that you can use
for custom-control styling without coupling your CSS to internal markup:

- `data-ngx-signal-form-control-kind`
  - Allowed values: `input-like`, `standalone-field-like`, `switch`,
    `checkbox`, `radio-group`, `slider`, `composite`
- `data-ngx-signal-form-control-layout`
  - Allowed values: `stacked`, `inline-control`, `group`, `custom`
- `data-ngx-signal-form-control-aria-mode`
  - Allowed values: `auto`, `manual`

Directive syntax for explicit semantics (on the actual control host):

- String kind form: `ngxSignalFormControl="switch"` (and other kind values)
- Object form:
  `[ngxSignalFormControl]="{ kind: 'slider', layout: 'custom', ariaMode: 'manual' }"`
- Optional per-property overrides:
  `ngxSignalFormControlLayout="group"`, `ngxSignalFormControlAria="manual"`

These are derived from explicit control semantics when present (for example
`ngxSignalFormControl="switch"`) and fall back to toolkit heuristics for older
markup. Prefer these attributes over `:has(...)` selectors for long-term theme
customizations.

### Architecture: Semantic Layering

The system works in layers to ensure consistency while allowing deep customization.

1. **Layer 1: Design Tokens** `(--_field-clr-primary)` / `(--_fieldset-clr-text)`
   - Internal defaults. Do not override these.
2. **Layer 2: Shared Feedback (Base)** `(--ngx-signal-form-feedback-font-size)`
   - **Public API.** Controls the "micro-copy" typography and spacing across Errors, Warnings, Notifications, Hints, and Character Counts. Defined in `form-field/feedback-tokens.css` and pulled into each consuming component's `styleUrls` alongside its own CSS, so the resolved `--_feedback-*` variables are visible on every feedback host — whether it is nested inside `ngx-form-field-wrapper` or used standalone.
3. **Layer 3: Semantic Colors** `(--ngx-form-field-color-primary)`
   - **Public API.** The main integration point. Maps abstract roles (Primary, Error) to concrete colors.
4. **Layer 4: Component Properties** `(--ngx-form-field-focus-color)`
   - **Public API.** Derived from layers 2 & 3. Override these for specific use cases.

---

## 1. Shared Feedback (Base Layer)

**Start here** if you want to change the size or spacing of _all_ helper text (Errors, Warnings, Notifications, Hints, Character Counts) at once.

| Property                                        | Default        | Description                                                   |
| :---------------------------------------------- | :------------- | :------------------------------------------------------------ |
| `--ngx-signal-form-feedback-font-size`          | `0.75rem`      | Font size for all feedback text                               |
| `--ngx-signal-form-feedback-line-height`        | `1rem`         | Line height for feedback text                                 |
| `--ngx-signal-form-feedback-margin-top`         | `0`            | Spacing between input and feedback                            |
| `--ngx-signal-form-feedback-padding-horizontal` | `0.5rem`       | Horizontal padding for feedback text                          |
| `--ngx-signal-form-feedback-list-style`         | `disc outside` | `list-style` shorthand for bulleted summaries (type+position) |
| `--ngx-signal-form-feedback-list-indent`        | `1.25rem`      | Bulleted summary indent (`padding-inline-start`)              |

---

## 2. Headless & Standalone Components

These components inherit from the **Shared Feedback** layer but can be overridden individually.

### Error & Warning Messages

**Component:** `ngx-form-field-error`

controls the display of validation errors and warnings.

Like the wrapper and fieldset styles, error styling now resolves through an
internal token layer plus pseudo-private aliases. Override only the public
`--ngx-signal-form-*` variables; the internal `--_error-*` values are
implementation details.

> **Note:** The default `--ngx-signal-form-warning-color` was `#f59e0b` prior to v1.0; it was changed to `#a16207` (Tailwind amber-700) for WCAG 1.4.3 AA contrast compliance on white backgrounds.

| Property                                            | Default                                                             | Description                        |
| :-------------------------------------------------- | :------------------------------------------------------------------ | :--------------------------------- |
| `--ngx-signal-form-error-color`                     | `#db1818`                                                           | Text color for errors              |
| `--ngx-signal-form-error-bg`                        | `transparent`                                                       | Error background color             |
| `--ngx-signal-form-error-border-color`              | `transparent`                                                       | Error border color                 |
| `--ngx-signal-form-warning-color`                   | `#a16207`                                                           | Text color for warnings            |
| `--ngx-signal-form-warning-bg`                      | `transparent`                                                       | Warning background color           |
| `--ngx-signal-form-warning-border-color`            | `transparent`                                                       | Warning border color               |
| `--ngx-signal-form-error-font-size`                 | `var(--...feedback...)`                                             | Text size                          |
| `--ngx-signal-form-error-line-height`               | `var(--...feedback...)`                                             | Line height                        |
| `--ngx-signal-form-error-margin-top`                | `var(--...feedback...)`                                             | Spacing from input                 |
| `--ngx-signal-form-error-message-spacing`           | `0.25rem`                                                           | Spacing between messages           |
| `--ngx-signal-form-error-border-width`              | `0`                                                                 | Border width                       |
| `--ngx-signal-form-error-border-radius`             | `0`                                                                 | Border radius                      |
| `--ngx-signal-form-error-padding`                   | `0`                                                                 | Container padding                  |
| `--ngx-signal-form-error-padding-inline-start`      | `var(--...feedback...)`                                             | Start-edge (inline) padding        |
| `--ngx-signal-form-error-padding-inline-end`        | `var(--...feedback...)`                                             | End-edge (inline) padding          |
| `--ngx-signal-form-error-animation`                 | `ngx-status-slide-in 300ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards` | Entry animation                    |
| `--ngx-signal-form-error-list-style`                | `var(--...feedback...)`                                             | `list-style` shorthand for bullets |
| `--ngx-signal-form-error-list-padding-inline-start` | `var(--...feedback...)`                                             | Indent for bulleted summaries      |

### Hints

**Component:** `ngx-form-field-hint`

Provides context or instructions for a field.

| Property                                     | Default                  | Description                 |
| :------------------------------------------- | :----------------------- | :-------------------------- |
| `--ngx-form-field-hint-color`                | `rgba(50, 65, 85, 0.75)` | Hint text color             |
| `--ngx-form-field-hint-font-size`            | `var(--...feedback...)`  | Text size                   |
| `--ngx-form-field-hint-line-height`          | `var(--...feedback...)`  | Line height                 |
| `--ngx-form-field-hint-align`                | `left`                   | Text alignment (left/right) |
| `--ngx-form-field-hint-padding-inline-start` | `0`                      | Start-edge padding          |
| `--ngx-form-field-hint-padding-inline-end`   | `0`                      | End-edge padding            |

Checkbox and switch wrapper rows override both padding tokens so the hint
aligns with the row's control padding. The wrapper also sets the contextual
`--ngx-form-field-hint-display: none` while the field is invalid or carries a
warning, so a hint never competes with blocking feedback — treat that variable
as an internal coordination hook, not a theming knob.

### Grouped Panel Feedback (panel presentation)

**Component:** `ngx-form-field-error` with `presentation="panel"`

There is no separate notification component — `ngx-form-field-error` renders
this surfaced card for grouped validation messages (fieldset-level errors,
custom summary blocks) when `presentation="panel"`; the default
`presentation="inline"` renders bare per-field messages instead (see the
[Error & Warning Messages](#error--warning-messages) table above for the
tokens shared by both presentations: color, list style, message spacing,
etc.). `--ngx-signal-form-error-panel-*` / `--ngx-signal-form-warning-panel-*`
below only apply while `presentation="panel"`.

Panel styling follows the same pattern as the rest of the toolkit:

- internal defaults live on `--_error-panel-*` tokens
- public overrides come from `--ngx-signal-form-error-panel-*` /
  `--ngx-signal-form-warning-panel-*`
- implementation consumes the resolved pseudo-private variables only

That keeps dark-mode defaults and Figma-aligned surfaces centralized without
shadowing consumer-provided theme variables.

| Property                                        | Default                                                                     | Description                                     |
| :---------------------------------------------- | :-------------------------------------------------------------------------- | :---------------------------------------------- |
| `--ngx-signal-form-error-panel-padding`         | `1rem`                                                                      | Inner padding of the card                       |
| `--ngx-signal-form-error-panel-border-width`    | `1px`                                                                       | Border width                                    |
| `--ngx-signal-form-error-panel-border-radius`   | `0.5rem`                                                                    | Card corner radius                              |
| `--ngx-signal-form-error-panel-font-size`       | `0.875rem`                                                                  | Message font size (Figma body-2)                |
| `--ngx-signal-form-error-panel-line-height`     | `1.25rem`                                                                   | Message line height                             |
| `--ngx-signal-form-error-panel-bg`              | `#fdebeb`                                                                   | Error card background                           |
| `--ngx-signal-form-error-panel-color`           | `#b91c1c`                                                                   | Error card text color                           |
| `--ngx-signal-form-error-panel-border-color`    | `color-mix(in srgb, var(--ngx-signal-form-error-color) 50%, transparent)`   | Error card border color                         |
| `--ngx-signal-form-warning-panel-bg`            | `color-mix(in srgb, var(--ngx-signal-form-warning-color) 10%, white)`       | Warning card background                         |
| `--ngx-signal-form-warning-panel-color`         | `#92400e`                                                                   | Warning card text color                         |
| `--ngx-signal-form-warning-panel-border-color`  | `color-mix(in srgb, var(--ngx-signal-form-warning-color) 50%, transparent)` | Warning card border color                       |
| `--ngx-signal-form-error-panel-message-spacing` | `0.25rem`                                                                   | Spacing between grouped messages                |
| `--ngx-signal-form-error-title-color`           | `currentColor`                                                              | Optional title color (both presentations)       |
| `--ngx-signal-form-error-title-font-size`       | `1rem`                                                                      | Optional title font size (both presentations)   |
| `--ngx-signal-form-error-title-line-height`     | `1.5rem`                                                                    | Optional title line height (both presentations) |
| `--ngx-signal-form-error-title-font-weight`     | `500`                                                                       | Optional title font weight (both presentations) |

List style/indent and message spacing come from the shared
`--ngx-signal-form-error-*` / `--ngx-signal-form-warning-*` tokens in the
[Error & Warning Messages](#error--warning-messages) table. Panel text has its
own `--ngx-signal-form-error-panel-color` and
`--ngx-signal-form-warning-panel-color` overrides so it remains readable on
the tinted card surfaces.

The light-theme danger defaults follow the current Figma card recipe:

- text: `#db1818`
- border: same semantic danger hue at `50%` alpha
- background: `#fdebeb`

The panel presentation animates as a progressive enhancement:

- baseline-safe fade/slide/color transitions always apply
- browsers with `interpolate-size: allow-keywords` also animate the card's block-size between `0` and `auto`
- `calc-size()` is intentionally not used here because the component does not need size math; `interpolate-size` is the recommended simpler opt-in for this case

The border still derives from the semantic danger color by default, while the
background stays pinned to the Figma light-danger surface. Override
`--ngx-signal-form-error-panel-bg` when your theme needs a different
surface color.

Panel messages use Figma's body-2 token by default (`0.875rem` / `1.25rem`),
while inline errors and hints retain caption sizing (`0.75rem` / `1rem`).
Setting `--ngx-signal-form-error-font-size` does not affect the panel
presentation; override `--ngx-signal-form-error-panel-font-size` and
`--ngx-signal-form-error-panel-line-height` to tune grouped cards.

### Error Summary

**Component:** `ngx-form-field-error-summary`

Renders a form-level, clickable list of aggregated validation errors (GOV.UK
/ WAI error-summary pattern). Each entry is a `<button>` that focuses its
associated control on click.

| Property                                   | Default   | Description                                                                                                                    |
| :----------------------------------------- | :-------- | :----------------------------------------------------------------------------------------------------------------------------- |
| `--ngx-error-summary-border-color`         | `#dc2626` | Card border color                                                                                                              |
| `--ngx-error-summary-bg`                   | `#fef2f2` | Card background color                                                                                                          |
| `--ngx-error-summary-label-color`          | `#991b1b` | Optional summary label text color                                                                                              |
| `--ngx-error-summary-link-color`           | `#b91c1c` | Entry link text color                                                                                                          |
| `--ngx-error-summary-link-hover-color`     | `#991b1b` | Entry link hover color                                                                                                         |
| `--ngx-error-summary-link-min-target-size` | `1.5rem`  | Minimum block-size AND inline-size of each entry link — enforces the 24x24px WCAG 2.5.8 target-size minimum in both directions |
| `--ngx-error-summary-link-padding-inline`  | `0.25rem` | Horizontal padding on each entry link                                                                                          |
| `--ngx-error-summary-focus-color`          | `#2563eb` | `:focus-visible` outline color on entry links                                                                                  |

`--ngx-error-summary-link-color` defaults to `#b91c1c` (Tailwind red-700)
rather than the `#dc2626` used for the card border: on the summary's
`#fef2f2` background, `#dc2626` text resolves to ~4.41:1, just under the
4.5:1 minimum for 14px text (WCAG 1.4.3 AA); `#b91c1c` resolves to ~5.9:1.

Each entry link keeps `all: unset` for the rest of its reset but sets an
explicit `display: inline-flex` plus `min-block-size` and `min-inline-size`
— `all: unset` resets `display` to its initial value (`inline`), and
`min-height`/`min-block-size`/`min-inline-size` have no effect on
non-replaced inline elements per spec, so the resulting target would
silently stay below the WCAG 2.5.8 24x24px minimum without the explicit
`inline-flex`. Both dimensions are floored (not just block-size) because a
short or empty `fieldName`/message could otherwise render narrower than
24px; `justify-content: center` keeps short text centered within the
enforced minimum width.

### Character Count

**Component:** `ngx-form-field-character-count`

Displays progress towards a character limit.

| Property                                           | Default                                    | Description                                                                          |
| :------------------------------------------------- | :----------------------------------------- | :----------------------------------------------------------------------------------- |
| `--ngx-form-field-char-count-font-size`            | `var(--...feedback...)`                    | Text size                                                                            |
| `--ngx-form-field-char-count-line-height`          | `1.25`                                     | Line height (char-count uses tighter line-height than the other feedback surfaces)   |
| `--ngx-form-field-char-count-color-ok`             | `rgba(50, 65, 85, 0.75)`                   | Neutral state color                                                                  |
| `--ngx-form-field-char-count-color-warning`        | `#a16207`                                  | Warning threshold color                                                              |
| `--ngx-form-field-char-count-color-danger`         | `#db1818`                                  | Critical threshold color                                                             |
| `--ngx-form-field-char-count-color-exceeded`       | `#991b1b`                                  | Limit exceeded color                                                                 |
| `--ngx-form-field-char-count-weight-exceeded`      | `600`                                      | Font weight when exceeded                                                            |
| `--ngx-form-field-char-count-padding-inline-start` | `var(--...feedback-padding-horizontal...)` | Start-edge padding                                                                   |
| `--ngx-form-field-char-count-padding-inline-end`   | `var(--...feedback-padding-horizontal...)` | End-edge padding                                                                     |
| `--ngx-form-field-char-count-warning-threshold`    | `80`                                       | Percent of `maxLength` at which the color switches to warning (plain number, no `%`) |
| `--ngx-form-field-char-count-danger-threshold`     | `95`                                       | Percent of `maxLength` at which the color switches to danger (plain number, no `%`)  |

Both padding tokens fall back to the shared
`--ngx-signal-form-feedback-padding-horizontal` first — `0.5rem` inside the
wrapper, where it aligns the count with the input text. Used fully standalone,
the last-resort fallbacks are `0` (start) and `0.5rem` (end).

**Threshold tokens (pre-v1 breaking change, #355):** there is no
`colorThresholds` component input anymore. The warning/danger breakpoints
are CSS-only, resolved by the component's own `color-mix()`/`clamp()`
expression against the two public threshold tokens above. A wrapper
restyling `ngx-form-field-character-count` overrides the thresholds purely
in CSS — no template change, no new input to thread through. The `exceeded`
state (>100% used) is not configurable: it is tied to the field's actual
`maxLength`, not a percentage. `[liveAnnounce]` announcement wording always
uses the fixed 80/95 defaults, regardless of any threshold-token override —
see [Migrating: beta to v1](../../../docs/MIGRATING_BETA_TO_V1.md) for the
accessibility rationale.

Following the same pattern as the rest of the toolkit, the implementation
resolves the two public threshold tokens into pseudo-private
`--_char-count-warning-threshold` / `--_char-count-danger-threshold`
copies, then derives two more `--_char-count-is-warning` /
`--_char-count-is-danger` intermediates (the 0/1 "threshold crossed"
toggles the `color-mix()` blend consumes). All four are internal-only —
never override them; they are not part of the public contract and can
change shape without notice.

`--ngx-form-field-char-count-percent-used` is different from the four
`--_char-count-*` internals above: it is set by the component itself and
consumed by its own `color-mix()` expression, but it stays in the public
`--ngx-form-field-*` namespace — same status as
[`--ngx-form-field-hint-display`](#hints): an **internal coordination
hook, not a theming knob**. It is documented here for transparency (e.g.
debugging computed styles), not as something to set.

### Marking Legend

**Component:** `ngx-form-marking-legend`

Renders the one-line "* indicates a required field" caption above a form, so
the meaning of the per-field markers is stated once rather than guessed. It
sits outside `ngx-form-field-wrapper` and does not inherit the Shared Feedback
layer — it is body copy, not micro-copy, so it carries its own two tokens.

| Property                              | Default                  | Description       |
| :------------------------------------ | :----------------------- | :---------------- |
| `--ngx-form-marking-legend-font-size` | `0.875rem`               | Legend font size  |
| `--ngx-form-marking-legend-color`     | `rgba(50, 65, 85, 0.85)` | Legend text color |

The default color is deliberately darker than the
`--ngx-form-field-color-text-secondary` used for labels and hints
(`rgba(50, 65, 85, 0.75)`). The legend is the only place the marker's meaning
is written down, so it is held to body-text contrast rather than the muted
tone that supporting copy can afford: it resolves to ~6.6:1 on white, against
~4.9:1 for the secondary tone. If you re-theme it, keep it at or above 4.5:1
against the page background — WCAG 1.4.3 AA.

Which marker the legend names comes from the `showMarkerWhen` /
`requiredMarker` / `optionalMarker` config (or the matching inputs), not from
CSS — see the [`/assistive` README](../assistive/README.md#ngxformmarkinglegend).

### Assistive Row

**Owner:** `NgxFormFieldWrapper` (inlined assistive row)

Layout container for hint/error and character count alignment.

| Property                                    | Default                                                  | Description                                           |
| :------------------------------------------ | :------------------------------------------------------- | :---------------------------------------------------- |
| `--ngx-form-field-assistive-min-height`     | `--ngx-signal-form-feedback-line-height` (`1rem`)        | Reserved line, prevents layout shift when errors show |
| `--ngx-form-field-assistive-gap`            | `0.5rem`                                                 | Gap between left and right content                    |
| `--ngx-form-field-assistive-margin-top`     | `0`                                                      | Spacing above assistive row                           |
| `--ngx-form-field-assistive-margin-bottom`  | `0`                                                      | Spacing below assistive row                           |
| `--ngx-form-field-assistive-transition`     | `min-height 150ms ease-out, margin-block 150ms ease-out` | Animation for reservation changes                     |
| `--ngx-form-field-assistive-empty-behavior` | `reserve`                                                | `reserve` (default) or `collapse` — see below         |

#### Reserved space

The assistive row is reserved by default so a field does not shift when its hint
is swapped for an error or warning. The reservation is exactly one caption line
(`--ngx-signal-form-feedback-line-height`, `1rem`) — 16px by default, matching
the design. Feedback aligns directly beneath the field border by default; use
the public margin properties when a product needs extra separation. Multi-line
messages grow the row, which is the only accepted shift. Reservation changes use
a short 150ms `ease-out` transition; motion is disabled for
`prefers-reduced-motion`.

The reservation is deliberate, not an oversight: a row that collapses when
empty shifts the field's layout the instant an error or warning appears,
which is worse for users tracking focus than a permanently reserved line. An
earlier PR (#248) advertised a `--ngx-form-field-assistive-empty-display`
token in its description as the opt-out for this behavior; that token was
never implemented — the PR reversed the change mid-review and merged with a
stale description. It does not exist in this package. The supported opt-out
is `--ngx-form-field-assistive-empty-behavior` (below) or, for most cases,
setting `--ngx-form-field-assistive-min-height: 0` directly.

Scale or collapse the reserved space per form scope:

```css
.my-form {
  --ngx-form-field-assistive-min-height: 1.25rem;
}

.my-compact-form {
  --ngx-form-field-assistive-min-height: 0;
}
```

#### Collapsing content-less rows

Whether `--ngx-form-field-assistive-min-height` reserves space unconditionally
depends on `--ngx-form-field-assistive-empty-behavior`. Under the default,
`reserve`, `--ngx-form-field-assistive-min-height` always reserves space,
whether or not the row carries a hint, error, warning or character count —
for most consumers that is the right default and the simplest override.

Under `collapse`, that changes for the narrower case of a row with **no
assistive content at all**: it drops to zero height regardless of what
`--ngx-form-field-assistive-min-height` is set to, while a row that does
carry content still reserves normally. Reach for
`--ngx-form-field-assistive-min-height: 0` first; reach for this token only
when some fields in a form need the reservation and others do not, or when
the reservation should disappear only in the fully-empty case rather than
shrinking every row's baseline height.

```css
.my-compact-form {
  --ngx-form-field-assistive-empty-behavior: collapse;
}
```

Implemented as a CSS container style query (`@container style(...)`), so
browsers without support simply keep the reserved default — the same
behavior they already had, not a regression.

### Fieldset

**Component:** `ngx-form-fieldset`

Groups related fields with consistent spacing.

Like `ngx-form-field-wrapper`, the fieldset now resolves its public CSS API
through an internal token layer plus pseudo-private aliases. In other words:

- internal defaults live on `--_fieldset-*` tokens
- public overrides come from `--ngx-signal-form-fieldset-*`
- implementation reads only the resolved `--_*` variables

That keeps default values defined in one place and avoids repeating literal
fallbacks throughout the stylesheet.

#### Layout & spacing

- `--ngx-signal-form-fieldset-gap` — default `1rem`; spacing between grouped controls
- `--ngx-signal-form-fieldset-padding` — default `1rem`; inner padding around the surfaced fieldset content
- `--ngx-signal-form-fieldset-message-inset-inline-start` — default `0`; moves the grouped summary horizontally from the start edge
- `--ngx-signal-form-fieldset-message-inset-inline-end` — default `0`; moves the grouped summary horizontally from the end edge
- `--ngx-signal-form-fieldset-notification-inset-inline-start` — default `0`; start inset specifically for notification-style grouped summaries
- `--ngx-signal-form-fieldset-notification-inset-inline-end` — default `0`; end inset specifically for notification-style grouped summaries
- `--ngx-signal-form-fieldset-border-radius` — default `0.75rem`; outer fieldset border radius
- `--ngx-signal-form-fieldset-surface-border-radius` — default `var(--...fieldset-radius...)`; optional override for the inner surfaced content radius
- `--ngx-signal-form-fieldset-bg` — default `transparent`; base fieldset background token
- `--ngx-signal-form-fieldset-surface-bg` — default `var(--...fieldset-bg...)`; background behind grouped controls, below the legend
- `--ngx-signal-form-fieldset-neutral-surface-bg` — default subtle neutral tint; base fill for `surfaceTone="neutral"`
- `--ngx-signal-form-fieldset-info-surface-bg` — default subtle info tint; base fill for `surfaceTone="info"`
- `--ngx-signal-form-fieldset-success-surface-bg` — default subtle success tint; base fill for `surfaceTone="success"`
- `--ngx-signal-form-fieldset-warning-surface-base-bg` — default `var(--ngx-signal-form-fieldset-notification-warning-bg)`; base fill for `surfaceTone="warning"`
- `--ngx-signal-form-fieldset-danger-surface-bg` — default `var(--ngx-signal-form-fieldset-notification-error-bg)`; base fill for `surfaceTone="danger"`
- `--ngx-signal-form-fieldset-legend-color` — default `var(--...fieldset-color...)`; legend text color in default state
- `--ngx-signal-form-fieldset-legend-font-size` — default `0.875rem`; legend font size
- `--ngx-signal-form-fieldset-legend-font-family` — default `var(--typography-font-family, inherit)`; legend font family
- `--ngx-signal-form-fieldset-legend-line-height` — default `1.25rem`; legend line height
- `--ngx-signal-form-fieldset-legend-font-weight` — default `500`; legend font weight
- `--ngx-signal-form-fieldset-legend-letter-spacing` — default `0`; legend letter spacing
- `--ngx-signal-form-fieldset-legend-bg` — default `transparent`; legend background that stays separate from the surfaced content
- `--ngx-signal-form-fieldset-legend-border-radius` — default `0.25rem`; legend background radius
- `--ngx-signal-form-fieldset-legend-inset-inline-start` — default `0.5rem`; start-edge inset for the projected legend
- `--ngx-signal-form-fieldset-invalid-border-color` — default `#db1818`; border color when errors are shown
- `--ngx-signal-form-fieldset-warning-border-color` — default `#a16207`; border color when warnings are shown
- `--ngx-signal-form-fieldset-invalid-surface-bg` — default `var(--...invalid-bg...)`; error-tinted background below the legend
- `--ngx-signal-form-fieldset-warning-surface-bg` — default `var(--...notification-warning-bg...)`; warning-tinted background below the legend
- `--ngx-signal-form-fieldset-invalid-legend-color` — default `var(--...invalid-border...)`; legend color in error state
- `--ngx-signal-form-fieldset-warning-legend-color` — default `var(--...warning-border...)`; legend color in warning state
- `--ngx-signal-form-fieldset-invalid-legend-bg` — default `var(--...legend-bg...)`; optional legend background in error state
- `--ngx-signal-form-fieldset-warning-legend-bg` — default `var(--...legend-bg...)`; optional legend background in warning state
- `--ngx-signal-form-fieldset-message-padding` — default `0`; grouped summary container padding
- `--ngx-signal-form-fieldset-message-padding-inline-start` — default `var(--...feedback-padding-horizontal...)`; grouped summary start padding
- `--ngx-signal-form-fieldset-message-padding-inline-end` — default `var(--...feedback-padding-horizontal...)`; grouped summary end padding
- `--ngx-signal-form-fieldset-message-border-width` — default `0`; grouped summary border width
- `--ngx-signal-form-fieldset-message-border-radius` — default `0`; grouped summary border radius
- `--ngx-signal-form-fieldset-message-spacing` — default `0.25rem`; spacing between grouped summary messages
- `--ngx-signal-form-fieldset-message-list-style` — default `var(--...feedback-list-style...)`; grouped summary `list-style` shorthand (type + position)
- `--ngx-signal-form-fieldset-message-list-padding-inline-start` — default `var(--...feedback-list-indent...)`; grouped summary list indent
- `--ngx-signal-form-fieldset-message-animation` — default `ngx-status-slide-in 300ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards`; grouped summary entry animation
- `--ngx-signal-form-fieldset-error-color` — default cascades through `--ngx-signal-form-error-color` before falling back to the internal danger tone; grouped error text color
- `--ngx-signal-form-fieldset-error-bg` — default cascades through `--ngx-signal-form-error-bg` before falling back to `transparent`; grouped error background
- `--ngx-signal-form-fieldset-error-border-color` — default cascades through `--ngx-signal-form-error-border-color` before falling back to `transparent`; grouped error border color
- `--ngx-signal-form-fieldset-warning-color` — default cascades through `--ngx-signal-form-warning-color` before falling back to the internal warning tone; grouped warning text color
- `--ngx-signal-form-fieldset-warning-bg` — when set, overrides both the host warning surface background and the grouped warning message background; otherwise each layer falls back to its own internal default
- `--ngx-signal-form-fieldset-warning-border-color` — default cascades through `--ngx-signal-form-warning-border-color` before falling back to `transparent`; grouped warning border color
- `--ngx-signal-form-fieldset-border-color` — default internal border tone; fieldset host border color
- `--ngx-signal-form-fieldset-border-width` — default internal border width; fieldset host border width
- `--ngx-signal-form-fieldset-color` — default internal text tone; primary fieldset text color
- `--ngx-signal-form-fieldset-muted-color` — default internal muted text tone; secondary fieldset text color
- `--ngx-signal-form-fieldset-legend-padding` — default internal spacing pair; padding applied to the projected `<legend>`
- `--ngx-signal-form-fieldset-invalid-bg` — default `var(--...bg-danger-surface...)` (`#fbdddd`); error-tinted fill behind grouped content (pairs with `-invalid-surface-bg` when the invalid surface should differ)
- `--ngx-signal-form-fieldset-message-margin-top` — default `var(--_fieldset-gap)`; top margin for the grouped message container
- `--ngx-signal-form-fieldset-message-margin-bottom` — default `var(--_fieldset-gap)`; bottom margin for the grouped message container
- `--ngx-signal-form-fieldset-content-offset` — default `0`; horizontal offset applied to the surface/content area relative to the fieldset edge
- `--ngx-signal-form-fieldset-notification-list-padding-inline-start` — default `var(--_feedback-list-indent)`; notification card list indent
- `--ngx-signal-form-fieldset-notification-error-bg` — grouped notification card background for errors
- `--ngx-signal-form-fieldset-notification-error-border-color` — grouped notification card border color for errors
- `--ngx-signal-form-fieldset-notification-list-style` — grouped notification card `list-style` shorthand
- `--ngx-signal-form-fieldset-notification-warning-bg` — grouped notification card background for warnings
- `--ngx-signal-form-fieldset-notification-warning-border-color` — grouped notification card border color for warnings

Grouped panel cards use the fieldset notification background, border, and list
tokens above. Their text color follows the panel-specific
`--ngx-signal-form-error-panel-color` /
`--ngx-signal-form-warning-panel-color` tokens; the former
`--ngx-signal-form-fieldset-notification-error-color` /
`-warning-color` overrides were removed along with the old split.

The fieldset host also exposes `data-appearance`, `data-feedback-appearance`,
`data-surface-tone`, `data-validation-surface`, and `data-has-messages`
attributes for custom CSS hooks.

The fieldset uses two visual layers by design:

- the **host** owns the semantic border
- the inner **surface** owns the tinted background
- the **legend** stays outside that tinted surface unless you explicitly theme it

That keeps radio-group and checkbox-group labels readable while still giving the grouped controls a visible error or warning container.

Fieldset-level grouped feedback is always surfaced through a notification card
(or the compact `feedbackAppearance="plain"` variant) above or below the
controls. Inline validation surfaces for radio/checkbox clusters live on
`ngx-form-field-wrapper` instead — see the form-field wrapper README for the
selection-cluster recipe.

Validation tinting on `ngx-form-fieldset` is opt-in:

- `validationSurface="never"` (default) keeps the surface neutral and relies on
  the grouped message alone
- `validationSurface="always"` tints every invalid/warning fieldset surface

Grouped summaries intentionally inherit from the shared `ngx-form-field-error`
tokens by default. The fieldset-specific variables above are aliases for the
fieldset use case, so you can tune a grouped summary without changing every
leaf-level error in the app.

When the fieldset resolves to notification-style grouped feedback, the grouped
message card also inherits the fieldset recipe (including list-style
customizations) through the fieldset notification variables above.

Notification-style grouped summaries intentionally default to **full width and
flush start alignment** within the fieldset message slot. If you want to indent
only notification cards, use the dedicated `--ngx-signal-form-fieldset-notification-inset-*`
tokens instead of the generic grouped-message inset tokens.

#### Align a radio-group summary with option labels

```css
.shipping-method-fieldset {
  --ngx-signal-form-fieldset-message-inset-inline-start: 1.5rem;
  --ngx-signal-form-fieldset-message-padding-inline-start: 0;
}
```

That pattern is useful when text-input groups should keep the default inset,
but radio or checkbox groups need the summary to line up with option labels
instead of the fieldset edge.

#### Distinguish grouped summaries from leaf-level errors

```css
.credentials-fieldset {
  --ngx-signal-form-fieldset-content-offset: 0;
  --ngx-signal-form-fieldset-message-inset-inline-start: 0.875rem;
  --ngx-signal-form-fieldset-message-padding-inline-start: 0;
  --ngx-signal-form-fieldset-message-padding-inline-end: 0;
  --ngx-signal-form-fieldset-message-list-style: disc inside;
  --ngx-signal-form-fieldset-message-list-padding-inline-start: 0;
}
```

That recipe does two things:

- removes the extra gap between a top-positioned grouped summary and the first row of controls
- makes the grouped summary visually distinct from leaf-level inline errors

If you want the summary to read like plain text again, set
`--ngx-signal-form-fieldset-message-list-style: none`.

---

## 3. Form Field Component

**Component:** `ngx-form-field-wrapper`

This component wraps your `label` and `input` to provide layout, borders, and states.

### Layout Modes: Standard, Outline, and Plain

The form field wrapper supports three appearance modes via the `appearance` input:

#### Standard layout (`appearance="standard"` or default)

- Label positioned above the input
- Traditional label-above-field form field design
- Uses `--ngx-form-field-label-*` properties
- Uses `--ngx-form-field-input-*` properties

#### Outline layout (`appearance="outline"`)

- Material Design inspired floating label inside border
- Label sits inside the input container
- Uses `--ngx-form-field-outline-label-*` properties
- Uses `--ngx-form-field-outline-input-*` properties
- Requires CSS `:has()` selector (Chrome 105+, Firefox 121+, Safari 15.4+)

#### Plain layout (`appearance="plain"`)

- Keeps wrapper semantics, labels, hints, and errors
- Removes border and background chrome from the field container
- Best for custom controls that draw their own focus or visual treatment

```html
<!-- Standard (default) -->
<ngx-form-field-wrapper [formField]="form.email" appearance="standard">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-form-field-wrapper>

<!-- Outline -->
<ngx-form-field-wrapper [formField]="form.email" appearance="outline">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-form-field-wrapper>
```

> **Note:** The semantic colors below apply to both layouts. Layout-specific properties (labels, input styling) are documented in separate sections.

### Semantic Color Scale (The "Knobs")

**Start here.** Changing these variables will automatically update focus rings, borders, text, and backgrounds across all states.

| Property                                | Default                  | Used For                         |
| :-------------------------------------- | :----------------------- | :------------------------------- |
| `--ngx-form-field-color-primary`        | `#007bc7`                | Focus states, active borders     |
| `--ngx-form-field-color-error`          | `#db1818`                | Invalid states, required markers |
| `--ngx-form-field-color-warning`        | `#a16207`                | Warning states                   |
| `--ngx-form-field-color-text`           | `#324155`                | Input text                       |
| `--ngx-form-field-color-text-secondary` | `rgba(50, 65, 85, 0.75)` | Labels, placeholders, hints      |
| `--ngx-form-field-color-surface`        | `#ffffff`                | Input background                 |
| `--ngx-form-field-color-border`         | `rgba(50, 65, 85, 0.25)` | Default borders                  |
| `--ngx-form-field-color-border-hover`   | `#324155`                | Hover borders                    |
| `--ngx-form-field-color-disabled`       | `#f3f4f6`                | Disabled background              |

### Specific Overrides

If the semantic colors aren't enough, you can override specific parts of the component.

> **Layout-Specific Properties:** Properties prefixed with `--ngx-form-field-outline-*` only apply when `appearance="outline"`. Standard layout uses the non-prefixed variants (e.g., `--ngx-form-field-label-*` vs `--ngx-form-field-outline-label-*`).
>
> The older `--ngx-form-field-outline-label-font-size` and `--ngx-form-field-outline-input-font-size` names still resolve as legacy aliases for the corresponding `-size` tokens. Prefer the `-size` names in new code.

#### Layout & Spacing

**Applies to both standard and outline layouts.**

| Property                              | Default                                                                           | Description                                                                                                    |
| :------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| `--ngx-form-field-padding-vertical`   | `0.25rem`                                                                         | Vertical padding inside the border                                                                             |
| `--ngx-form-field-padding-horizontal` | `0.5rem`                                                                          | Horizontal padding inside the border                                                                           |
| `--ngx-form-field-input-padding`      | `var(--ngx-form-field-padding-vertical) var(--ngx-form-field-padding-horizontal)` | Combined input padding                                                                                         |
| `--ngx-form-field-radius`             | `0.25rem`                                                                         | Border radius                                                                                                  |
| `--ngx-form-field-min-height`         | derived (`2.75rem` by default)                                                    | Minimum height of the outlined container: label line-height + label gap + input line-height + vertical padding |
| `--ngx-form-field-gap`                | `0.125rem`                                                                        | Gap between label and input                                                                                    |
| `--ngx-form-field-margin`             | `1rem`                                                                            | Bottom margin for field wrapper (set to `0` when a grid/flex `gap` already spaces fields)                      |

#### Prefix & Suffix

**Applies to both standard and outline layouts.**

| Property                        | Default                                      | Description               |
| :------------------------------ | :------------------------------------------- | :------------------------ |
| `--ngx-form-field-prefix-gap`   | `0.5rem`                                     | Gap after prefix content  |
| `--ngx-form-field-suffix-gap`   | `0.5rem`                                     | Gap before suffix content |
| `--ngx-form-field-prefix-color` | `var(--ngx-form-field-color-text-secondary)` | Prefix color              |
| `--ngx-form-field-suffix-color` | `var(--ngx-form-field-color-text-secondary)` | Suffix color              |

#### Labels (Standard Layout)

**Only applies when `appearance="standard"` (default).**

| Property                               | Default                                      | Description         |
| :------------------------------------- | :------------------------------------------- | :------------------ |
| `--ngx-form-field-label-size`          | `0.75rem`                                    | Label font size     |
| `--ngx-form-field-label-weight`        | `400`                                        | Label font weight   |
| `--ngx-form-field-label-font-family`   | `inherit`                                    | Label font family   |
| `--ngx-form-field-label-color`         | `var(--ngx-form-field-color-text-secondary)` | Label text color    |
| `--ngx-form-field-label-line-height`   | `1rem`                                       | Label line height   |
| `--ngx-form-field-label-padding-start` | `0.125rem`                                   | Label start padding |

#### Labels (Outlined Layout)

**Only applies when `appearance="outline"`.**

| Property                                     | Default                                      | Description                |
| :------------------------------------------- | :------------------------------------------- | :------------------------- |
| `--ngx-form-field-outline-label-size`        | `0.75rem`                                    | Outlined label font size   |
| `--ngx-form-field-outline-label-gap`         | `0rem`                                       | Gap under outlined label   |
| `--ngx-form-field-outline-label-weight`      | `400`                                        | Outlined label font weight |
| `--ngx-form-field-outline-label-font-family` | `inherit`                                    | Outlined label font family |
| `--ngx-form-field-outline-label-color`       | `var(--ngx-form-field-color-text-secondary)` | Outlined label color       |
| `--ngx-form-field-outline-label-line-height` | `1rem`                                       | Outlined label line height |

#### Field Markers

Markers render in every appearance (standard, outline, plain). Which fields are
marked is controlled by the `showMarkerWhen` config / input
(`'required' \| 'optional' \| 'none'`). The host carries a `data-marker`
attribute (`"required"` / `"optional"` / absent) for additional styling hooks.

| Property                                   | Default                             | Description             |
| :----------------------------------------- | :---------------------------------- | :---------------------- |
| `--ngx-form-field-required-marker-color`   | `var(--ngx-form-field-color-error)` | Required marker color   |
| `--ngx-form-field-required-marker-weight`  | `600`                               | Required marker weight  |
| `--ngx-form-field-optional-marker-color`   | `currentColor` (muted)              | Optional marker color   |
| `--ngx-form-field-optional-marker-weight`  | `400`                               | Optional marker weight  |
| `--ngx-form-field-optional-marker-opacity` | `0.7`                               | Optional marker opacity |

#### Input (Standard Layout)

**Only applies when `appearance="standard"` (default).**

| Property                             | Default                                      | Description        |
| :----------------------------------- | :------------------------------------------- | :----------------- |
| `--ngx-form-field-input-size`        | `0.875rem`                                   | Input font size    |
| `--ngx-form-field-input-font-family` | `inherit`                                    | Input font family  |
| `--ngx-form-field-input-line-height` | `1.25rem`                                    | Input line height  |
| `--ngx-form-field-input-weight`      | `400`                                        | Input font weight  |
| `--ngx-form-field-input-color`       | `var(--ngx-form-field-color-text)`           | Input text color   |
| `--ngx-form-field-input-bg`          | `var(--ngx-form-field-color-surface)`        | Input background   |
| `--ngx-form-field-border-color`      | `var(--ngx-form-field-color-border)`         | Input border color |
| `--ngx-form-field-placeholder-color` | `var(--ngx-form-field-color-text-secondary)` | Placeholder color  |

#### Input (Outlined Layout)

**Only applies when `appearance="outline"`.**

| Property                                     | Default                            | Description                |
| :------------------------------------------- | :--------------------------------- | :------------------------- |
| `--ngx-form-field-outline-input-size`        | `0.875rem`                         | Outlined input font size   |
| `--ngx-form-field-outline-input-font-family` | `inherit`                          | Outlined input font family |
| `--ngx-form-field-outline-input-line-height` | `1.25rem`                          | Outlined input line height |
| `--ngx-form-field-outline-input-weight`      | `400`                              | Outlined input font weight |
| `--ngx-form-field-outline-input-color`       | `var(--ngx-form-field-color-text)` | Outlined input text color  |

#### States & Focus

**Applies to both standard and outline layouts.**

| Property                                | Default                                                               | Description                                                                           |
| :-------------------------------------- | :-------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| `--ngx-form-field-focus-color`          | `var(--ngx-form-field-color-primary)`                                 | Focus border color                                                                    |
| `--ngx-form-field-focus-box-shadow`     | `0 0 0 4px color-mix(in srgb, var(--focus-color) 25%, transparent)`   | Focus ring                                                                            |
| `--ngx-form-field-hover-border-color`   | `var(--ngx-form-field-color-border-hover)`                            | Hover border color                                                                    |
| `--ngx-form-field-invalid-color`        | `var(--ngx-form-field-color-error)`                                   | Invalid border color                                                                  |
| `--ngx-form-field-warning-color`        | `var(--ngx-form-field-color-warning)`                                 | Warning border color                                                                  |
| `--ngx-form-field-warning-box-shadow`   | `0 0 0 4px color-mix(in srgb, var(--warning-color) 25%, transparent)` | Warning ring                                                                          |
| `--ngx-form-field-disabled-bg`          | `var(--ngx-form-field-color-disabled)`                                | Disabled background                                                                   |
| `--ngx-form-field-disabled-opacity`     | `0.6`                                                                 | Disabled opacity                                                                      |
| `--ngx-form-field-state-ring-opacity`   | `25%`                                                                 | Opacity of the color-mix focus/invalid/warning ring (registered via `@property`)      |
| `--ngx-form-field-hover-state-opacity`  | `6%`                                                                  | Hover tint on interactive prefix/suffix buttons (registered via `@property`)          |
| `--ngx-form-field-active-state-opacity` | `10%`                                                                 | Active/pressed tint on interactive prefix/suffix buttons (registered via `@property`) |

### Horizontal Layout

Set `orientation="horizontal"` on `ngx-form-field-wrapper` (or configure
`defaultFormFieldOrientation: 'horizontal'` globally) to place the label
to the **left** of the input.

This mode applies to **standard** and **plain** wrappers. `appearance="outline"`
always resolves back to vertical because its floating-label treatment depends on
the label staying inside the outlined container. Selection controls (checkbox,
switch, radio-group) are also excluded and keep their inline layout.

| Property                                   | Default   | Description                                                       |
| :----------------------------------------- | :-------- | :---------------------------------------------------------------- |
| `--ngx-form-field-horizontal-gap`          | `0.75rem` | Gap between label column and input column                         |
| `--ngx-form-field-label-width`             | `8rem`    | Shared width of the label column in horizontal layouts            |
| `--ngx-form-field-horizontal-label-align`  | `start`   | Horizontal text alignment of the label (`start`, `center`, `end`) |
| `--ngx-form-field-horizontal-label-valign` | `center`  | Vertical alignment of the label (`start`, `center`, `end`)        |

A `data-orientation` attribute (`vertical` | `horizontal`) is also exposed for
custom CSS hooks.

Horizontal wrappers now default to a compact shared label column so the field
controls line up out of the box without wasting horizontal space. Override the
width when a tighter or wider column fits your form better.

Orientation changes a single field wrapper only. Parent form layouts stay under
consumer control, so multi-column grids can stay as-is or collapse to one field
row per line when a page wants the extra horizontal breathing room.

#### Wider aligned label column example

```css
ngx-form-field-wrapper {
  --ngx-form-field-label-width: 10rem;
  --ngx-form-field-horizontal-gap: 1.5rem;
}
```

### Fieldset Direction

Set `--ngx-signal-form-fieldset-direction` to `row` on a fieldset to lay out its
children side by side (e.g. for inline radio-button groups or short related
fields).

```css
ngx-form-fieldset {
  --ngx-signal-form-fieldset-direction: row;
}
```

### Wrapper selection groups

Grouped radios and grouped checkboxes that live inside
`ngx-form-field-wrapper` expose a separate theming surface from the fieldset.
These wrappers keep normal inline feedback placement, but swap the usual border
state for a surfaced background when invalid or warning.

| Property                                      | Default                                                      | Description                                                                                   |
| :-------------------------------------------- | :----------------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| `--ngx-form-field-selection-group-gap`        | `0.75rem`                                                    | Vertical gap between grouped options                                                          |
| `--ngx-form-field-selection-group-padding`    | `0.75rem`                                                    | Inner padding of the grouped control surface                                                  |
| `--ngx-form-field-selection-group-radius`     | `0.25rem`                                                    | Border radius of the grouped control surface                                                  |
| `--ngx-form-field-selection-group-bg`         | `transparent`                                                | Base surface background                                                                       |
| `--ngx-form-field-selection-group-invalid-bg` | `color-mix(in srgb, var(--_invalid-color) 12%, transparent)` | Invalid surface background                                                                    |
| `--ngx-form-field-selection-group-warning-bg` | `color-mix(in srgb, var(--_warning-color) 12%, transparent)` | Warning surface background                                                                    |
| `--ngx-form-field-touch-target`               | `2rem`                                                       | Row hit-target size for checkbox, switch, and padded rows — see "Selection target size" below |

Example:

```css
.delivery-method-wrapper {
  --ngx-form-field-selection-group-padding: 1rem;
  --ngx-form-field-selection-group-invalid-bg: #fce2e2;
}
```

### Selection target size

Checkbox rows, switch rows, and padded custom controls all size their
interaction area from one shared token: `--_field-touch-target`, default
`2rem` (32px). It now resolves through a public custom property so a
consumer can retune density from any ancestor scope:

```css
--_field-touch-target: var(--ngx-form-field-touch-target, 2rem);
```

See `--ngx-form-field-touch-target` in the property table above.

**Why 32px, not 24px.** WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA,
requires **24×24 CSS px**. SC 2.5.5 Target Size (Enhanced), Level AAA,
requires **44×44**. 32px is not a WCAG figure at either level — it is the
24px AA floor plus deliberate headroom, so a border or a sub-pixel rounding
error cannot drop the rendered box under the AA minimum. It stays below the
44px AAA bar; a consumer that wants AAA-level targets sets
`--ngx-form-field-touch-target: 2.75rem` (44px) explicitly.

**Overriding below 24px forfeits SC 2.5.8.** The token has no built-in
floor — setting it under `1.5rem` (24px) renders a control that fails the
WCAG 2.2 AA target-size criterion. That is a valid choice for a density
mode a product accepts responsibility for, not a toolkit default.

**One shared token, not a selection-only sibling.** The switch row renders
through the same `--_selection-row-min-block-size` derivation as checkbox
and selection-group rows and therefore keeps a WCAG-2.2-AA-compliant
height by default too — a padded custom control has the same touch-target
problem as a checkbox, so it intentionally is not split into a separate
token.

**Ownership boundary.** The wrapper guarantees the interaction area of its
own rows (checkbox, switch, selection-group). Projected group containers,
`<legend>` elements, and `<fieldset>` markup sit outside the wrapper's
style encapsulation and are consumer-owned — the consumer applies its own
sizing and spacing at the app level, the same way it owns
`--ngx-form-field-selection-group-gap` layout above. `--ngx-form-field-touch-target`
does not reach into that projected composition.

**Radio rows are consumer-owned too, including a lone radio.** Every
`<input type="radio">` resolves to the `radio-group` control kind, which
always renders through the wrapper's selection-cluster layout — the same
projected, consumer-owned composition described above — regardless of
whether the radio is actually grouped with siblings. `--ngx-form-field-touch-target`
does not drive a radio row's height. Where a lone radio's row still measures
above the 24px AA floor by default, that comes from the selection-cluster's
own padding token, not from this touch-target contract; a consumer building
a custom radio-group layout owns its row sizing directly, the same way the
demo's own grouped-radio composition does.

```css
.compact-form {
  --ngx-form-field-touch-target: 1.5rem; /* 24px — AA floor, no headroom */
}
```

---

## 4. Recipes & Common Scenarios

### Scenario A: "I just want it to match my Brand"

Redefine the semantic colors in your global styles or component.

```css
/* Apply to all fields */
ngx-form-field-wrapper {
  --ngx-form-field-color-primary: #6da305; /* My Brand Green */
  --ngx-form-field-color-error: #d93025; /* My Error Red */
}
```

**Runnable example:** the demo's
[Brand Theming](../../../apps/demo/src/app/04-form-field-wrapper/brand-theming/README.md)
page (`/form-field-wrapper/brand-theming`) re-themes every semantic color —
including the error, warning, disabled, and focus states this snippet leaves
on the stock palette — for both light and dark, with computed contrast
ratios in its README. It overrides only the public tokens documented on this
page (`--ngx-form-field-color-*` plus the cross-cutting
`--ngx-signal-form-error-color` / `--ngx-signal-form-warning-color` /
`--ngx-form-field-hint-color` tokens from the sections above); the internal `--_field-*` / `--_*`
pseudo-private tokens are never touched. A partial override like the
two-line snippet above is a fine starting point, but skips exactly the
stateful colors that are easiest to leave inconsistent — see that page for
the full-coverage version.

### Scenario B: Framework Integration (Bootstrap/Tailwind)

Map your framework's variables to the toolkit's semantic layer.

**Bootstrap Example:**

```css
ngx-form-field-wrapper {
  --ngx-form-field-color-primary: var(--bs-primary, #0d6efd);
  --ngx-form-field-color-border: var(--bs-border-color, #dee2e6);
  --ngx-form-field-color-text: var(--bs-body-color, #212529);
  --ngx-form-field-color-surface: var(--bs-body-bg, #ffffff);

  /* Use Bootstrap defaults for feedback text */
  --ngx-signal-form-feedback-font-size: 0.875rem;
  --ngx-signal-form-feedback-margin-top: 0.25rem;
}
```

### Scenario C: Dark Mode

The wrapper and fieldset use `prefers-color-scheme` as the default signal, and
also support explicit class-based theming such as `html.dark` / `html.light`.
Manual app theme selection should win over OS/browser preference, but only
when the user has actively chosen one — an absent class should defer back
to `prefers-color-scheme`.

> [!NOTE]
> The standalone feedback components (`ngx-form-field-error` in either inline
> or panel presentation, hints, character count) follow
> `prefers-color-scheme` only. Class-based ancestor theming is not detectable
> reliably across browsers from plain component CSS, so a class-driven dark
> mode should also map its dark tokens onto the public
> `--ngx-signal-form-error-*`, `--ngx-signal-form-warning-*`,
> `--ngx-signal-form-error-panel-*`,
> `--ngx-signal-form-warning-panel-*`, hint, and character-count variables.

If your app has a manual toggle, use this pattern:

```scss
/* app.scss or global styles */

/* 1. Define Dark Mode overrides */
@media (prefers-color-scheme: dark) {
  ngx-form-field-wrapper {
    --ngx-form-field-color-surface: #1f2937;
    --ngx-form-field-color-text: #f9fafb;
    /* ... other dark tokens */
  }
}

/* 2. Force Light Mode only when the user explicitly chose it */
html.light ngx-form-field-wrapper {
  --ngx-form-field-color-surface: #ffffff;
  --ngx-form-field-color-text: #324155;
  /* ... reset to light tokens */
}
```

> Use an explicit `.light` / `.dark` class for manual overrides rather than
> a `:not(.dark)` selector. `:not(.dark)` matches every page that has not
> opted into dark mode — including OS-dark users — and would silently
> cancel `prefers-color-scheme: dark`.

## Rendering without a label

When no `<label>` is projected into `ngx-form-field-wrapper`, the reserved
label space collapses automatically for textual controls in the
`standard` and `outline` appearances, across both vertical and horizontal
orientations:

- **Standard (vertical)** — the label slot is removed (`display: none`);
  the flex gap above the input also collapses.
- **Outline** — the floating-label slot inside the bordered container is
  dropped; `--_outline-min-height` shrinks to match the input's own
  line-height plus vertical padding.
- **Horizontal** — the grid collapses to a single content column; the
  input is flush against the wrapper's left edge.

Detection is pure CSS (`:has()`), so there is no opt-in. The `plain`
appearance is intentionally excluded because it already renders without
label-specific chrome. Selection controls (`checkbox`, `switch`,
`radio-group`) keep their own layouts and still require a visible label
for accessibility.

### Why you might still want to render an empty label

If you need rows of fields to align vertically in a grid regardless of
whether each row has a visible label, project an explicit empty label:

```html
<ngx-form-field-wrapper [formField]="form.quantity">
  <label for="quantity"></label>
  <input id="quantity" type="number" [formField]="form.quantity" />
</ngx-form-field-wrapper>
```

An empty `<label>` element still occupies the reserved space. For
accessibility, prefer giving the `<input>` an `aria-label` or
`aria-labelledby` so screen readers have a name to announce.

### Accessibility notes — placeholder is not a label

Using only a `placeholder` as the visible hint (even with a matching
`aria-label` for screen readers) is a well-known WCAG 3.3.2
antipattern: the hint disappears as soon as the user types, so sighted
users can lose the field's purpose mid-entry — especially with
autofill, copy/paste, or when returning to a partially-filled form.
Prefer one of the following when the labelless wrapper is appropriate
but you still need a persistent visible hint:

- a caption outside the wrapper (e.g. a shared heading for a group of
  related fields) paired with `aria-label` / `aria-labelledby`;
- an explicit `<label>` that sits above the input (non-labelless) when
  the field is self-contained;
- both a placeholder _and_ a label — the placeholder becomes a format
  hint (`"MM/DD"`, `"12345"`) rather than the name of the field.

The labelless collapse behavior itself is purely visual. It never
changes what is announced to assistive technology, which is always
driven by the `<label>`, `aria-label`, `aria-labelledby`, or
`aria-describedby` on the control.
