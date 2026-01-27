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

| Property                                        | Default   | Description                          |
| :---------------------------------------------- | :-------- | :----------------------------------- |
| `--ngx-signal-form-feedback-font-size`          | `0.75rem` | Font size for all feedback text      |
| `--ngx-signal-form-feedback-line-height`        | `1.25`    | Line height for feedback text        |
| `--ngx-signal-form-feedback-margin-top`         | `0.25rem` | Spacing between input and feedback   |
| `--ngx-signal-form-feedback-padding-horizontal` | `0`       | Horizontal padding for feedback text |

---

## 2. Headless & Standalone Components

These components inherit from the **Shared Feedback** layer but can be overridden individually.

### Error & Warning Messages

**Component:** `ngx-signal-form-error`

controls the display of validation errors and warnings.

| Property                                     | Default                 | Description             |
| :------------------------------------------- | :---------------------- | :---------------------- |
| `--ngx-signal-form-error-color`              | `#dc2626`               | Text color for errors   |
| `--ngx-signal-form-warning-color`            | `#f59e0b`               | Text color for warnings |
| `--ngx-signal-form-error-font-size`          | `var(--...feedback...)` | Text size               |
| `--ngx-signal-form-error-line-height`        | `var(--...feedback...)` | Line height             |
| `--ngx-signal-form-error-margin-top`         | `var(--...feedback...)` | Spacing from input      |
| `--ngx-signal-form-error-padding-horizontal` | `var(--...feedback...)` | Left/Right padding      |

### Hints

**Component:** `ngx-signal-form-field-hint`

Provides context or instructions for a field.

| Property                            | Default                   | Description        |
| :---------------------------------- | :------------------------ | :----------------- |
| `--ngx-form-field-hint-color`       | `rgba(71, 91, 119, 0.75)` | Hint text color    |
| `--ngx-form-field-hint-font-size`   | `var(--...feedback...)`   | Text size          |
| `--ngx-form-field-hint-line-height` | `var(--...feedback...)`   | Line height        |
| `--ngx-form-field-hint-margin-top`  | `var(--...feedback...)`   | Spacing from input |

### Character Count

**Component:** `ngx-signal-form-field-character-count`

Displays progress towards a character limit.

| Property                                      | Default                   | Description               |
| :-------------------------------------------- | :------------------------ | :------------------------ |
| `--ngx-form-field-char-count-font-size`       | `var(--...feedback...)`   | Text size                 |
| `--ngx-form-field-char-count-color-ok`        | `rgba(71, 91, 119, 0.75)` | Neutral state color       |
| `--ngx-form-field-char-count-color-warning`   | `#f59e0b`                 | Warning threshold color   |
| `--ngx-form-field-char-count-color-danger`    | `#dc2626`                 | Critical threshold color  |
| `--ngx-form-field-char-count-color-exceeded`  | `#991b1b`                 | Limit exceeded color      |
| `--ngx-form-field-char-count-weight-exceeded` | `600`                     | Font weight when exceeded |

### Fieldset

**Component:** `ngx-signal-form-fieldset`

Groups related fields with consistent spacing.

| Property                         | Default  | Description            |
| :------------------------------- | :------- | :--------------------- |
| `--ngx-signal-form-fieldset-gap` | `0.5rem` | Spacing between fields |

---

## 3. Form Field Component

**Component:** `ngx-signal-form-field`

This component wraps your `label` and `input` to provide layout, borders, and states.

### Semantic Color Scale (The "Knobs")

**Start here.** Changing these variables will automatically update focus rings, borders, text, and backgrounds across all states.

| Property                            | Default             | Used For                         |
| :---------------------------------- | :------------------ | :------------------------------- |
| `--ngx-form-field-color-primary`    | `#005fcc`           | Focus states, active borders     |
| `--ngx-form-field-color-error`      | `#dc2626`           | Invalid states, required markers |
| `--ngx-form-field-color-warning`    | `#f59e0b`           | Warning states                   |
| `--ngx-form-field-color-text`       | `#324155`           | Input text, Labels               |
| `--ngx-form-field-color-text-muted` | `#5f7589`           | Placeholders, Hints              |
| `--ngx-form-field-color-surface`    | `#ffffff`           | Input background                 |
| `--ngx-form-field-color-border`     | `rgba(172,...0.25)` | Default borders                  |
| `--ngx-form-field-color-disabled`   | `#f3f4f6`           | Disabled background              |

### Specific Overrides

If the semantic colors aren't enough, you can override specific parts of the component.

#### Layout & Spacing

| Property                         | Default          | Description                 |
| :------------------------------- | :--------------- | :-------------------------- |
| `--ngx-form-field-input-padding` | `0.5rem 0.75rem` | Padding inside the border   |
| `--ngx-form-field-radius`        | `0.25rem`        | Border radius               |
| `--ngx-form-field-min-height`    | `3.5rem`         | Height for outlined variant |
| `--ngx-form-field-gap`           | `0.125rem`       | Gap between label and input |

#### Typography

| Property                                     | Description            |
| :------------------------------------------- | :--------------------- |
| `--ngx-form-field-outline-label-font-family` | Font family for labels |
| `--ngx-form-field-outline-input-font-family` | Font family for inputs |
| `--ngx-form-field-outline-label-size`        | Font size for labels   |
| `--ngx-form-field-outline-input-size`        | Font size for inputs   |

---

## 4. Recipes & Common Scenarios

### Scenario A: "I just want it to match my Brand"

Redefine the semantic colors in your global styles or component.

```css
/* Apply to all fields */
ngx-signal-form-field {
  --ngx-form-field-color-primary: #6da305; /* My Brand Green */
  --ngx-form-field-color-error: #d93025; /* My Error Red */
}
```

### Scenario B: Framework Integration (Bootstrap/Tailwind)

Map your framework's variables to the toolkit's semantic layer.

**Bootstrap Example:**

```css
ngx-signal-form-field {
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
  ngx-signal-form-field {
    --ngx-form-field-color-surface: #1f2937;
    --ngx-form-field-color-text: #f9fafb;
    /* ... other dark tokens */
  }
}

/* 2. Fix: Force Light Mode if user explicitly chose it (even if system is Dark) */
:root:not(.dark) ngx-signal-form-field {
  --ngx-form-field-color-surface: #ffffff;
  --ngx-form-field-color-text: #324155;
  /* ... reset to light tokens */
}
```
