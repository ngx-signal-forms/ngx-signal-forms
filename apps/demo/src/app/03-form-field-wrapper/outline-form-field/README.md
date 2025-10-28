# Outline Form Field Example

## Overview

This example demonstrates the default outlined form field styling that matches the Figma design system without custom CSS overrides. The form showcases a Dutch legal system interface for entering prison sentence data.

## Key Features

- **Default Outlined Styling**: Uses toolkit's default design (matches Figma)
- **Zero Configuration**: No custom CSS properties needed
- **Outlined Input Layout**: Material Design inspired inputs with floating labels
- **Nested Card Structure**: Multi-level hierarchy with semi-transparent backgrounds
- **Dynamic Array Handling**: Add/remove facts, offenses, and legal articles
- **Custom Icons**: SVG icons integrated with design system colors
- **Consistent Spacing**: Design tokens for all spacing values

## Design System

Based on the Figma design system with default toolkit styling:

- **Typography**: 12px labels (caption), 14px inputs (body-2), Inter Variable font
- **Spacing**: 4px vertical, 8px horizontal padding (Figma design)
- **Colors**: #324155 text, rgba(50,65,85,0.25) borders, #005fcc focus
- **Borders**: 4px rounded corners with subtle border colors
- **Icons**: SVG icons matching the design system

## Files

- `outline-form-field.model.ts` - Data model for facts, offenses, and legal articles
- `outline-form-field.validations.ts` - Validation schema
- `outline-form-field.form.ts` - Main form component with dynamic array handling
- `outline-form-field.html` - Template with nested card structure
- `outline-form-field.scss` - Layout styling only (no form field overrides)
- `outline-form-field.content.ts` - Documentation content
- `outline-form-field.page.ts` - Demo page wrapper

## Default Styling

The form uses the toolkit's default outlined styling which matches the Figma design:

```scss
// No custom properties needed - uses toolkit defaults
// Default values automatically match Figma design:
// - Label: 12px, rgba(71,91,119,0.75), weight 400
// - Input: 14px, #324155, weight 400
// - Padding: 4px 8px
// - Border: rgba(50,65,85,0.25), 4px radius
// - Focus: #005fcc with subtle shadow
```

## Usage

```typescript
import { OutlineFormFieldPage } from './outline-form-field';

// In routes
{
  path: 'outline-form-field',
  component: OutlineFormFieldPage
}
```

## Learn More

- See `THEMING.md` in the form-field package for customization options
- Check the Figma design for visual specifications
- Default styling matches Figma design without configuration
