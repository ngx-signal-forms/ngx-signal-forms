export const HEADLESS_FIELDSET_UTILITIES_CONTENT = {
  demonstrated: {
    icon: '🧪',
    title: 'Headless Fieldset + Field Names',
    sections: [
      {
        title: 'Directives',
        items: [
          '<strong>ngxSignalFormHeadlessErrorSummary:</strong> Form-level summary with custom markup',
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
          '<strong>createFieldStateFlags:</strong> Reusable valid/invalid/touched/dirty/pending signals',
        ],
      },
    ],
  },
  escapeHatch: {
    icon: '🔀',
    title: 'Wrapper vs Headless: When to Switch',
    sections: [
      {
        title: 'Use the wrapper when',
        items: [
          'Standard text inputs, selects, textareas, or checkboxes',
          'Built-in control kinds like switch, slider, or radio-group',
          'You want consistent layout, error display, and ARIA out of the box',
        ],
      },
      {
        title: 'Switch to headless when',
        items: [
          'Bespoke composite controls (date-range pickers, multi-select tags, rich editors)',
          'Third-party widgets that manage their own ARIA and focus',
          'Layouts the wrapper grid cannot express (e.g., inline token lists)',
          'You need full DOM ownership but still want toolkit error state and field-name resolution',
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
      link: '/form-field-wrapper/complex-forms',
      linkText: 'Complex Forms',
    },
  },
} as const;
