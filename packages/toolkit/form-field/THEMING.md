# Form Field & Toolkit Theming Guide

A comprehensive guide to styling `@ngx-signal-forms/toolkit` components using standard CSS Custom Properties.

## Overview

### What is this?

A theming system based entirely on **CSS Custom Properties (Variables)**. It exposes a public API of CSS variables that control colors, spacing, typography, and layout across the toolkit components.

### Why use it?

- **Encapsulation:** Modify styles safely without hacking component internals or using `::ng-deep`.
- **Runtime Theming:** Support Light/Dark modes or multiple themes instantly without rebuilding.
- **Framework Integration:** Easily map tokens from Bootstrap, Tailwind, or Material to the toolkit.

### Architecture: Semantic Layering

The system works in layers to ensure consistency while allowing deep customization.

1.  **Layer 1: Design Tokens** `(--_field-clr-primary)`
    - Internal defaults. Do not override these.
2.  **Layer 2: Shared Feedback (Base)** `(--ngx-signal-form-feedback-font-size)`
    - **Public API.** Controls the "micro-copy" typography and spacing across Errors, Warnings, Hints, and Character Counts.
3.  **Layer 3: Semantic Colors** `(--ngx-form-field-color-primary)`
    - **Public API.** The main integration point. Maps abstract roles (Primary, Error) to concrete colors.
4.  **Layer 4: Component Properties** `(--ngx-form-field-focus-color)`
    - **Public API.** Derived from layers 2 & 3. Override these for specific use cases.

---

## 1. Shared Feedback (Base Layer)

**Start here** if you want to change the size or spacing of _all_ helper text (Errors, Warnings, Hints, Character Counts) at once.

| Property                                        | Default    | Description                          |
| :---------------------------------------------- | :--------- | :----------------------------------- |
| `--ngx-signal-form-feedback-font-size`          | `0.75rem`  | Font size for all feedback text      |
| `--ngx-signal-form-feedback-line-height`        | `1rem`     | Line height for feedback text        |
| `--ngx-signal-form-feedback-margin-top`         | `0.125rem` | Spacing between input and feedback   |
| `--ngx-signal-form-feedback-padding-horizontal` | `0.5rem`   | Horizontal padding for feedback text |

---

## 2. Headless & Standalone Components

These components inherit from the **Shared Feedback** layer but can be overridden individually.

### Error & Warning Messages

**Component:** `ngx-signal-form-error`

controls the display of validation errors and warnings.

| Property                                       | Default                                                          | Description                              |
| :--------------------------------------------- | :--------------------------------------------------------------- | :--------------------------------------- |
| `--ngx-signal-form-error-color`                | `#db1818`                                                        | Text color for errors                    |
| `--ngx-signal-form-error-bg`                   | `transparent`                                                    | Error background color                   |
| `--ngx-signal-form-error-border`               | `transparent`                                                    | Error border color                       |
| `--ngx-signal-form-warning-color`              | `#f59e0b`                                                        | Text color for warnings                  |
| `--ngx-signal-form-warning-bg`                 | `transparent`                                                    | Warning background color                 |
| `--ngx-signal-form-warning-border`             | `transparent`                                                    | Warning border color                     |
| `--ngx-signal-form-error-font-size`            | `var(--...feedback...)`                                          | Text size                                |
| `--ngx-signal-form-error-line-height`          | `var(--...feedback...)`                                          | Line height                              |
| `--ngx-signal-form-error-font-size-override`   | `unset`                                                          | Override feedback font size for errors   |
| `--ngx-signal-form-error-line-height-override` | `unset`                                                          | Override feedback line height for errors |
| `--ngx-signal-form-error-margin-top`           | `var(--...feedback...)`                                          | Spacing from input                       |
| `--ngx-signal-form-error-message-spacing`      | `0.25rem`                                                        | Spacing between messages                 |
| `--ngx-signal-form-error-border-width`         | `0`                                                              | Border width                             |
| `--ngx-signal-form-error-border-radius`        | `0`                                                              | Border radius                            |
| `--ngx-signal-form-error-padding`              | `0`                                                              | Container padding                        |
| `--ngx-signal-form-error-padding-horizontal`   | `0.5rem`                                                         | Left/Right padding                       |
| `--ngx-signal-form-error-animation`            | `ngxStatusSlideIn 300ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards` | Entry animation                          |

### Hints

**Component:** `ngx-form-field-hint`

Provides context or instructions for a field.

| Property                                   | Default                  | Description                                |
| :----------------------------------------- | :----------------------- | :----------------------------------------- |
| `--ngx-form-field-hint-color`              | `rgba(50, 65, 85, 0.75)` | Hint text color                            |
| `--ngx-form-field-hint-font-size`          | `var(--...feedback...)`  | Text size                                  |
| `--ngx-form-field-hint-line-height`        | `var(--...feedback...)`  | Line height                                |
| `--ngx-form-field-hint-align`              | `right`                  | Text alignment (left/right)                |
| `--ngx-form-field-hint-padding-horizontal` | `0.5rem`                 | Horizontal padding (for left/right adjust) |

