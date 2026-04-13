/**
 * Content configuration for the Basic Usage example.
 */

export const BASIC_USAGE_CONTENT = {
  demonstrated: {
    icon: '🎁',
    title: 'Form Field Wrapper Features',
    sections: [
      {
        title: 'Form Fields & Validations',
        items: [
          '<strong>Name:</strong> Required, min 2 characters',
          '<strong>Email:</strong> Required, valid email format',
          '<strong>Website:</strong> Optional, must be valid URL if provided',
          '<strong>Age:</strong> Required, 18-119 range',
          '<strong>Bio:</strong> Required, 20-500 characters',
          '<strong>Country:</strong> Required selection',
          '<strong>Terms:</strong> Required checkbox agreement',
        ],
      },
      {
        title: 'Wrapper Capabilities',
        items: [
          'Automatic error display (no manual <code>&lt;ngx-signal-form-error&gt;</code>)',
          'Multiple field types: text, email, URL, number, textarea, select, checkbox',
          'Consistent spacing via CSS custom properties',
          'Proper label/input associations',
          'Full ARIA attribute support',
        ],
      },
      {
        title: 'Developer Experience',
        items: [
          'Clean, DRY templates',
          'Type-safe field signals',
          'Compatible with all error strategies',
          'Themeable via CSS custom properties',
        ],
      },
    ],
  },

  learning: {
    title: 'Interactive Field Testing',
    sections: [
      {
        title: '🎨 Appearance & Outline Options',
        items: [
          'Use the <strong>Appearance selector</strong> to toggle between stacked and outline mode natively supported by the wrapper.',
          'The Outline mode provides a more distinct visual boundary, often preferred in enterprise applications like Material Design.',
        ],
      },
      {
        title: '🧪 Try Different Field Types',
        items: [
          '1. Name: Type "A" → Error: "min 2 characters"',
          '2. Email: Type "test" → Tab → Error: "invalid format"',
          '3. Website: Type "hello" → Error: "must be valid URL"',
          '4. Age: Enter "15" → Error: "must be at least 18"',
          '5. Bio: Type 10 chars → Error: "min 20 characters"',
          '6. Submit without checking Terms → Error on checkbox',
        ],
      },
      {
        title: '📊 Code Reduction Benefits',
        items: [
          '<strong>Before:</strong> Manual error components per field',
          '<strong>After:</strong> Automatic error display in wrapper',
          '<strong>Consistency:</strong> Uniform error styling across app',
          '<strong>Maintenance:</strong> Update styling in one place',
          '<strong>Total reduction:</strong> 67% less code from pure Signal Forms',
        ],
      },
      {
        title: '🎨 Customization Options',
        items: [
          'Override CSS custom properties for brand alignment',
          'Pass custom error strategy per field if needed',
          'Full TypeScript support with generics',
        ],
      },
    ],
    nextStep: {
      text: 'See complex forms with nested objects and arrays →',
      link: '/form-field-wrapper/complex-forms',
      linkText: 'Complex Forms',
    },
  },
} as const;
