# Form Field Theming Guide

Comprehensive guide for theming `@ngx-signal-forms/toolkit/form-field` components using CSS custom properties.

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

Override semantic color properties to instantly transform the entire form field appearance:

```css
/* Dark mode theme - override semantic colors only */
@media (prefers-color-scheme: dark) {
  ngx-signal-form-field {
    /* Semantic color overrides (public API) */
    --ngx-form-field-color-text: #f9fafb;
    --ngx-form-field-color-text-muted: #9ca3af;
    --ngx-form-field-color-surface: #1f2937;
    --ngx-form-field-color-border: #374151;
    --ngx-form-field-color-disabled: #111827;

    /* Adjust primary/error for better contrast in dark mode */
    --ngx-form-field-color-primary: #60a5fa;
    --ngx-form-field-color-error: #f87171;
  }
}
```

**Result:**

- All labels, inputs, placeholders automatically adapt via derivation
- Both standard and outlined layouts themed consistently
- Focus/invalid states maintain proper contrast
- Only public API properties overridden (private tokens remain untouched)

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

### Example 7: Outlined Layout Customization

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

### Example 8: Smooth Transitions

Add smooth transitions to theme changes:

```css
ngx-signal-form-field {
  /* Default transitions already applied to borders/shadows */
  /* Extend to color properties for theme transitions */
}

ngx-signal-form-field ::ng-deep input,
ngx-signal-form-field ::ng-deep textarea {
  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out,
    background-color 0.3s ease,
    color 0.3s ease;
}

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

### 3. Leverage `color-mix()` for Variants

```css
/* Generate hover/active states from base color */
.btn-primary {
  background: var(--ngx-form-field-focus-color);
}

.btn-primary:hover {
  background: color-mix(in srgb, var(--ngx-form-field-focus-color) 90%, black);
}
```

### 4. Test with Browser DevTools

Use browser DevTools to inspect computed values:

1. Inspect element in DevTools
2. Find "Computed" tab
3. Search for `--ngx-form-field-` to see all active properties
4. Check fallback chain to verify token inheritance

### 5. Document Your Theme

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
