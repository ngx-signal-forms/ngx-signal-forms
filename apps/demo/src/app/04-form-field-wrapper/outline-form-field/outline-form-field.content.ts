/**
 * Content configuration for the Outline Form Field example.
 */

export const OUTLINE_FORM_FIELD_CONTENT = {
  demonstrated: {
    icon: '�',
    title: 'Default Outlined Form Fields',
    sections: [
      {
        title: 'Out-of-the-Box Styling',
        items: [
          '<strong>Figma Design:</strong> Matches default outlined form field design',
          '<strong>No Custom CSS:</strong> Uses toolkit default styling',
          '<strong>Outlined Layout:</strong> Material Design style inputs with <code>outline</code> attribute',
          '<strong>Zero Configuration:</strong> Works immediately without theming',
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
    title: 'Using Outlined Form Fields',
    sections: [
      {
        title: '� Default Outlined Layout',
        items: [
          '1. Add <code>outline</code> attribute to form field',
          '2. Use default styling (matches Figma design)',
          '3. No CSS custom properties needed',
          '4. Customize only if needed for brand requirements',
        ],
      },
      {
        title: '📐 Default Design Tokens',
        items: [
          '<strong>Typography:</strong> 12px labels, 14px inputs (Inter Variable)',
          '<strong>Spacing:</strong> 4px vertical, 8px horizontal padding',
          '<strong>Colors:</strong> #324155 text, rgba(50,65,85,0.25) borders',
          '<strong>Borders:</strong> 4px border radius, subtle focus states',
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
          '<strong>Field-Level:</strong> <code>ngx-signal-form-field-wrapper</code> auto-shows errors for individual inputs',
          '<strong>Array-Level:</strong> Use <code>&lt;ngx-signal-form-error [formField]="form.array"&gt;</code> for combined errors',
          '<strong>Use customError():</strong> All validators must return <code>customError({ kind, message })</code>',
          '<strong>Examples:</strong> Duplicate detection, minimum array length, cross-item validations',
        ],
      },
    ],
    nextStep: {
      text: 'Explore theming options for custom branding →',
      link: '/packages/toolkit/form-field/THEMING.md',
      linkText: 'Theming Documentation',
    },
  },
} as const;
