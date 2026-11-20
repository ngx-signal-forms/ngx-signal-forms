---
title: 'Theming guide'
sidebarTitle: 'form-field theming'
---

Style `@ngx-signal-forms/toolkit` components with standard CSS custom properties. Set public `--ngx-*` tokens on `:root`, a layout container, or an individual component host. Custom properties inherit across Angular's view encapsulation, so no `::ng-deep` is needed.

Do not override internal `--_*` variables. They are private implementation details and can change between releases.

## Contents

- [Quick start](#quick-start)
- [Dark mode](#dark-mode)
- [How the token layers work](#how-the-token-layers-work)
- [Browser support](#browser-support)
- [Shared feedback tokens](#shared-feedback-tokens)
- [Form field wrapper](#form-field-wrapper)
- [Fieldset](#fieldset)
- [Assistive components](#assistive-components)
- [Recipes](#recipes)

## Quick start

Override the semantic color tokens on `:root` or on `ngx-form-field-wrapper` to match your brand:

```css
:root {
  --ngx-form-field-color-primary: #2563eb;
  --ngx-form-field-color-error: #dc2626;
  --ngx-form-field-color-warning: #b45309;
}
```

For a full light and dark brand palette with verified contrast ratios, see the demo's [brand theming example](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/8dc0df8f01d3dc76f0fa035c8fc242ef1294cd72/apps/demo/src/app/04-form-field-wrapper/brand-theming/README.md).

<a id="scenario-c-dark-mode"></a>

## Dark mode

Every toolkit color default is a `light-dark(<light>, <dark>)` pair. The browser selects the side that matches the element's `color-scheme`. The toolkit does not look for a `.dark` class or query `prefers-color-scheme` itself.

Because `color-scheme` inherits, one declaration on `:root` updates every toolkit component:

- **Light only (default).** Declare nothing. `color-scheme: normal` resolves to light even on a dark OS.
- **Follow the OS.** Declare both schemes on `:root`:

```css
:root {
  color-scheme: light dark;
}
```

- **Class toggle (such as Tailwind's `.dark`).** Set `color-scheme` on the same selector that switches your theme:

```css
:root {
  color-scheme: light;
}

:root.dark {
  color-scheme: dark;
}
```

Or toggle `document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'` in TypeScript.

Dark defaults meet WCAG 2.2 AA contrast against the wrapper's dark surface (`#1f2937`). When you scope `color-scheme: dark` to a nested container instead of `:root`, give that container a dark background too so light text stays readable.

Setting a plain color on a `--ngx-*` token replaces both sides of the `light-dark()` default. Use `light-dark()` in your override to keep both modes distinct:

```css
ngx-form-field-wrapper {
  --ngx-form-field-color-surface: light-dark(#ffffff, #0f172a);
}
```

<a id="architecture-semantic-layering"></a>

## How the token layers work

Tokens cascade from broad to specific. Start at the top layer that covers what you need:

1. **Semantic colors (`--ngx-form-field-color-*`).** Set your brand, error, warning, text, surface, and border colors once. Borders, focus rings, labels, and markers inherit from them.
2. **Shared feedback (`--ngx-signal-form-feedback-*`).** Control micro-copy font size, line height, spacing, and list styling across errors, warnings, hints, character counts, and fieldsets at once.
3. **Component tokens.** Fine-tune one component or appearance (`--ngx-form-field-*`, `--ngx-signal-form-fieldset-*`, `--ngx-signal-form-error-*`, `--ngx-error-summary-*`, `--ngx-form-marking-legend-*`).

Normal CSS cascade rules still apply to projected markup. An explicit `font` or `color` rule on your own `<label>` beats the toolkit's token-driven rule.

## Browser support

The toolkit ships native CSS without Sass. The effective browser floor is **Chrome 123, Edge 123, Safari 17.5, and Firefox 121**:

| Feature                                                          | Chrome | Edge | Safari | Firefox |
| :--------------------------------------------------------------- | :----- | :--- | :----- | :------ |
| CSS custom properties                                            | 49     | 15   | 9.1    | 31      |
| `:has(...)` (outline, labelless, focus, disabled, and row rules) | 105    | 105  | 15.4   | 121     |
| `@container` size queries (narrow horizontal stacking)           | 105    | 105  | 16     | 110     |
| `@container style(...)` (optional empty assistive row collapse)  | 111    | 111  | 18     | 139     |
| `@property` (opacity tokens)                                     | 85     | 85   | 15.4   | 128     |
| `color-mix()`                                                    | 111    | 111  | 16.2   | 113     |
| Native CSS nesting (complete, including nested type selectors)   | 120    | 120  | 17.2   | 117     |
| `light-dark()` (color defaults)                                  | 123    | 123  | 17.5   | 120     |

Older browsers ignore `light-dark()`, so default colors resolve as unset. `@container style(...)` only powers the opt-in `--ngx-form-field-assistive-empty-behavior: collapse` mode; browsers without it keep the default reserved height. Media queries for `prefers-reduced-motion`, `prefers-contrast: more`, and `forced-colors: active` apply only where supported.

## Shared feedback tokens

Set these to change typography, spacing, and list styling across errors, warnings, hints, character counts, and fieldset messages together:

| Property                                        | Default        | Description                                            |
| :---------------------------------------------- | :------------- | :----------------------------------------------------- |
| `--ngx-signal-form-feedback-font-size`          | `0.75rem`      | Font size for feedback text                            |
| `--ngx-signal-form-feedback-line-height`        | `1rem`         | Line height for feedback text                          |
| `--ngx-signal-form-feedback-margin-top`         | `0`            | Spacing between control and feedback                   |
| `--ngx-signal-form-feedback-padding-horizontal` | `0.5rem`       | Horizontal padding for feedback text                   |
| `--ngx-signal-form-feedback-list-style`         | `disc outside` | `list-style` shorthand for bulleted lists              |
| `--ngx-signal-form-feedback-list-indent`        | `1.25rem`      | Start indent (`padding-inline-start`) for bullet lists |

## Form field wrapper

**Component:** `ngx-form-field-wrapper`

### Appearances

Choose an appearance with the `appearance` input or `defaultFormFieldAppearance` in config:

- **`standard` (default).** Label above a bordered control. Uses `--ngx-form-field-label-*` and `--ngx-form-field-input-*`.
- **`outline`.** Label sits inside the bordered container above the control as a static caption (no floating animation, no `placeholder=" "` hack). Uses `--ngx-form-field-outline-label-*` and `--ngx-form-field-outline-input-*`.
- **`plain`.** Removes border and background chrome while keeping labels, hints, errors, and ARIA. Projected controls keep their native or consumer-defined styling. Uses `--ngx-form-field-label-*` and draws a 2px `:focus-visible` outline (2px offset) on input-like controls using the focus, invalid, or warning color. If your app resets native control styles, keep a visible field boundary and keyboard focus indicator.

### Control-aware styling hooks

`ngx-form-field-wrapper` exposes host attributes you can target in CSS without coupling to internal markup:

- `data-ngx-signal-form-control-kind`: `input-like`, `standalone-field-like`, `switch`, `checkbox`, `radio-group`, `slider`, `composite`
- `data-ngx-signal-form-control-layout`: `stacked`, `inline-control`, `group`, `custom`
- `data-ngx-signal-form-control-aria-mode`: `auto`, `manual`
- `data-orientation`: `vertical`, `horizontal`
- `data-error-placement`: `top`, `bottom`
- `data-marker`: `required`, `optional` (omitted when unmarked)

For custom controls, declare semantics on the `[formField]` host with `ngxSignalFormControl` (for example `ngxSignalFormControl="input-like"` for a field-shaped custom select, or `appearance="plain"` for a widget-shaped `slider` or `composite`).

### Semantic color scale

These tokens apply across all wrapper appearances:

| Property                                | Default                                                         | Used for                                              |
| :-------------------------------------- | :-------------------------------------------------------------- | :---------------------------------------------------- |
| `--ngx-form-field-color-primary`        | `light-dark(#007bc7, #60a5fa)`                                  | Focus outlines, rings, and active borders             |
| `--ngx-form-field-color-error`          | `light-dark(#db1818, #fca5a5)`                                  | Invalid borders, focus outlines, and required markers |
| `--ngx-form-field-color-warning`        | `light-dark(#a16207, #fcd34d)`                                  | Warning borders and focus outlines                    |
| `--ngx-form-field-color-text`           | `light-dark(#324155, #f9fafb)`                                  | Input text                                            |
| `--ngx-form-field-color-text-secondary` | `light-dark(rgba(50, 65, 85, 0.75), rgba(249, 250, 251, 0.75))` | Labels, placeholders, prefixes, suffixes              |
| `--ngx-form-field-color-surface`        | `light-dark(#ffffff, #1f2937)`                                  | Input background                                      |
| `--ngx-form-field-color-border`         | `light-dark(rgba(50, 65, 85, 0.7), rgba(249, 250, 251, 0.4))`   | Default enabled border (3:1+ contrast)                |
| `--ngx-form-field-color-border-hover`   | `light-dark(#324155, #f9fafb)`                                  | Hover border                                          |
| `--ngx-form-field-color-disabled`       | `light-dark(#f3f4f6, #111827)`                                  | Disabled background                                   |

### Layout and spacing

| Property                              | Default                                                                           | Applies to                  | Description                                         |
| :------------------------------------ | :-------------------------------------------------------------------------------- | :-------------------------- | :-------------------------------------------------- |
| `--ngx-form-field-padding-vertical`   | `0.25rem`                                                                         | `standard`, `outline`       | Vertical padding inside the field border            |
| `--ngx-form-field-padding-horizontal` | `0.5rem`                                                                          | `standard`, `outline`       | Horizontal padding inside the field border          |
| `--ngx-form-field-input-padding`      | `var(--ngx-form-field-padding-vertical) var(--ngx-form-field-padding-horizontal)` | `standard`                  | Shorthand input padding                             |
| `--ngx-form-field-radius`             | `0.25rem`                                                                         | `standard`, `outline`       | Border radius                                       |
| `--ngx-form-field-min-height`         | derived (`2.75rem` by default)                                                    | `outline`                   | Minimum height of the outlined container            |
| `--ngx-form-field-gap`                | `0.125rem`                                                                        | `standard`, `plain`, horiz. | Gap between label and control                       |
| `--ngx-form-field-margin`             | `0`                                                                               | All appearances             | Bottom margin on the wrapper host (container-owned) |

#### Container-owned spacing

Wrappers have no outer bottom margin by default (`--ngx-form-field-margin: 0`). Put spacing between fields on the parent layout with `gap`:

```css
.form-grid {
  display: grid;
  gap: 1rem;
}
```

If a legacy layout has no grid or flex parent, opt the wrapper back into a bottom margin:

```css
.stacked-form ngx-form-field-wrapper {
  --ngx-form-field-margin: 1rem;
}
```

### Prefix and suffix

Applies to `standard` and `outline` appearances:

| Property                        | Default                                      | Description                 |
| :------------------------------ | :------------------------------------------- | :-------------------------- |
| `--ngx-form-field-prefix-gap`   | `0.5rem`                                     | Gap between prefix children |
| `--ngx-form-field-suffix-gap`   | `0.5rem`                                     | Gap between suffix children |
| `--ngx-form-field-prefix-color` | `var(--ngx-form-field-color-text-secondary)` | Prefix color                |
| `--ngx-form-field-suffix-color` | `var(--ngx-form-field-color-text-secondary)` | Suffix color                |

### Labels

**Standard and plain (`appearance="standard"`, `appearance="plain"`), plus checkbox and switch row labels:**

| Property                               | Default                                      | Description         |
| :------------------------------------- | :------------------------------------------- | :------------------ |
| `--ngx-form-field-label-size`          | `0.75rem`                                    | Label font size     |
| `--ngx-form-field-label-weight`        | `400`                                        | Label font weight   |
| `--ngx-form-field-label-font-family`   | `inherit`                                    | Label font family   |
| `--ngx-form-field-label-color`         | `var(--ngx-form-field-color-text-secondary)` | Label text color    |
| `--ngx-form-field-label-line-height`   | `1rem`                                       | Label line height   |
| `--ngx-form-field-label-padding-start` | `0.125rem`                                   | Label start padding |

**Outline (`appearance="outline"`):**

| Property                                     | Default                                      | Description                                                                  |
| :------------------------------------------- | :------------------------------------------- | :--------------------------------------------------------------------------- |
| `--ngx-form-field-outline-label-size`        | `0.75rem`                                    | Outlined label font size (alias: `--ngx-form-field-outline-label-font-size`) |
| `--ngx-form-field-outline-label-gap`         | `0rem`                                       | Gap below the outlined label                                                 |
| `--ngx-form-field-outline-label-weight`      | `400`                                        | Outlined label font weight                                                   |
| `--ngx-form-field-outline-label-font-family` | `var(--ngx-form-field-label-font-family)`    | Outlined label font family (falls back to `inherit`)                         |
| `--ngx-form-field-outline-label-color`       | `var(--ngx-form-field-color-text-secondary)` | Outlined label text color                                                    |
| `--ngx-form-field-outline-label-line-height` | `1rem`                                       | Outlined label line height                                                   |

A projected `<legend>` does not match the wrapper's label slot (`label, [ngxFormFieldLabel]`), so label tokens do not apply to it unless you add `ngxFormFieldLabel` or style it in app CSS.

### Field markers

Applies across all appearances. Set `showMarkerWhen` (`'required' | 'optional' | 'none'`) in config or on the wrapper.

| Property                                   | Default                             | Description             |
| :----------------------------------------- | :---------------------------------- | :---------------------- |
| `--ngx-form-field-required-marker-color`   | `var(--ngx-form-field-color-error)` | Required marker color   |
| `--ngx-form-field-required-marker-weight`  | `600`                               | Required marker weight  |
| `--ngx-form-field-optional-marker-color`   | `light-dark(#1e293b, currentColor)` | Optional marker color   |
| `--ngx-form-field-optional-marker-weight`  | `400`                               | Optional marker weight  |
| `--ngx-form-field-optional-marker-opacity` | `0.7`                               | Optional marker opacity |

The light-mode optional marker uses `#1e293b` instead of `currentColor` so it stays above 4.5:1 contrast on white at `0.7` opacity. If you set `--ngx-form-field-optional-marker-color: currentColor` with a custom label color, verify contrast at your chosen opacity.

### Input controls

**Standard (and shared container/placeholder tokens):**

| Property                             | Default                                      | Applies to            | Description        |
| :----------------------------------- | :------------------------------------------- | :-------------------- | :----------------- |
| `--ngx-form-field-input-size`        | `0.875rem`                                   | `standard`            | Input font size    |
| `--ngx-form-field-input-font-family` | `inherit`                                    | `standard`            | Input font family  |
| `--ngx-form-field-input-line-height` | `1.25rem`                                    | `standard`            | Input line height  |
| `--ngx-form-field-input-weight`      | `400`                                        | `standard`            | Input font weight  |
| `--ngx-form-field-input-color`       | `var(--ngx-form-field-color-text)`           | `standard`            | Input text color   |
| `--ngx-form-field-input-bg`          | `var(--ngx-form-field-color-surface)`        | `standard`, `outline` | Input background   |
| `--ngx-form-field-border-color`      | `var(--ngx-form-field-color-border)`         | `standard`, `outline` | Field border color |
| `--ngx-form-field-placeholder-color` | `var(--ngx-form-field-color-text-secondary)` | `standard`, `outline` | Placeholder color  |

**Outline typography (`appearance="outline"`):**

| Property                                     | Default                                   | Description                                                                  |
| :------------------------------------------- | :---------------------------------------- | :--------------------------------------------------------------------------- |
| `--ngx-form-field-outline-input-size`        | `0.875rem`                                | Outlined input font size (alias: `--ngx-form-field-outline-input-font-size`) |
| `--ngx-form-field-outline-input-font-family` | `var(--ngx-form-field-input-font-family)` | Outlined input font family (falls back to `inherit`)                         |
| `--ngx-form-field-outline-input-line-height` | `1.25rem`                                 | Outlined input line height                                                   |
| `--ngx-form-field-outline-input-weight`      | `400`                                     | Outlined input font weight                                                   |
| `--ngx-form-field-outline-input-color`       | `var(--ngx-form-field-color-text)`        | Outlined input text color                                                    |

<a id="states--focus"></a>

### States and focus

Applies to `standard` and `outline` appearances. In `plain` appearance, the focus, invalid, and warning colors drive the input-level `:focus-visible` outline (fixed `2px` width and `2px` offset).

A focused textual field in `standard` or `outline` draws a solid offset outline on the container when the control matches `:focus-visible`. Valid fields use `--ngx-form-field-focus-color`, invalid fields use `--ngx-form-field-invalid-color`, and warning fields use `--ngx-form-field-warning-color`. Keep custom focus, invalid, and warning colors at 3:1 contrast or higher against your page background (WCAG 2.2 SC 1.4.11).

| Property                                | Default                                                                            | Description                                                                          |
| :-------------------------------------- | :--------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| `--ngx-form-field-focus-color`          | `var(--ngx-form-field-color-primary)`                                              | Focus border and outline color                                                       |
| `--ngx-form-field-focus-box-shadow`     | `0 0 0 4px color-mix(in srgb, var(--ngx-form-field-focus-color) 25%, transparent)` | Focus ring in valid state                                                            |
| `--ngx-form-field-focus-outline-width`  | `2px`                                                                              | Solid focus outline width (`standard` and `outline`)                                 |
| `--ngx-form-field-focus-outline-offset` | `2px`                                                                              | Solid focus outline offset (`standard` and `outline`)                                |
| `--ngx-form-field-hover-border-color`   | `var(--ngx-form-field-color-border-hover)`                                         | Hover border color                                                                   |
| `--ngx-form-field-invalid-color`        | `var(--ngx-form-field-color-error)`                                                | Invalid border, focus outline, and invalid checkbox/switch label color               |
| `--ngx-form-field-invalid-box-shadow`   | `none`                                                                             | Optional invalid ring (off by default to avoid doubling the solid outline)           |
| `--ngx-form-field-warning-color`        | `var(--ngx-form-field-color-warning)`                                              | Warning border and focus outline color                                               |
| `--ngx-form-field-warning-box-shadow`   | `none`                                                                             | Optional warning ring (off by default to avoid doubling the solid outline)           |
| `--ngx-form-field-valid-border-color`   | unset                                                                              | Opt-in border for a touched, valid field without warnings; hidden on hover and focus |
| `--ngx-form-field-disabled-bg`          | `var(--ngx-form-field-color-disabled)`                                             | Disabled background                                                                  |
| `--ngx-form-field-disabled-opacity`     | `0.6`                                                                              | Disabled opacity                                                                     |
| `--ngx-form-field-state-ring-opacity`   | `25%`                                                                              | Opacity for the default focus ring (`@property <percentage>`)                        |
| `--ngx-form-field-hover-state-opacity`  | `6%`                                                                               | Hover tint on interactive prefix/suffix buttons (`@property <percentage>`)           |
| `--ngx-form-field-active-state-opacity` | `10%`                                                                              | Pressed tint on interactive prefix/suffix buttons (`@property <percentage>`)         |

### Assistive row

The wrapper reserves one line below the control by default so showing an error or warning does not shift the form layout.

| Property                                    | Default                                                  | Description                                                     |
| :------------------------------------------ | :------------------------------------------------------- | :-------------------------------------------------------------- |
| `--ngx-form-field-assistive-min-height`     | `var(--ngx-signal-form-feedback-line-height)` (`1rem`)   | Reserved line height below the control                          |
| `--ngx-form-field-assistive-gap`            | `0.5rem`                                                 | Gap between hint/error and character count                      |
| `--ngx-form-field-assistive-margin-top`     | `0`                                                      | Space above the assistive row                                   |
| `--ngx-form-field-assistive-margin-bottom`  | `0`                                                      | Space below the assistive row                                   |
| `--ngx-form-field-assistive-transition`     | `min-height 150ms ease-out, margin-block 150ms ease-out` | Transition for reservation changes (disabled on reduced motion) |
| `--ngx-form-field-assistive-empty-behavior` | `reserve`                                                | `reserve` always reserves height; `collapse` drops empty rows   |

Set `--ngx-form-field-assistive-min-height: 0` to remove reserved space on every field, or `--ngx-form-field-assistive-empty-behavior: collapse` to collapse only fields that have no hint, message, or counter.

### Horizontal layout

Set `orientation="horizontal"` on a wrapper (or `defaultFormFieldOrientation: 'horizontal'` in config) to place the label to the left of the control. Applies to `standard` and `plain` appearances. `outline` and selection controls keep their own layout.

| Property                                   | Default   | Description                                                  |
| :----------------------------------------- | :-------- | :----------------------------------------------------------- |
| `--ngx-form-field-horizontal-gap`          | `0.75rem` | Gap between label column and control column                  |
| `--ngx-form-field-label-width`             | `8rem`    | Width of the label column                                    |
| `--ngx-form-field-horizontal-label-align`  | `start`   | Horizontal alignment of the label (`start`, `center`, `end`) |
| `--ngx-form-field-horizontal-label-valign` | `center`  | Vertical alignment of the label (`start`, `center`, `end`)   |

When a horizontal wrapper is narrower than `20rem`, an internal `@container` query automatically stacks the label above the control so the input stays usable on narrow viewports and at high zoom. Because CSS size queries require literal lengths, `20rem` is not a custom property.

### Wrapper selection groups

Grouped radios and checkboxes inside `ngx-form-field-wrapper` use a tinted surface instead of a field border when invalid or warning:

| Property                                      | Default                                                                    | Description                                               |
| :-------------------------------------------- | :------------------------------------------------------------------------- | :-------------------------------------------------------- |
| `--ngx-form-field-selection-group-gap`        | `0.75rem`                                                                  | Vertical gap between grouped options                      |
| `--ngx-form-field-selection-row-gap`          | `0.75rem`                                                                  | Horizontal gap between one checkbox or switch and label   |
| `--ngx-form-field-selection-group-padding`    | `0.75rem`                                                                  | Inner padding of the grouped control surface              |
| `--ngx-form-field-selection-group-radius`     | `0.25rem`                                                                  | Border radius of the grouped control surface              |
| `--ngx-form-field-selection-group-bg`         | `transparent`                                                              | Base surface background                                   |
| `--ngx-form-field-selection-group-invalid-bg` | `color-mix(in srgb, var(--ngx-form-field-invalid-color) 12%, transparent)` | Invalid surface background                                |
| `--ngx-form-field-selection-group-warning-bg` | `color-mix(in srgb, var(--ngx-form-field-warning-color) 12%, transparent)` | Warning surface background                                |
| `--ngx-form-field-touch-target`               | `2rem`                                                                     | Minimum hit-target height for checkbox/switch rows (32px) |

#### Checkbox and switch row label typography

Checkbox and switch row labels read `--ngx-form-field-label-*`, not `--ngx-form-field-input-*`. While the field is invalid, `--ngx-form-field-invalid-color` overrides the row label color. If you tint the row background, verify that the label keeps at least 4.5:1 contrast.

#### Selection row gap

`--ngx-form-field-selection-row-gap` sets the gap inside a single checkbox or switch row. `--ngx-form-field-selection-group-gap` sets the vertical gap between options in a radio or checkbox group. Inside a selection group, each option row's internal spacing is owned by your projected markup.

#### Selection target size

`--ngx-form-field-touch-target` defaults to `2rem` (32px), giving headroom above WCAG 2.2 SC 2.5.8 (24px AA minimum). Set `2.75rem` for 44px AAA targets, or `1.5rem` (24px) for compact forms. Do not go below `1.5rem` if you target WCAG 2.2 AA.

This token applies to wrapper-owned checkbox rows, switch rows, and padded custom controls. Projected radio-group rows and fieldsets own their own row sizing in app CSS.

### Rendering without a label

When no `<label>` or `[ngxFormFieldLabel]` is projected into a textual `standard` or `outline` wrapper, CSS `:has()` collapses the empty label slot automatically. In horizontal mode, the grid collapses to one column.

To keep rows aligned in a multi-column grid while omitting visible text, project an empty `<label for="..."></label>` and give the control an `aria-label` or `aria-labelledby`. Do not rely on `placeholder` alone as a field's visible label, because placeholders disappear once the user types (WCAG 2.2 SC 3.3.2).

## Fieldset

**Component:** `ngx-form-fieldset` (`[ngxFormFieldset]`)

The fieldset separates its host border, its inner tinted surface, and its `<legend>` so tinted validation backgrounds do not obscure the legend. Host data attributes for CSS hooks: `data-appearance`, `data-feedback-appearance`, `data-surface-tone`, `data-validation-surface`, `data-error-placement`, and `data-has-messages`.

### Fieldset layout and surfaces

| Property                                             | Default                                                         | Description                                           |
| :--------------------------------------------------- | :-------------------------------------------------------------- | :---------------------------------------------------- |
| `--ngx-signal-form-fieldset-direction`               | `column`                                                        | Flex direction of grouped children (`column` / `row`) |
| `--ngx-signal-form-fieldset-gap`                     | `1rem`                                                          | Spacing between grouped children                      |
| `--ngx-signal-form-fieldset-padding`                 | `1rem`                                                          | Inner padding around the fieldset surface             |
| `--ngx-signal-form-fieldset-content-offset`          | `0`                                                             | Horizontal offset of the content area from the edge   |
| `--ngx-signal-form-fieldset-border-width`            | `1px`                                                           | Outer fieldset border width                           |
| `--ngx-signal-form-fieldset-border-color`            | `light-dark(#e5e7eb, #374151)`                                  | Outer fieldset border color                           |
| `--ngx-signal-form-fieldset-border-radius`           | `0.75rem`                                                       | Outer fieldset border radius                          |
| `--ngx-signal-form-fieldset-surface-border-radius`   | `var(--ngx-signal-form-fieldset-border-radius)`                 | Inner surface border radius                           |
| `--ngx-signal-form-fieldset-bg`                      | `transparent`                                                   | Base fieldset background                              |
| `--ngx-signal-form-fieldset-surface-bg`              | `var(--ngx-signal-form-fieldset-bg)`                            | Background behind grouped controls                    |
| `--ngx-signal-form-fieldset-color`                   | `light-dark(#324155, #f9fafb)`                                  | Primary text color                                    |
| `--ngx-signal-form-fieldset-muted-color`             | `light-dark(rgba(50, 65, 85, 0.75), rgba(249, 250, 251, 0.75))` | Secondary text color                                  |
| `--ngx-signal-form-fieldset-neutral-surface-bg`      | subtle neutral tint                                             | Fill for `surfaceTone="neutral"`                      |
| `--ngx-signal-form-fieldset-info-surface-bg`         | subtle info tint                                                | Fill for `surfaceTone="info"`                         |
| `--ngx-signal-form-fieldset-success-surface-bg`      | subtle success tint                                             | Fill for `surfaceTone="success"`                      |
| `--ngx-signal-form-fieldset-warning-surface-base-bg` | `var(--ngx-signal-form-fieldset-notification-warning-bg)`       | Fill for `surfaceTone="warning"`                      |
| `--ngx-signal-form-fieldset-danger-surface-bg`       | `var(--ngx-signal-form-fieldset-notification-error-bg)`         | Fill for `surfaceTone="danger"`                       |

### Fieldset legend

| Property                                               | Default                                 | Description                                   |
| :----------------------------------------------------- | :-------------------------------------- | :-------------------------------------------- |
| `--ngx-signal-form-fieldset-legend-color`              | `var(--ngx-signal-form-fieldset-color)` | Default legend color                          |
| `--ngx-signal-form-fieldset-legend-font-size`          | `0.875rem`                              | Legend font size                              |
| `--ngx-signal-form-fieldset-legend-font-family`        | `inherit`                               | Legend font family                            |
| `--ngx-signal-form-fieldset-legend-line-height`        | `1.25rem`                               | Legend line height                            |
| `--ngx-signal-form-fieldset-legend-font-weight`        | `500`                                   | Legend font weight                            |
| `--ngx-signal-form-fieldset-legend-letter-spacing`     | `0`                                     | Legend letter spacing                         |
| `--ngx-signal-form-fieldset-legend-padding`            | `0.125rem 0.375rem`                     | Padding around the projected `<legend>`       |
| `--ngx-signal-form-fieldset-legend-bg`                 | `transparent`                           | Legend background                             |
| `--ngx-signal-form-fieldset-legend-border-radius`      | `0.25rem`                               | Legend background radius                      |
| `--ngx-signal-form-fieldset-legend-inset-inline-start` | `0.5rem`                                | Start-edge inset for the projected `<legend>` |

### Fieldset validation states

Validation tinting is opt-in via `validationSurface="always"` (default is `'never'`). On a tinted danger surface in light mode, the fieldset automatically switches its fallback text tones darker so labels and messages stay above 4.5:1 contrast; explicit public color tokens still win.

| Property                                          | Default                                                   | Description                                             |
| :------------------------------------------------ | :-------------------------------------------------------- | :------------------------------------------------------ |
| `--ngx-signal-form-fieldset-invalid-border-color` | `light-dark(#db1818, #fca5a5)`                            | Border color when errors show                           |
| `--ngx-signal-form-fieldset-warning-border-color` | `light-dark(#a16207, #fcd34d)`                            | Border color when warnings show                         |
| `--ngx-signal-form-fieldset-invalid-bg`           | `light-dark(#fbdddd, rgb(127 29 29 / 0.32))`              | Invalid host background fill                            |
| `--ngx-signal-form-fieldset-invalid-surface-bg`   | `var(--ngx-signal-form-fieldset-invalid-bg)`              | Invalid inner surface background                        |
| `--ngx-signal-form-fieldset-warning-bg`           | unset (uses per-layer warning default)                    | Overrides both warning surface and message background   |
| `--ngx-signal-form-fieldset-warning-surface-bg`   | `var(--ngx-signal-form-fieldset-notification-warning-bg)` | Warning inner surface background                        |
| `--ngx-signal-form-fieldset-invalid-legend-color` | `var(--ngx-signal-form-fieldset-invalid-border-color)`    | Legend color in error state (darker on tinted danger)   |
| `--ngx-signal-form-fieldset-warning-legend-color` | `var(--ngx-signal-form-fieldset-warning-border-color)`    | Legend color in warning state (darker on tinted danger) |
| `--ngx-signal-form-fieldset-invalid-legend-bg`    | `var(--ngx-signal-form-fieldset-legend-bg)`               | Optional legend background in error state               |
| `--ngx-signal-form-fieldset-warning-legend-bg`    | `var(--ngx-signal-form-fieldset-legend-bg)`               | Optional legend background in warning state             |

### Fieldset messages and notification cards

Grouped messages inherit from `ngx-form-field-error` by default. Use these tokens to style fieldset messages separately from per-field errors:

| Property                                                            | Default                                                                           | Description                                          |
| :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :--------------------------------------------------- |
| `--ngx-signal-form-fieldset-message-margin-top`                     | `var(--ngx-signal-form-fieldset-gap)`                                             | Top margin above the message slot                    |
| `--ngx-signal-form-fieldset-message-margin-bottom`                  | `var(--ngx-signal-form-fieldset-gap)`                                             | Bottom margin below the message slot                 |
| `--ngx-signal-form-fieldset-message-inset-inline-start`             | `0`                                                                               | Start inset for plain grouped messages               |
| `--ngx-signal-form-fieldset-message-inset-inline-end`               | `0`                                                                               | End inset for plain grouped messages                 |
| `--ngx-signal-form-fieldset-message-padding`                        | `0`                                                                               | Padding for plain grouped messages                   |
| `--ngx-signal-form-fieldset-message-padding-inline-start`           | `var(--ngx-signal-form-feedback-padding-horizontal)`                              | Reserved start padding alias (inline error uses `0`) |
| `--ngx-signal-form-fieldset-message-padding-inline-end`             | `var(--ngx-signal-form-feedback-padding-horizontal)`                              | Reserved end padding alias (inline error uses `0`)   |
| `--ngx-signal-form-fieldset-message-border-width`                   | `0`                                                                               | Border width for plain grouped messages              |
| `--ngx-signal-form-fieldset-message-border-radius`                  | `0`                                                                               | Border radius for plain grouped messages             |
| `--ngx-signal-form-fieldset-message-spacing`                        | `0.25rem`                                                                         | Gap between grouped messages                         |
| `--ngx-signal-form-fieldset-message-list-style`                     | `var(--ngx-signal-form-feedback-list-style)`                                      | `list-style` shorthand for plain grouped lists       |
| `--ngx-signal-form-fieldset-message-list-padding-inline-start`      | `var(--ngx-signal-form-feedback-list-indent)`                                     | List indent for plain grouped lists                  |
| `--ngx-signal-form-fieldset-message-animation`                      | unset (built-in 180ms slide-in)                                                   | Custom global `animation` shorthand, or `none`       |
| `--ngx-signal-form-fieldset-error-color`                            | `var(--ngx-signal-form-error-color)`                                              | Plain grouped error text color                       |
| `--ngx-signal-form-fieldset-error-bg`                               | `var(--ngx-signal-form-error-bg)`                                                 | Plain grouped error background                       |
| `--ngx-signal-form-fieldset-error-border-color`                     | `var(--ngx-signal-form-error-border-color)`                                       | Plain grouped error border color                     |
| `--ngx-signal-form-fieldset-warning-color`                          | `var(--ngx-signal-form-warning-color)`                                            | Plain grouped warning text color                     |
| `--ngx-signal-form-fieldset-warning-border-color`                   | `var(--ngx-signal-form-warning-border-color)`                                     | Plain grouped warning border color                   |
| `--ngx-signal-form-fieldset-notification-inset-inline-start`        | `0`                                                                               | Start inset for notification cards                   |
| `--ngx-signal-form-fieldset-notification-inset-inline-end`          | `0`                                                                               | End inset for notification cards                     |
| `--ngx-signal-form-fieldset-notification-list-style`                | `var(--ngx-signal-form-feedback-list-style)`                                      | `list-style` shorthand for notification cards        |
| `--ngx-signal-form-fieldset-notification-list-padding-inline-start` | `var(--ngx-signal-form-feedback-list-indent)`                                     | List indent for notification cards                   |
| `--ngx-signal-form-fieldset-notification-error-bg`                  | `light-dark(#fdebeb, rgb(127 29 29 / 0.32))`                                      | Notification card error background                   |
| `--ngx-signal-form-fieldset-notification-error-border-color`        | `color-mix(in srgb, var(--ngx-signal-form-error-panel-color) 50%, transparent)`   | Notification card error border color                 |
| `--ngx-signal-form-fieldset-notification-warning-bg`                | `light-dark(color-mix(in srgb, #a16207 10%, white), rgb(120 53 15 / 0.28))`       | Notification card warning background                 |
| `--ngx-signal-form-fieldset-notification-warning-border-color`      | `color-mix(in srgb, var(--ngx-signal-form-warning-panel-color) 50%, transparent)` | Notification card warning border color               |

Notification card text colors follow `--ngx-signal-form-error-panel-color` and `--ngx-signal-form-warning-panel-color`.

## Assistive components

These components live in `@ngx-signal-forms/toolkit/assistive` and inherit from the [shared feedback tokens](#shared-feedback-tokens).

### Error and warning messages

**Component:** `ngx-form-field-error` (`presentation="inline"`, default)

| Property                                            | Default                                       | Description                                    |
| :-------------------------------------------------- | :-------------------------------------------- | :--------------------------------------------- |
| `--ngx-signal-form-error-color`                     | `light-dark(#db1818, #fca5a5)`                | Error text color                               |
| `--ngx-signal-form-error-bg`                        | `transparent`                                 | Error background color                         |
| `--ngx-signal-form-error-border-color`              | `transparent`                                 | Error border color                             |
| `--ngx-signal-form-warning-color`                   | `light-dark(#a16207, #fcd34d)`                | Warning text color                             |
| `--ngx-signal-form-warning-bg`                      | `transparent`                                 | Warning background color                       |
| `--ngx-signal-form-warning-border-color`            | `transparent`                                 | Warning border color                           |
| `--ngx-signal-form-error-font-size`                 | `var(--ngx-signal-form-feedback-font-size)`   | Text size                                      |
| `--ngx-signal-form-error-line-height`               | `var(--ngx-signal-form-feedback-line-height)` | Line height                                    |
| `--ngx-signal-form-error-margin-top`                | `var(--ngx-signal-form-feedback-margin-top)`  | Space above the message block                  |
| `--ngx-signal-form-error-message-spacing`           | `0.25rem`                                     | Space between multiple messages                |
| `--ngx-signal-form-error-border-width`              | `0`                                           | Border width                                   |
| `--ngx-signal-form-error-border-radius`             | `0`                                           | Border radius                                  |
| `--ngx-signal-form-error-padding`                   | `0`                                           | Vertical padding (inline horizontal is `0`)    |
| `--ngx-signal-form-error-animation`                 | unset (built-in 180ms slide-in)               | Custom global `animation` shorthand, or `none` |
| `--ngx-signal-form-error-list-style`                | `var(--ngx-signal-form-feedback-list-style)`  | `list-style` shorthand for bulleted lists      |
| `--ngx-signal-form-error-list-padding-inline-start` | `var(--ngx-signal-form-feedback-list-indent)` | Indent for bulleted lists                      |
| `--ngx-signal-form-error-icon`                      | `none`                                        | CSS `content` for a visible `::before` icon    |
| `--ngx-signal-form-warning-icon`                    | `none`                                        | CSS `content` for a visible `::before` icon    |

Notes:

- **Custom entry animation.** Because the built-in keyframes are encapsulated in the component, a custom `--ngx-signal-form-error-animation` value must reference keyframes defined in a global stylesheet. Set `none` to disable entry motion. Under `prefers-reduced-motion: reduce`, messages fade in without moving.
- **Non-color cues.** Screen readers receive a visually hidden "Error:" or "Warning:" prefix (`errorPrefixText` / `warningPrefixText` in config). To add a decorative visual icon without doubling the announcement, include empty alt text in your value: `--ngx-signal-form-error-icon: '!' / '';`. See [Errors and warnings without color](/packages/toolkit/assistive/README#errors-and-warnings-without-color).
- **Inline horizontal padding.** `presentation="inline"` fixes `padding-inline-start` and `padding-inline-end` to `0`, so `--ngx-signal-form-error-padding` only adds vertical padding in inline mode.

### Grouped panel feedback

**Component:** `ngx-form-field-error` with `presentation="panel"`

Panel tokens apply only when `presentation="panel"`. Title tokens apply to both `inline` and `panel`.

| Property                                        | Default                                                                           | Description                                     |
| :---------------------------------------------- | :-------------------------------------------------------------------------------- | :---------------------------------------------- |
| `--ngx-signal-form-error-panel-padding`         | `1rem`                                                                            | Inner card padding (CSS shorthand)              |
| `--ngx-signal-form-error-panel-border-width`    | `1px`                                                                             | Card border width                               |
| `--ngx-signal-form-error-panel-border-radius`   | `0.5rem`                                                                          | Card corner radius                              |
| `--ngx-signal-form-error-panel-font-size`       | `0.875rem`                                                                        | Panel message font size                         |
| `--ngx-signal-form-error-panel-line-height`     | `1.25rem`                                                                         | Panel message line height                       |
| `--ngx-signal-form-error-panel-message-spacing` | `0.25rem`                                                                         | Gap between panel messages                      |
| `--ngx-signal-form-error-panel-bg`              | `light-dark(#fdebeb, rgb(127 29 29 / 0.32))`                                      | Error card background                           |
| `--ngx-signal-form-error-panel-color`           | `light-dark(#b91c1c, #fca5a5)`                                                    | Error card text color                           |
| `--ngx-signal-form-error-panel-border-color`    | `color-mix(in srgb, var(--ngx-signal-form-error-panel-color) 50%, transparent)`   | Error card border color                         |
| `--ngx-signal-form-warning-panel-bg`            | `light-dark(color-mix(in srgb, #a16207 10%, white), rgb(120 53 15 / 0.28))`       | Warning card background                         |
| `--ngx-signal-form-warning-panel-color`         | `light-dark(#92400e, #fcd34d)`                                                    | Warning card text color                         |
| `--ngx-signal-form-warning-panel-border-color`  | `color-mix(in srgb, var(--ngx-signal-form-warning-panel-color) 50%, transparent)` | Warning card border color                       |
| `--ngx-signal-form-error-title-color`           | `currentColor`                                                                    | Optional title color (both presentations)       |
| `--ngx-signal-form-error-title-font-size`       | `1rem`                                                                            | Optional title font size (both presentations)   |
| `--ngx-signal-form-error-title-line-height`     | `1.5rem`                                                                          | Optional title line height (both presentations) |
| `--ngx-signal-form-error-title-font-weight`     | `500`                                                                             | Optional title font weight (both presentations) |

List style and list indent come from `--ngx-signal-form-error-list-style` and `--ngx-signal-form-error-list-padding-inline-start`.

### Hints

**Component:** `ngx-form-field-hint`

| Property                                     | Default                                                         | Description                     |
| :------------------------------------------- | :-------------------------------------------------------------- | :------------------------------ |
| `--ngx-form-field-hint-color`                | `light-dark(rgba(50, 65, 85, 0.75), rgba(249, 250, 251, 0.75))` | Hint text color                 |
| `--ngx-form-field-hint-font-size`            | `var(--ngx-signal-form-feedback-font-size)`                     | Text size                       |
| `--ngx-form-field-hint-line-height`          | `var(--ngx-signal-form-feedback-line-height)`                   | Line height                     |
| `--ngx-form-field-hint-align`                | `left`                                                          | Text alignment (`left`/`right`) |
| `--ngx-form-field-hint-padding-inline-start` | `0`                                                             | Start-edge padding              |
| `--ngx-form-field-hint-padding-inline-end`   | `0`                                                             | End-edge padding                |

Hints stay visible alongside errors by default (WCAG 2.2 SC 3.3.2). Pass `hideHintOnError` on `ngx-form-field-wrapper` or in `provideNgxSignalFormsConfig()` to hide the hint visually while a message shows. Screen readers still hear the hint through `aria-describedby`.

### Error summary

**Component:** `ngx-form-field-error-summary`

| Property                                   | Default                        | Description                                                   |
| :----------------------------------------- | :----------------------------- | :------------------------------------------------------------ |
| `--ngx-error-summary-border-color`         | `light-dark(#dc2626, #f87171)` | Card border color                                             |
| `--ngx-error-summary-bg`                   | `light-dark(#fef2f2, #450a0a)` | Card background color                                         |
| `--ngx-error-summary-label-color`          | `light-dark(#991b1b, #fecaca)` | Heading text color                                            |
| `--ngx-error-summary-link-color`           | `light-dark(#b91c1c, #fca5a5)` | Entry button text color                                       |
| `--ngx-error-summary-link-hover-color`     | `light-dark(#991b1b, #fecaca)` | Entry button hover color                                      |
| `--ngx-error-summary-link-min-target-size` | `1.5rem`                       | Minimum block and inline target size (24px WCAG 2.2 SC 2.5.8) |
| `--ngx-error-summary-link-padding-inline`  | `0.25rem`                      | Horizontal padding on each entry button                       |
| `--ngx-error-summary-focus-color`          | `light-dark(#2563eb, #60a5fa)` | `:focus-visible` outline color on entry buttons               |

### Character count

**Component:** `ngx-form-field-character-count` (host attribute: `data-limit-state`)

| Property                                           | Default                                                                    | Description                               |
| :------------------------------------------------- | :------------------------------------------------------------------------- | :---------------------------------------- |
| `--ngx-form-field-char-count-font-size`            | `var(--ngx-signal-form-feedback-font-size)`                                | Text size                                 |
| `--ngx-form-field-char-count-line-height`          | `1.25`                                                                     | Line height                               |
| `--ngx-form-field-char-count-color-ok`             | `light-dark(rgba(50, 65, 85, 0.75), rgba(249, 250, 251, 0.75))`            | Neutral state color                       |
| `--ngx-form-field-char-count-color-warning`        | `light-dark(#a16207, #fcd34d)`                                             | Warning threshold color                   |
| `--ngx-form-field-char-count-color-danger`         | `light-dark(#db1818, #fca5a5)`                                             | Danger threshold color                    |
| `--ngx-form-field-char-count-color-exceeded`       | `light-dark(#991b1b, #f87171)`                                             | Exceeded color (over 100%)                |
| `--ngx-form-field-char-count-weight-exceeded`      | `600`                                                                      | Font weight when exceeded                 |
| `--ngx-form-field-char-count-padding-inline-start` | `var(--ngx-signal-form-feedback-padding-horizontal)` (`0` standalone)      | Start-edge padding                        |
| `--ngx-form-field-char-count-padding-inline-end`   | `var(--ngx-signal-form-feedback-padding-horizontal)` (`0.5rem` standalone) | End-edge padding                          |
| `--ngx-form-field-char-count-warning-threshold`    | `80`                                                                       | Warning percentage (plain number, no `%`) |
| `--ngx-form-field-char-count-danger-threshold`     | `95`                                                                       | Danger percentage (plain number, no `%`)  |

Color thresholds are CSS-only. `[liveAnnounce]` always announces at the built-in 80% and 95% transitions.

### Marking legend

**Component:** `ngx-form-marking-legend`

| Property                              | Default                                                         | Description                              |
| :------------------------------------ | :-------------------------------------------------------------- | :--------------------------------------- |
| `--ngx-form-marking-legend-font-size` | `0.875rem`                                                      | Legend font size                         |
| `--ngx-form-marking-legend-color`     | `light-dark(rgba(50, 65, 85, 0.85), rgba(249, 250, 251, 0.85))` | Legend text color (keep 4.5:1+ contrast) |

Configure which marker text shows through `showMarkerWhen`, `requiredMarker`, and `optionalMarker` in config or component inputs. See [NgxFormMarkingLegend](/packages/toolkit/assistive/README#ngxformmarkinglegend).

## Recipes

### Map Bootstrap or Tailwind tokens

```css
ngx-form-field-wrapper {
  --ngx-form-field-color-primary: var(--bs-primary, #0d6efd);
  /* Keep enabled borders >= 3:1 against the surface and page (--bs-border-color is ~1.3:1 on white) */
  --ngx-form-field-color-border: var(--bs-secondary-color, #6c757d);
  --ngx-form-field-color-text: var(--bs-body-color, #212529);
  --ngx-form-field-color-surface: var(--bs-body-bg, #ffffff);

  --ngx-signal-form-feedback-font-size: 0.875rem;
  --ngx-signal-form-feedback-margin-top: 0.25rem;
}
```

See [CSS framework integration](/docs/CSS_FRAMEWORK_INTEGRATION) for Bootstrap, Tailwind, and Angular Material patterns.

### Side-by-side fieldset controls

```css
ngx-form-fieldset {
  --ngx-signal-form-fieldset-direction: row;
}
```

### Opt-in valid border

```css
ngx-form-field-wrapper {
  --ngx-form-field-valid-border-color: light-dark(#15803d, #4ade80);
}
```

Pair the border color with text or an icon when success must be communicated without relying on color alone.

### Field-shaped autocomplete and combobox adapters

A custom control with `role="combobox"` or `ngxSignalFormControl="input-like"` gets the wrapper's border, padding, and input typography automatically. Follow these ownership boundaries when adding affixes or a popup:

1. **Shell padding.** Let the wrapper own the outer border and `--ngx-form-field-padding-*`. Use `font: inherit` and `line-height: inherit` on the trigger so wrapper typography tokens apply.
2. **Double-padding escape hatch.** If a third-party trigger cannot have its padding stripped, set `--ngx-form-field-padding-horizontal: 0` on a class-scoped wrapper and match the inset inside the adapter.
3. **Affixes.** Project icons or clear buttons into `[prefix]` and `[suffix]`, and tune spacing between siblings with `--ngx-form-field-prefix-gap` / `--ngx-form-field-suffix-gap`.
4. **Popup positioning.** The wrapper's content shell is `position: relative`. Position an open listbox in the default slot with `inset-inline-start: -1px` to align with the outer 1px border (works in LTR and RTL).
5. **Widget-shaped controls.** Controls that draw their own chrome (sliders, calendars, star ratings) should use `appearance="plain"` instead.

See the [custom controls guide](/docs/CUSTOM_CONTROLS#field-shaped-vs-widget-shaped-custom-controls) and the [custom controls demo](https://github.com/ngx-signal-forms/ngx-signal-forms/blob/8dc0df8f01d3dc76f0fa035c8fc242ef1294cd72/apps/demo/src/app/04-form-field-wrapper/custom-controls/README.md).
