export const HEADLESS_FIELDSET_UTILITIES_CONTENT = {
  demonstrated: {
    icon: '🧪',
    title: 'Headless Fieldset + Field Names',
    sections: [
      {
        title: 'Directives',
        items: [
          '<strong>ngxSignalFormHeadlessFieldset:</strong> Aggregate group state and errors',
          '<strong>ngxSignalFormHeadlessFieldName:</strong> Resolve IDs and names for ARIA',
          '<strong>ngxSignalFormHeadlessErrorState:</strong> Custom error and warning UI',
        ],
      },
      {
        title: 'Utilities',
        items: [
          '<strong>createErrorState:</strong> Programmatic error visibility signals',
          '<strong>createCharacterCount:</strong> Character count without directives',
        ],
      },
    ],
  },
  learning: {
    title: 'When to choose headless tools',
    sections: [
      {
        title: 'Custom UI kits',
        items: [
          'Keep your own markup while reusing toolkit logic',
          'Centralize error visibility and ARIA wiring',
        ],
      },
      {
        title: 'Group behaviors',
        items: [
          'Aggregate errors for related fields',
          'Surface group state without extra components',
        ],
      },
    ],
    nextStep: {
      text: 'Next: prebuilt wrappers →',
      link: '/form-field-wrapper/basic-usage',
      linkText: 'Form Field Wrapper',
    },
  },
} as const;
