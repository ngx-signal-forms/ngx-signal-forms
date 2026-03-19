export const FIELDSET_GROUPING_CONTENT = {
  demonstrated: {
    icon: '🧩',
    title: 'Grouped Validation Patterns',
    sections: [
      {
        title: 'What this page demonstrates',
        items: [
          '• <strong>Grouped fieldsets:</strong> Organize related controls under a shared legend',
          '• <strong>Aggregated errors:</strong> Show a single summary for nested invalid fields',
          '• <strong>Error placement:</strong> Compare top and bottom summary placement',
          '• <strong>Mixed groups:</strong> Fieldsets work for addresses, radio groups, and credentials',
        ],
      },
      {
        title: 'What to pay attention to',
        items: [
          '• <strong>Legend clarity:</strong> The shared heading should explain the section before any error appears',
          '• <strong>Summary placement:</strong> Compare whether grouped feedback reads better above or below the controls',
          '• <strong>Visual rhythm:</strong> Group spacing should stay stable even when summaries and warnings appear',
        ],
      },
    ],
  },
  learning: {
    title: 'Fieldset Guidance',
    sections: [
      {
        title: 'When to use grouped summaries',
        items: [
          '• <strong>Shared meaning:</strong> Use a fieldset when multiple controls answer one question or describe one section',
          '• <strong>Less noise:</strong> Aggregated summaries reduce repetitive inline errors for dense groups',
          '• <strong>Accessible structure:</strong> Legends give people using assistive technology clearer context',
        ],
      },
      {
        title: 'Practical patterns',
        items: [
          '• <strong>Addresses:</strong> Group street, city, ZIP, and country under one summary',
          '• <strong>Radio groups:</strong> Move the shared error close to the legend when the choice is the real decision',
          '• <strong>Credentials:</strong> Cross-field rules such as password confirmation read better at group level',
        ],
      },
    ],
    nextStep: {
      text: 'Want to see the same ideas inside a longer form?',
      link: '/form-field-wrapper/complex-forms',
      linkText: 'Explore Complex Forms →',
    },
  },
} as const;
