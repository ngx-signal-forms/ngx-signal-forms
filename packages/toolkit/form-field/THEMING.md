# Form Field Theming Guide

Comprehensive guide for theming `@ngx-signal-forms/toolkit/form-field` components using CSS custom properties.

## Quick Reference: CSS Custom Properties by Purpose

Use this table to quickly find the right property for your theming needs:

| **Purpose**                | **Property**                                        | **Default**                                                    | **Use Case**                |
| -------------------------- | --------------------------------------------------- | -------------------------------------------------------------- | --------------------------- |
| **Brand Colors**           |                                                     |                                                                |                             |
| Primary/focus color        | `--ngx-form-field-outline-focus-border-color`       | `#005fcc`                                                      | Brand accent, focus states  |
| Error/required marker      | `--ngx-form-field-outline-invalid-border-color`     | `#dc2626`                                                      | Validation errors           |
| Required marker color      | `--ngx-form-field-outline-required-color`           | `#dc2626`                                                      | Asterisk color              |
| **Text & Labels**          |                                                     |                                                                |                             |
| Label text color           | `--ngx-form-field-outline-label-color`              | `rgba(71,91,119,0.75)`                                         | Label in outlined border    |
| Input text color           | `--ngx-form-field-outline-input-color`              | `#324155`                                                      | User-entered text           |
| Placeholder text color     | `--ngx-form-field-outline-placeholder-color`        | `rgba(71,91,119,0.5)`                                          | Placeholder hints           |
| **Backgrounds & Borders**  |                                                     |                                                                |                             |
| Input background           | `--ngx-form-field-outline-bg`                       | `#ffffff`                                                      | Input field background      |
| Border default             | `--ngx-form-field-outline-border`                   | `1px solid rgba(50,65,85,0.25)`                                | Default border              |
| Border radius              | `--ngx-form-field-outline-border-radius`            | `0.25rem`                                                      | Corner roundness            |
| **States**                 |                                                     |                                                                |                             |
| Focus box shadow           | `--ngx-form-field-outline-focus-box-shadow`         | `0 0 0 2px rgba(0,95,204,0.25)`                                | Focus glow effect           |
| Invalid box shadow         | `--ngx-form-field-outline-invalid-focus-box-shadow` | `0 0 0 2px rgba(220,38,38,0.25)`                               | Error state glow            |
| Disabled background        | `--ngx-form-field-outline-disabled-bg`              | `#f3f4f6`                                                      | Disabled field background   |
| Disabled opacity           | `--ngx-form-field-outline-disabled-opacity`         | `0.6`                                                          | Disabled field transparency |
| **Layout & Spacing**       |                                                     |                                                                |                             |
| Gap between label/input    | `--ngx-form-field-outline-gap`                      | `0.125rem` (2px)                                               | Internal spacing            |
| Input padding              | `--ngx-form-field-outline-padding`                  | `0.5rem 0.75rem`                                               | Input padding (4px 8px)     |
| Minimum height             | `--ngx-form-field-outline-min-height`               | `3.5rem`                                                       | Container height            |
| **Typography**             |                                                     |                                                                |                             |
| Label font family          | `--ngx-form-field-outline-label-font-family`        | `'Inter Variable', sans-serif`                                 | Label typeface              |
| Label font size            | `--ngx-form-field-outline-label-font-size`          | `0.75rem` (12px)                                               | Label size (caption)        |
| Label font weight          | `--ngx-form-field-outline-label-font-weight`        | `400`                                                          | Label weight                |
| Label line height          | `--ngx-form-field-outline-label-line-height`        | `1rem`                                                         | Label spacing               |
| Input font family          | `--ngx-form-field-outline-input-font-family`        | `'Inter Variable', sans-serif`                                 | Input typeface              |
| Input font size            | `--ngx-form-field-outline-input-font-size`          | `0.875rem` (14px)                                              | Input size (body-2)         |
| Input font weight          | `--ngx-form-field-outline-input-font-weight`        | `400`                                                          | Input weight                |
| Input line height          | `--ngx-form-field-outline-input-line-height`        | `1.25rem`                                                      | Input spacing               |
| Required marker weight     | `--ngx-form-field-outline-required-font-weight`     | `600`                                                          | Asterisk boldness           |
| **Error/Warning Messages** |                                                     |                                                                |                             |
| Error horizontal padding   | `--ngx-signal-form-error-padding-horizontal`        | `0.5rem` (8px)                                                 | Error message alignment     |
| Error font size            | `--ngx-signal-form-error-font-size`                 | `0.75rem` (12px)                                               | Error message text size     |
| Error text color           | `--ngx-signal-form-error-color`                     | `#dc2626`                                                      | Error message color         |
| Warning text color         | `--ngx-signal-form-warning-color`                   | `#f59e0b`                                                      | Warning message color       |
| Error top margin           | `--ngx-signal-form-error-margin-top`                | `0.375rem`                                                     | Space above error messages  |
| **Animations**             |                                                     |                                                                |                             |
| Transition timing          | `--ngx-form-field-outline-transition`               | `border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out` | State changes               |

