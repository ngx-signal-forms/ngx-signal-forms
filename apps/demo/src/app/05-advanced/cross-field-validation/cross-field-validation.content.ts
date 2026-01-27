export const CROSS_FIELD_VALIDATION_CONTENT = {
  demonstrated: {
    icon: '🔗',
    title: 'Cross-Field Validation',
    sections: [
      {
        title: 'Dependent Logic',
        items: [
          '• <strong>Context Access:</strong> Using <code>ctx.valueOf(path)</code> to access sibling field values',
          '• <strong>Date Ranges:</strong> Ensuring end date is after start date',
          '• <strong>Conditional Rules:</strong> Applying rules based on other field values (e.g. promo code limit based on guests)',
        ],
      },
    ],
  },
  learning: {
    title: 'Validation Strategies',
    sections: [
      {
        title: 'Implementation',
        items: [
          '• Validations run automatically when dependencies update',
          '• Keep error messages specific to the failure condition',
          '• Use <code>validate(path, ...)</code> for flexible custom logic',
        ],
      },
    ],
    nextStep: {
      text: 'Back to dynamic arrays →',
      link: '../dynamic-list',
      linkText: 'Dynamic Lists',
    },
  },
} as const;
