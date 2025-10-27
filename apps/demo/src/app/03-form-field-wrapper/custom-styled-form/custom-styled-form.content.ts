/**
 * Content configuration for the Custom Styled Form example.
 */

export const CUSTOM_STYLED_FORM_CONTENT = {
  demonstrated: {
    icon: '🎨',
    title: 'CSS Custom Properties Theming',
    sections: [
      {
        title: 'Theming Approach',
        items: [
          '<strong>Semantic Colors:</strong> Override <code>--ngx-form-field-color-*</code> properties',
          '<strong>Outlined Layout:</strong> Material Design style inputs with <code>outline</code> attribute',
          '<strong>No Custom Markup:</strong> Pure form-field component theming',
          '<strong>Design Tokens:</strong> Figma design system → CSS custom properties',
        ],
      },
      {
        title: 'Form Features',
        items: [
          '<strong>Nested Arrays:</strong> Facts → Offenses → Legal Articles (3 levels)',
          '<strong>Dynamic Management:</strong> Add/remove with signal updates',
          '<strong>Type Safety:</strong> Full TypeScript inference through all levels',
          '<strong>Dutch Legal System:</strong> Prison sentence data entry',
        ],
      },
      {
        title: 'Array-Level Validations',
        items: [
          '<strong>Duplicate Detection:</strong> Validates uniqueness across array items',
          '<strong>Minimum Length:</strong> Ensures at least one item exists',
          '<strong>Separate Error Display:</strong> Uses <code>&lt;ngx-signal-form-error&gt;</code> for array-level errors',
          '<strong>Combined Errors:</strong> Cross-field validations not tied to individual inputs',
        ],
      },
      {
        title: 'Visual Design',
        items: [
          '<strong>Semi-transparent Cards:</strong> <code>rgba(255,255,255,0.25)</code> backgrounds',
          '<strong>Consistent Spacing:</strong> 4px/8px/16px/24px design tokens',
          '<strong>Custom Icons:</strong> SVG icons with design system colors',
          '<strong>Inter Variable Font:</strong> Professional typography',
        ],
      },
    ],
  },

  learning: {
    title: 'Building Custom Themes',
    sections: [
      {
        title: '🎨 CSS Theming Strategy',
        items: [
          '1. Define design tokens (colors, spacing, typography)',
          '2. Map tokens to semantic form-field properties',
          '3. Use <code>outline</code> attribute for Material Design layout',
          '4. Control spacing with <code>--ngx-form-field-gap</code>, <code>--min-height</code>',
        ],
      },
      {
        title: '📐 Figma to CSS Translation',
        items: [
          '<strong>Extract Tokens:</strong> Colors, spacing, typography from Figma',
          '<strong>Map Semantics:</strong> <code>--ngx-form-field-color-text: var(--text-base)</code>',
          '<strong>Maintain Scale:</strong> Consistent spacing across all components',
          '<strong>Use Variables:</strong> Easy theme switching and maintenance',
        ],
      },
      {
        title: '🔧 Complex Form State',
        items: [
          '<strong>Nested Updates:</strong> Use <code>signal.update()</code> with spread operators',
          '<strong>Array Indices:</strong> Access nested controls via <code>[factIndex].offenses[offenseIndex]</code>',
          '<strong>Immutability:</strong> Always return new objects/arrays',
          '<strong>Type Safety:</strong> TypeScript validates all nesting levels',
        ],
      },
      {
        title: '✅ Array Validation Pattern',
        items: [
          '<strong>Field-Level:</strong> <code>ngx-signal-form-field</code> auto-shows errors for individual inputs',
          '<strong>Array-Level:</strong> Use <code>&lt;ngx-signal-form-error [field]="form.array"&gt;</code> for combined errors',
          '<strong>Use customError():</strong> All validators must return <code>customError({ kind, message })</code>',
          '<strong>Examples:</strong> Duplicate detection, minimum array length, cross-item validations',
        ],
      },
    ],
    nextStep: {
      text: 'Explore the toolkit source code for advanced patterns →',
      link: 'https://github.com/ngx-signal-forms/ngx-signal-forms',
      linkText: 'GitHub Repository',
    },
  },
} as const;