### Common Theming Scenarios

**Dark Mode** → Override: `bg`, `border`, `label-color`, `input-color`, `placeholder-color`, `focus-border-color`, `focus-box-shadow`, `disabled-bg`, `error-color`, `warning-color`

**Brand Colors** → Override: `focus-border-color`, `focus-box-shadow`, `invalid-border-color`, `required-color`, `error-color`

**Size Scaling** → Override: `padding`, `min-height`, `label-font-size`, `input-font-size`, `gap`, `error-font-size`, `error-padding-horizontal`

**Custom Fonts** → Override: `label-font-family`, `input-font-family`

**Error Styling** → Override: `error-padding-horizontal`, `error-font-size`, `error-color`, `warning-color`, `error-margin-top`

---

## Architecture Overview

The theming system uses **semantic layering** with property derivation:

1. **Design Tokens** (pseudo-private, prefixed `--_field-*`) - Base colors, spacing, typography
2. **Semantic Color Scale** (public API, prefixed `--ngx-form-field-color-*`) - Brand/state colors (primary, error, text, surface, border, disabled)
3. **Component-Specific Properties** (public API, prefixed `--ngx-form-field-*`) - Purpose-based properties (focus-color, invalid-color, label-color, etc.)
4. **Component Implementation** - Internal vars that reference layers 2/3 with fallbacks to layer 1

### Derivation Chain Example

```css
--_field-clr-primary: #3b82f6 (Layer 1: Design token) ↓ derives to
  --ngx-form-field-color-primary
  (Layer 2: Semantic color - RECOMMENDED for theming) ↓ derives to
  --ngx-form-field-focus-color (Layer 3: Specific use case) ↓ used in
  implementation input: focus {border-color: var(--_focus-color) ;};
```

### Key Benefits

- **Easy theming**: Change `--color-primary`, updates focus/hover/active states automatically
- **Clear semantics**: Use familiar names (primary, error, warning) instead of abstract tokens
- **Automatic consistency**: Both standard and outlined layouts derive from same semantic colors
- **Encapsulation**: Private tokens (`--_field-*`) can evolve without breaking your theme

---

## Quick Reference: Themeable Properties

These are the public API properties you can override for theming:

### Semantic Colors (Recommended - Brand Theming)

Override these for consistent brand theming across all field states:

```css
/* Brand/State Colors */
--ngx-form-field-color-primary: #3b82f6; /* Focus states, brand accent */
--ngx-form-field-color-error: #ef4444; /* Validation errors, required markers */
--ngx-form-field-color-text: #1f2937; /* Labels, input text */
--ngx-form-field-color-text-muted: #6b7280; /* Placeholders, hints */
--ngx-form-field-color-surface: #ffffff; /* Input backgrounds */
--ngx-form-field-color-border: #d1d5db; /* Default borders */
--ngx-form-field-color-disabled: #f3f4f6; /* Disabled backgrounds */
```

### Specific Properties (Fine-Grained Control)

Override these when you need precise control over individual aspects:

