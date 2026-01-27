export const NESTED_GROUPS_CONTENT = {
  demonstrated: {
    icon: '🌳',
    title: 'Nested Form Groups',
    sections: [
      {
        title: 'Hierarchical Data',
        items: [
          '• <strong>Deep State:</strong> Managing nested objects in form models',
          '• <strong>Path Access:</strong> Accessing nested fields via dot notation (e.g. <code>form.address.city</code>)',
          '• <strong>Group Validation:</strong> Validating logical groups of fields',
        ],
      },
    ],
  },
  learning: {
    title: 'Architectural Tips',
    sections: [
      {
        title: 'Model Structure',
        items: [
          '• Reflect your API/Database structure in your form model',
          '• Signal Forms handles deeply nested reactivity automatically',
          '• Use sub-components for complex nested groups to keep templates clean',
        ],
      },
    ],
    nextStep: {
      text: 'Next: add server-side checks →',
      link: '../async-validation',
      linkText: 'Async Validation',
    },
  },
} as const;