### Character Count

**Component:** `ngx-form-field-character-count`

Displays progress towards a character limit.

| Property                                      | Default                  | Description               |
| :-------------------------------------------- | :----------------------- | :------------------------ |
| `--ngx-form-field-char-count-font-size`       | `var(--...feedback...)`  | Text size                 |
| `--ngx-form-field-char-count-line-height`     | `1.25`                   | Line height               |
| `--ngx-form-field-char-count-color-ok`        | `rgba(50, 65, 85, 0.75)` | Neutral state color       |
| `--ngx-form-field-char-count-color-warning`   | `#f59e0b`                | Warning threshold color   |
| `--ngx-form-field-char-count-color-danger`    | `#db1818`                | Critical threshold color  |
| `--ngx-form-field-char-count-color-exceeded`  | `#991b1b`                | Limit exceeded color      |
| `--ngx-form-field-char-count-weight-exceeded` | `600`                    | Font weight when exceeded |

### Assistive Row

**Component:** `ngx-form-field-assistive-row`

Layout container for hint/error and character count alignment.

| Property                                | Default   | Description                              |
| :-------------------------------------- | :-------- | :--------------------------------------- |
| `--ngx-form-field-assistive-min-height` | `1.25rem` | Prevents layout shift when messages show |
| `--ngx-form-field-assistive-gap`        | `0.5rem`  | Gap between left and right content       |
| `--ngx-form-field-assistive-margin-top` | `2px`     | Spacing above assistive row              |

### Fieldset

**Component:** `ngx-signal-form-fieldset`

Groups related fields with consistent spacing.

| Property                         | Default  | Description            |
| :------------------------------- | :------- | :--------------------- |
| `--ngx-signal-form-fieldset-gap` | `0.5rem` | Spacing between fields |

---

## 3. Form Field Component

**Component:** `ngx-signal-form-field-wrapper`

This component wraps your `label` and `input` to provide layout, borders, and states.

### Layout Modes: Standard vs Outline

The form field wrapper supports two appearance modes via the `appearance` input:

**Standard Layout** (`appearance="standard"` or default)
- Label positioned above the input
- Traditional stacked form field design
- Uses `--ngx-form-field-label-*` properties
- Uses `--ngx-form-field-input-*` properties

**Outline Layout** (`appearance="outline"`)
- Material Design inspired floating label inside border
- Label sits inside the input container
- Uses `--ngx-form-field-outline-label-*` properties
- Uses `--ngx-form-field-outline-input-*` properties
- Requires CSS `:has()` selector (Chrome 105+, Firefox 121+, Safari 15.4+)

```html
<!-- Standard (default) -->
<ngx-signal-form-field-wrapper [formField]="form.email" appearance="standard">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field-wrapper>

<!-- Outline -->
<ngx-signal-form-field-wrapper [formField]="form.email" appearance="outline">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field-wrapper>
```

> **Note:** The semantic colors below apply to both layouts. Layout-specific properties (labels, input styling) are documented in separate sections.

### Semantic Color Scale (The "Knobs")

**Start here.** Changing these variables will automatically update focus rings, borders, text, and backgrounds across all states.

| Property                                | Default                  | Used For                         |
| :-------------------------------------- | :----------------------- | :------------------------------- |
| `--ngx-form-field-color-primary`        | `#007bc7`                | Focus states, active borders     |
| `--ngx-form-field-color-error`          | `#db1818`                | Invalid states, required markers |
| `--ngx-form-field-color-warning`        | `#f59e0b`                | Warning states                   |
| `--ngx-form-field-color-text`           | `#324155`                | Input text                       |
| `--ngx-form-field-color-text-secondary` | `rgba(50, 65, 85, 0.75)` | Labels, placeholders, hints      |
| `--ngx-form-field-color-surface`        | `#ffffff`                | Input background                 |
| `--ngx-form-field-color-border`         | `rgba(50, 65, 85, 0.25)` | Default borders                  |
| `--ngx-form-field-color-border-hover`   | `#324155`                | Hover borders                    |
| `--ngx-form-field-color-disabled`       | `#f3f4f6`                | Disabled background              |

### Specific Overrides

If the semantic colors aren't enough, you can override specific parts of the component.

> **Layout-Specific Properties:** Properties prefixed with `--ngx-form-field-outline-*` only apply when `appearance="outline"`. Standard layout uses the non-prefixed variants (e.g., `--ngx-form-field-label-*` vs `--ngx-form-field-outline-label-*`).

#### Layout & Spacing

**Applies to both standard and outline layouts.**