```css
/* Layout */
--ngx-form-field-gap: 0.5rem;
--ngx-form-field-margin: 1rem;
--ngx-form-field-min-height: 3.5rem; /* Outlined layout only */

/* Label */
--ngx-form-field-label-size: 0.875rem;
--ngx-form-field-label-weight: 500;
--ngx-form-field-label-color: /* derives from --color-text */

/* Input */ --ngx-form-field-input-size: 0.875rem;
--ngx-form-field-input-padding: 0.5rem 0.75rem;
--ngx-form-field-input-color: /* derives from --color-text */ --ngx-form-field-input-bg:
  /* derives from --color-surface */
  --ngx-form-field-border-color: /* derives from --color-border */
  --ngx-form-field-radius: 0.25rem;

/* States */
--ngx-form-field-focus-color: /* derives from --color-primary */ --ngx-form-field-invalid-color:
  /* derives from --color-error */
  --ngx-form-field-disabled-bg: /* derives from --color-disabled */
  --ngx-form-field-disabled-opacity: 0.6;

/* Placeholder */
--ngx-form-field-placeholder-color: /* derives from --color-text-muted */;
```

---

## Theming Examples

### Example 1: Dark Mode Theme

Complete dark mode theme for outlined form fields with proper contrast and readability:

```css
/* Dark mode theme for outlined form fields */
@media (prefers-color-scheme: dark) {
  ngx-signal-form-field {
    /* Backgrounds & Borders */
    --ngx-form-field-outline-bg: #111827; /* Dark input background */
    --ngx-form-field-outline-border: 1px solid rgba(156, 163, 175, 0.25); /* Subtle border */
    --ngx-form-field-outline-disabled-bg: #1f2937; /* Slightly lighter for disabled */

    /* Text Colors */
    --ngx-form-field-outline-label-color: rgba(
      209,
      213,
      219,
      0.75
    ); /* Light gray label */
    --ngx-form-field-outline-input-color: #f9fafb; /* Almost white text */
    --ngx-form-field-outline-placeholder-color: rgba(
      156,
      163,
      175,
      0.35
    ); /* Lighter placeholder for better contrast */

    /* Focus States - Lighter blue for dark backgrounds */
    --ngx-form-field-outline-focus-border-color: #60a5fa; /* Lighter blue */
    --ngx-form-field-outline-focus-box-shadow: 0 0 0 2px
      rgba(96, 165, 250, 0.25); /* Lighter blue glow */

    /* Error States - Slightly lighter red for dark backgrounds */
    --ngx-form-field-outline-invalid-border-color: #f87171; /* Lighter red */
    --ngx-form-field-outline-invalid-focus-box-shadow: 0 0 0 2px
      rgba(248, 113, 113, 0.25); /* Lighter red glow */
    --ngx-form-field-outline-required-color: #fca5a5; /* Even lighter red for asterisk */

    /* Disabled State */
    --ngx-form-field-outline-disabled-opacity: 0.5; /* Reduced opacity */
  }
}
```

**Result:**

- ✅ High contrast between text and backgrounds
- ✅ Placeholder text clearly distinguishable from input values (35% opacity)
- ✅ Focus and error states visible against dark backgrounds
- ✅ Required markers and validation messages maintain accessibility standards
- ✅ Disabled fields remain subtly differentiated

**Alternative: Using `:host-context(.dark)` for manual theme switching:**

```css
/* Component-scoped dark mode using .dark class on ancestor */
:host-context(.dark) ngx-signal-form-field {
  /* Same properties as above */
  --ngx-form-field-outline-bg: #111827;
  --ngx-form-field-outline-input-color: #f9fafb;
  /* ... */
}
```

---

### Example 2: Brand Color Theme

Apply your brand colors by mapping to semantic color properties:

```css
/* Brand: Purple theme */
:root {
  --brand-primary: #8b5cf6;
  --brand-error: #ec4899;
  --brand-surface: #faf5ff;
  --brand-text: #1f2937;
}

ngx-signal-form-field {
  /* Map brand colors to semantic scale */
  --ngx-form-field-color-primary: var(--brand-primary);
  --ngx-form-field-color-error: var(--brand-error);
  --ngx-form-field-color-surface: var(--brand-surface);

  /* All specific properties (focus, invalid, bg, etc.) derive automatically */

  /* Optional: Fine-tune specific use cases */
  --ngx-form-field-label-color: color-mix(
    in srgb,
    var(--brand-primary) 30%,
    var(--brand-text) 70%
  );
}
```

**Result:**

- Brand colors applied consistently across all states
- Focus color, invalid color, backgrounds all derive from semantic scale
- One change to `--color-primary` updates focus, hover, and active states

---

### Example 3: Size Scaling

Use Kevin Powell's scaling technique with a single multiplier:

