# CSS Status Classes Demo

This example demonstrates the CSS Status Classes feature introduced in Angular 21.1+, showing:

## Features Demonstrated

1. **Three-Way Comparison**: Angular native vs toolkit 'immediate' vs 'on-touch'
2. **Real-Time State Inspection**: Visual display of field state (invalid, valid, touched, dirty)
3. **CSS Custom Properties Integration**: Shows how status classes work WITH theming
4. **Visual Feedback**: Color-coded borders and backgrounds using CSS custom properties
5. **Both Implementation Approaches**: Examples of utility function and convenience provider

## Key Concepts

### Status Classes (Timing)

- Control **when** CSS classes are applied to form elements
- `'immediate'`: Classes apply as soon as field becomes invalid/valid
- `'on-touch'`: Classes apply only after blur or form submission

### CSS Custom Properties (Styling)

- Control **how** those states are styled (colors, borders, shadows)
- Define theme colors once, use across all states
- Example: `--error-color`, `--success-color`, `--focus-color`

### Integration

```css
/* CSS Custom Properties define the theme */
:host {
  --error-color: #dc2626;
  --success-color: #10b981;
}

/* Status Classes apply theme conditionally */
input.ng-invalid.ng-touched {
  border-color: var(--error-color);
  background: color-mix(in srgb, var(--error-color) 5%, white);
}

input.ng-valid.ng-touched {
  border-color: var(--success-color);
}
```

## Try It Yourself

### Angular Native (Left Form)

- Type an invalid email → Red border appears instantly
- Clear the field → Border stays red
- Notice: Feedback before user interaction

### Toolkit Immediate (Middle Form)

- Type an invalid email → Red border appears instantly
- Notice: Same timing as Angular native

### Toolkit On-Touch (Right Form)

- Type an invalid email → Border stays normal
- Blur the field → Red border appears
- Notice: Feedback after user interaction

## Implementation

See the component code for examples of both approaches:

- **Utility Function**: `provideSignalFormsConfig({ classes: ngxStatusClasses({ strategy: 'on-touch' }) })`
- **Convenience Provider**: `provideNgxStatusClasses({ strategy: 'on-touch' })`

## Further Reading

- [Root README - CSS Status Classes Section](../../../../../../README.md#css-status-classes-angular-211)
- [Toolkit README - Complete API Reference](../../../../../../packages/toolkit/README.md#automatic-status-classes)
- [Form Field Theming Guide - CSS Custom Properties](../../../../../../packages/toolkit/form-field/THEMING.md)