| Property                              | Default                                                                           | Description                          |
| :------------------------------------ | :-------------------------------------------------------------------------------- | :----------------------------------- |
| `--ngx-form-field-padding-vertical`   | `0.25rem`                                                                         | Vertical padding inside the border   |
| `--ngx-form-field-padding-horizontal` | `0.5rem`                                                                          | Horizontal padding inside the border |
| `--ngx-form-field-input-padding`      | `var(--ngx-form-field-padding-vertical) var(--ngx-form-field-padding-horizontal)` | Combined input padding               |
| `--ngx-form-field-radius`             | `0.25rem`                                                                         | Border radius                        |
| `--ngx-form-field-min-height`         | `3.5rem`                                                                          | Height for outlined variant          |
| `--ngx-form-field-gap`                | `0.125rem`                                                                        | Gap between label and input          |
| `--ngx-form-field-margin`             | `0`                                                                               | Bottom margin for field wrapper      |

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
| `--ngx-form-field-outline-label-color`       | `var(--ngx-form-field-color-text-secondary)` | Outlined label color       |
| `--ngx-form-field-outline-label-line-height` | `1rem`                                       | Outlined label line height |

#### Required Marker

**Applies to both layouts, but typically shown only in outline layout.**

| Property                                  | Default                             | Description            |
| :---------------------------------------- | :---------------------------------- | :--------------------- |
| `--ngx-form-field-required-marker-color`  | `var(--ngx-form-field-color-error)` | Required marker color  |
| `--ngx-form-field-required-marker-weight` | `600`                               | Required marker weight |

#### Input (Standard Layout)

**Only applies when `appearance="standard"` (default).**

| Property                             | Default                                      | Description        |
| :----------------------------------- | :------------------------------------------- | :----------------- |
| `--ngx-form-field-input-size`        | `0.875rem`                                   | Input font size    |
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
| `--ngx-form-field-outline-input-line-height` | `1.25rem`                          | Outlined input line height |
| `--ngx-form-field-outline-input-weight`      | `400`                              | Outlined input font weight |
| `--ngx-form-field-outline-input-color`       | `var(--ngx-form-field-color-text)` | Outlined input text color  |

#### States & Focus

**Applies to both standard and outline layouts.**

| Property                              | Default                                                               | Description          |
| :------------------------------------ | :-------------------------------------------------------------------- | :------------------- |
| `--ngx-form-field-focus-color`        | `var(--ngx-form-field-color-primary)`                                 | Focus border color   |
| `--ngx-form-field-focus-box-shadow`   | `0 0 0 4px color-mix(in srgb, var(--focus-color) 25%, transparent)`   | Focus ring           |
| `--ngx-form-field-hover-border-color` | `var(--ngx-form-field-color-border-hover)`                            | Hover border color   |
| `--ngx-form-field-invalid-color`      | `var(--ngx-form-field-color-error)`                                   | Invalid border color |
| `--ngx-form-field-warning-color`      | `var(--ngx-form-field-color-warning)`                                 | Warning border color |
| `--ngx-form-field-warning-box-shadow` | `0 0 0 4px color-mix(in srgb, var(--warning-color) 25%, transparent)` | Warning ring         |
| `--ngx-form-field-disabled-bg`        | `var(--ngx-form-field-color-disabled)`                                | Disabled background  |
| `--ngx-form-field-disabled-opacity`   | `0.6`                                                                 | Disabled opacity     |

---

## 4. Recipes & Common Scenarios

### Scenario A: "I just want it to match my Brand"

Redefine the semantic colors in your global styles or component.

```css
/* Apply to all fields */
ngx-signal-form-field-wrapper {
  --ngx-form-field-color-primary: #6da305; /* My Brand Green */
  --ngx-form-field-color-error: #d93025; /* My Error Red */
}
```

### Scenario B: Framework Integration (Bootstrap/Tailwind)

Map your framework's variables to the toolkit's semantic layer.

**Bootstrap Example:**

```css
ngx-signal-form-field-wrapper {
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

The components support `prefers-color-scheme: dark` out of the box.
If your app has a manual toggle (e.g. adding a `.dark` class), use this pattern to ensure it wins over system preferences:

```scss
/* app.component.scss or global styles */

/* 1. Define Dark Mode overrides */
@media (prefers-color-scheme: dark) {
  ngx-signal-form-field-wrapper {
    --ngx-form-field-color-surface: #1f2937;
    --ngx-form-field-color-text: #f9fafb;
    /* ... other dark tokens */
  }
}

/* 2. Fix: Force Light Mode if user explicitly chose it (even if system is Dark) */
:root:not(.dark) ngx-signal-form-field-wrapper {
  --ngx-form-field-color-surface: #ffffff;
  --ngx-form-field-color-text: #324155;
  /* ... reset to light tokens */
}
```