```css
/* Compact form */
.form-compact ngx-signal-form-field {
  --_scale: 0.875; /* 87.5% of default */

  --ngx-form-field-label-size: calc(var(--_scale) * var(--_field-text-sm));
  --ngx-form-field-input-size: calc(var(--_scale) * var(--_field-text-sm));
  --ngx-form-field-input-padding: calc(var(--_scale) * var(--_field-space-md))
    calc(var(--_scale) * var(--_field-space-lg));
  --ngx-form-field-gap: calc(var(--_scale) * var(--_field-space-md));
  --ngx-form-field-margin: calc(var(--_scale) * var(--_field-space-xl));
}

/* Large form */
.form-large ngx-signal-form-field {
  --_scale: 1.25; /* 125% of default */

  --ngx-form-field-label-size: calc(var(--_scale) * var(--_field-text-sm));
  --ngx-form-field-input-size: calc(var(--_scale) * var(--_field-text-sm));
  --ngx-form-field-input-padding: calc(var(--_scale) * var(--_field-space-md))
    calc(var(--_scale) * var(--_field-space-lg));
  --ngx-form-field-gap: calc(var(--_scale) * var(--_field-space-md));
  --ngx-form-field-margin: calc(var(--_scale) * var(--_field-space-xl));
}
```

**Usage:**

```html
<div class="form-compact">
  <ngx-signal-form-field [field]="form.email" outline>
    <label for="email">Email</label>
    <input id="email" [field]="form.email" />
  </ngx-signal-form-field>
</div>
```

---

### Example 4: Material Design Theme

Recreate Material Design's outlined input style:

```css
ngx-signal-form-field {
  /* Material colors */
  --ngx-form-field-border-color: rgba(0, 0, 0, 0.23);
  --ngx-form-field-focus-color: #6200ee; /* Material purple */
  --ngx-form-field-invalid-color: #b00020; /* Material error */

  /* Material typography */
  --ngx-form-field-label-size: 0.75rem;
  --ngx-form-field-label-weight: 400;
  --ngx-form-field-input-size: 1rem;

  /* Material spacing */
  --ngx-form-field-input-padding: 1rem 0.75rem 0.5rem;
  --ngx-form-field-radius: 0.25rem;

  /* Material states */
  --ngx-form-field-disabled-opacity: 0.38;
}
```

---

### Example 5: High Contrast Mode

Enhance contrast for better accessibility:

```css
@media (prefers-contrast: high) {
  ngx-signal-form-field {
    /* Use semantic colors for high contrast */
    --ngx-form-field-color-border: #000000;
    --ngx-form-field-color-primary: #0000ff;
    --ngx-form-field-color-text: #000000;
    --ngx-form-field-color-text-muted: #333333;
  }
}
```

---

### Example 6: Per-Field Styling

Target specific fields for unique styling:

```css
/* Email field with custom icon color */
.email-field {
  --ngx-form-field-focus-color: #ea4335; /* Gmail red */
}

/* Password field with warning color */
.password-field {
  --ngx-form-field-focus-color: #f59e0b; /* Amber */
}

/* Success state field */
.success-field {
  --ngx-form-field-border-color: #10b981; /* Green */
  --ngx-form-field-focus-color: #10b981;
}
```

**Usage:**

```html
<ngx-signal-form-field [field]="form.email" outline class="email-field">
  <label for="email">Email</label>
  <input id="email" type="email" [field]="form.email" />
</ngx-signal-form-field>
```

---

### Example 7: Error Message Alignment and Styling

Customize error message appearance and alignment without using `::ng-deep`:

```css
/* ✅ CORRECT - Use CSS custom properties */
ngx-signal-form-field {
  /* Increase error padding to match custom input padding */
  --ngx-signal-form-error-padding-horizontal: 1rem; /* Default: 0.5rem */

  /* Adjust error message size and spacing */
  --ngx-signal-form-error-font-size: 0.875rem; /* Larger: 14px instead of 12px */
  --ngx-signal-form-error-margin-top: 0.5rem; /* More space above */

  /* Custom error colors */
  --ngx-signal-form-error-color: #991b1b; /* Darker red */
  --ngx-signal-form-warning-color: #ea580c; /* Darker orange */
}

/* Dark mode error styling */
@media (prefers-color-scheme: dark) {
  ngx-signal-form-field {
    --ngx-signal-form-error-color: #fca5a5; /* Lighter red for dark bg */
    --ngx-signal-form-warning-color: #fcd34d; /* Lighter yellow for dark bg */
  }
}
```

