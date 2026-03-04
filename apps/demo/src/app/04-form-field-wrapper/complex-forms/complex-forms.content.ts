/**
 * Complex Forms Content
 *
 * Educational content for the complex forms example
 */

export const COMPLEX_FORMS_CONTENT = {
  demonstrated: {
    icon: '🎯',
    title: 'Complex Forms Made Simple',
    sections: [
      {
        title: 'NgxFormField Features',
        items: [
          '• <strong>Nested objects:</strong> Deep path validation',
          '• <strong>Dynamic arrays:</strong> Add/remove items with reactive updates',
          '• <strong>Automatic layout:</strong> Label + input + error container',
          '• <strong>Type safety:</strong> Full TypeScript inference',
          '• <strong>Maximum reduction:</strong> 67% less boilerplate',
        ],
      },
      {
        title: 'Real-World Patterns',
        items: [
          '• <strong>Multi-section forms:</strong> Personal info + Address + Skills',
          '• <strong>Array operations:</strong> CRUD for skills and contacts',
          '• <strong>Mixed field types:</strong> Text, number, select, checkbox',
          '• <strong>Conditional validation:</strong> Based on user input',
          '• <strong>Responsive grid:</strong> Mobile-first layout',
        ],
      },
    ],
  },
  learning: {
    title: 'Advanced Patterns & Best Practices',
    sections: [
      {
        title: 'Form Architecture & Grouping',
        items: [
          '• <strong>Nested models:</strong> Organize complex data logically',
          '• <strong>Array management:</strong> Signal updates for add/remove',
          '• <strong>Fieldset Grouping:</strong> Use <code>NgxSignalFormFieldset</code> for grouped validation and aggregated errors.',
        ],
      },
      {
        title: 'Code Reduction Benefits',
        items: [
          '• <strong>Without wrapper:</strong> ~320 lines (manual labels/errors/layout)',
          '• <strong>With wrapper:</strong> ~280 lines (33% less boilerplate)',
          '• <strong>Zero manual ARIA:</strong> Automatic accessibility',
          '• <strong>Consistent UX:</strong> Unified error display',
        ],
      },
    ],
    nextStep: {
      text: 'Ready to configure globally?',
      link: '/advanced-scenarios/global-configuration',
      linkText: 'Explore Advanced Configuration →',
    },
  },
} as const;
