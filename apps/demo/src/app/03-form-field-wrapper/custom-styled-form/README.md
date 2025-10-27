# Custom Styled Form Example

## Overview

This example demonstrates how to create a completely custom-themed form using CSS custom properties to match a Figma design system. The form showcases a Dutch legal system interface for entering prison sentence data.

## Key Features

- **Complete Design System Theme**: All visual aspects controlled via CSS custom properties
- **Outlined Input Layout**: Material Design inspired inputs with floating labels
- **Nested Card Structure**: Multi-level hierarchy with semi-transparent backgrounds
- **Dynamic Array Handling**: Add/remove facts, offenses, and legal articles
- **Custom Icons**: SVG icons integrated with design system colors
- **Consistent Spacing**: Design tokens for all spacing values

## Design System

Based on the Figma design system with:

- **Colors**: Semi-transparent cards, subtle borders, accessible text colors
- **Typography**: Inter Variable font with defined sizes and line heights
- **Spacing**: Consistent design tokens (2xs, xs, m, xl)
- **Borders**: Rounded corners with subtle border colors
- **Icons**: SVG icons matching the design system

## Files

- `custom-styled-form.model.ts` - Data model for facts, offenses, and legal articles
- `custom-styled-form.validations.ts` - Validation schema
- `custom-styled-form.form.ts` - Main form component with dynamic array handling
- `custom-styled-form.html` - Template with nested card structure
- `custom-styled-form.scss` - CSS custom properties theme matching Figma design
- `custom-styled-form.content.ts` - Documentation content
- `custom-styled-form.page.ts` - Demo page wrapper

## CSS Custom Properties

The form uses CSS custom properties to override NgxSignalFormFieldComponent defaults:

```scss
:host {
  // Design tokens
  --surface-card-transparent: rgba(255, 255, 255, 0.25);
  --surface-input: #ffffff;
  --border-transparent-dark: rgba(50, 65, 85, 0.25);
  --text-base: #324155;
  --radius-s: 4px;
  --dimension-m: 16px;

  // Override toolkit defaults
  --ngx-form-field-gap: var(--dimension-xs);
  --ngx-form-field-margin-bottom: var(--dimension-m);
}
```

## Usage

```typescript
import { CustomStyledFormPage } from './custom-styled-form';

// In routes
{
  path: 'custom-styled-form',
  component: CustomStyledFormPage
}
```

## Learn More

- See `THEMING.md` in the form-field package for complete CSS custom properties reference
- Check the Figma design for visual specifications
- Compare with `basic-usage` example to see the difference between default and custom styling