**❌ WRONG - Don't use ::ng-deep:**

```css
/* Breaks encapsulation and may stop working in future versions */
ngx-signal-form-field ::ng-deep .ngx-signal-form-error {
  padding-left: 1rem;
  font-size: 0.875rem;
}
```

---

### Example 8: Outlined Layout Customization

The outlined layout reuses the same tokens but applies them differently. You can still override:

```css
/* Increase outlined container height */
ngx-signal-form-field {
  --ngx-form-field-min-height: 4rem; /* Default: 3.5rem */
}

/* Adjust label position in outlined */
.ngx-signal-forms-outline label {
  /* Label styling is automatic via :host selector,
     but you can override with higher specificity */
  margin-bottom: 0.25rem; /* Increase label-to-input spacing */
}
```

---

### Example 9: Smooth Transitions

Add smooth transitions to theme changes:

```css
ngx-signal-form-field {
  /* Default transitions already applied to borders/shadows */
  /* Extend to color properties for theme transitions */
}

/* ⚠️ AVOID ::ng-deep - Use CSS custom properties instead */
/* See "Best Practices" section below for proper approach */

/* Smooth theme toggle animation */
[data-theme='dark'] ngx-signal-form-field {
  transition:
    --ngx-form-field-color-text 0.3s ease,
    --ngx-form-field-color-surface 0.3s ease;
}
```

---

## Advanced Theming

### Design Token Reference

These are **internal tokens** (prefixed `--_field-*`) that provide default values. Override the public API (`--ngx-form-field-*`) for theming, or override these for global changes:

### Color Tokens

```css
--_field-clr-primary: #3b82f6; /* Blue - focus states */
--_field-clr-danger: #ef4444; /* Red - invalid states */
--_field-clr-text: #1f2937; /* Dark gray - main text */
--_field-clr-text-muted: #6b7280; /* Medium gray - placeholders */
--_field-clr-text-subtle: rgba(
  71,
  91,
  119,
  0.75
); /* Light gray - outlined labels */
--_field-clr-surface: #ffffff; /* White - backgrounds */
--_field-clr-border: #d1d5db; /* Light gray - borders */
--_field-clr-disabled: #f3f4f6; /* Very light gray - disabled bg */
```

### Spacing Tokens

```css
--_field-space-xs: 0.125rem; /* 2px */
--_field-space-sm: 0.25rem; /* 4px */
--_field-space-md: 0.5rem; /* 8px */
--_field-space-lg: 0.75rem; /* 12px */
--_field-space-xl: 1rem; /* 16px */
```

### Typography Tokens

```css
--_field-text-xs: 0.75rem; /* 12px - outlined label */
--_field-text-sm: 0.875rem; /* 14px - default label/input */
--_field-text-base: 1rem; /* 16px - large input */
```

### Other Tokens

```css
--_field-radius: 0.25rem; /* Border radius */
--_field-opacity-disabled: 0.6; /* Disabled opacity */
```

---

## Best Practices

### 1. Use Semantic Colors for Brand Theming

**✅ Best - Override semantic color scale:**

```css
/* Change brand colors at the semantic level */
ngx-signal-form-field {
  --ngx-form-field-color-primary: #8b5cf6; /* Purple brand */
  --ngx-form-field-color-error: #ec4899; /* Pink errors */
  --ngx-form-field-color-text: #1f2937; /* Dark text */
}
/* All derived properties (focus, invalid, labels, inputs) update automatically */
```

**⚠️ Okay - Override specific properties:**

```css
/* Fine-grained control when needed */
ngx-signal-form-field {
  --ngx-form-field-focus-color: #8b5cf6;
  --ngx-form-field-invalid-color: #ec4899;
  --ngx-form-field-label-color: #1f2937;
  --ngx-form-field-input-color: #1f2937;
}
```

**❌ Never - Override private tokens:**

```css
/* WRONG: Breaks encapsulation, may change in future versions */
ngx-signal-form-field {
  --_field-clr-primary: #8b5cf6; /* Private token - DON'T TOUCH */
  --_field-clr-text: #1f2937; /* Private token - DON'T TOUCH */
}
```

### 2. Use CSS Custom Property Fallbacks

```css
/* Provide fallback for missing design system tokens */
ngx-signal-form-field {
  --ngx-form-field-focus-color: var(--color-primary, #3b82f6);
}
```

### 3. Avoid ::ng-deep - Use CSS Custom Properties Instead

**❌ WRONG - Using ::ng-deep breaks encapsulation:**

```css
/* DON'T DO THIS - Breaks component encapsulation */
ngx-signal-form-field ::ng-deep .ngx-signal-form-error {
  padding-left: 1rem;
  padding-right: 1rem;
}

ngx-signal-form-field ::ng-deep input {
  border-color: red;
}
```

**✅ CORRECT - Override CSS custom properties:**

```css
/* Clean, maintainable approach using public API */
ngx-signal-form-field {
  /* Control error message padding */
  --ngx-signal-form-error-padding-horizontal: 1rem;

  /* Control input border color */
  --ngx-form-field-border-color: red;
  --ngx-form-field-invalid-color: darkred;
}
```

**Why CSS custom properties are better:**

- ✅ Maintains component encapsulation
- ✅ Future-proof (won't break when component internals change)
- ✅ Self-documenting (property names describe their purpose)
- ✅ Easier to maintain and debug
- ✅ Works seamlessly with Angular's view encapsulation

**Available error/warning styling variables:**

```css
/* Error and warning message styling */
--ngx-signal-form-error-padding-horizontal: 0.5rem; /* Left/right padding */
--ngx-signal-form-error-font-size: 0.75rem; /* Text size (12px) */
--ngx-signal-form-error-color: #dc2626; /* Error text color */
--ngx-signal-form-warning-color: #f59e0b; /* Warning text color */
--ngx-signal-form-error-margin-top: 0.375rem; /* Space above messages */
```

### 4. Leverage `color-mix()` for Variants

```css
/* Generate hover/active states from base color */
.btn-primary {
  background: var(--ngx-form-field-focus-color);
}

.btn-primary:hover {
  background: color-mix(in srgb, var(--ngx-form-field-focus-color) 90%, black);
}
```

### 5. Test with Browser DevTools

Use browser DevTools to inspect computed values:

1. Inspect element in DevTools
2. Find "Computed" tab
3. Search for `--ngx-form-field-` to see all active properties
4. Check fallback chain to verify token inheritance

### 6. Document Your Theme

Create a theme file with clear comments:

```css
/**
 * App Theme: Dark Mode
 * Applied to: All form fields
 * Overrides: 8 design tokens
 */
@media (prefers-color-scheme: dark) {
  ngx-signal-form-field {
    --_field-clr-text: #f9fafb;
    --_field-clr-surface: #1f2937;
    /* ... */
  }
}
```

---

## Browser Support

All examples use modern CSS features:

- **CSS Custom Properties**: Chrome 49+, Firefox 31+, Safari 9.1+
- **`color-mix()`**: Chrome 111+, Firefox 113+, Safari 16.2+
- **`:has()` selector**: Chrome 105+, Firefox 121+, Safari 15.4+
- **`@starting-style`**: Chrome 117+, Firefox 129+, Safari 17.5+

Fallback strategies for older browsers:

```css
/* Fallback for browsers without color-mix() */
.focus-shadow {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); /* Static fallback */
  box-shadow: 0 0 0 3px
    color-mix(in srgb, var(--ngx-form-field-focus-color) 10%, transparent); /* Modern */
}
```

---

## Resources

- **[Kevin Powell - Scaling with Custom Properties](https://www.youtube.com/watch?v=xCSw6qVNv6s)**: Learn unitless scaling patterns
- **[CSS-Tricks - Local vs Global Scoping](https://css-tricks.com/css-custom-properties-scoping/)**: Understand component-level theming
- **[Lea Verou - Pseudo-Private Defaults](https://lea.verou.me/blog/2021/10/custom-properties-with-defaults/)**: Master the `--_var: var(--var, default)` pattern
- **[MDN - Using CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)**: Complete reference

---

## Need Help?

If your theme isn't working as expected:

1. ✅ Check browser DevTools computed values
2. ✅ Verify property names (typos break CSS vars silently)
3. ✅ Ensure CSS custom properties are scoped correctly
4. ✅ Test with `!important` to check specificity issues (then remove)
5. ✅ Validate `color-mix()` syntax if using color derivation

For bug reports or questions, open an issue on GitHub.
