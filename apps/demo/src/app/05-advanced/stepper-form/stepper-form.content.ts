export const STEPPER_FORM_CONTENT = {
  demonstrated: {
    icon: '👣',
    title: 'Multi-Step Forms (Wizards)',
    sections: [
      {
        title: 'Form Progression',
        items: [
          '• <strong>Partial Validation:</strong> Checking validity of specific fields before advancing',
          '• <strong>State Management:</strong> Controlling step visibility based on current step index',
          '• <strong>Final Submission:</strong> Submitting the entire form at the end',
        ],
      },
    ],
  },
  learning: {
    title: 'UX Considerations',
    sections: [
      {
        title: 'Step Logic',
        items: [
          '• Trigger validation on Next click and focus the first invalid field',
          '• Persist data across steps automatically (data model is separate from view)',
          '• Allow navigation back to edit previous steps',
        ],
      },
    ],
    nextStep: {
      text: 'See how to validate fields depending on other fields in',
      link: '../cross-field-validation',
      linkText: 'Cross-Field Validation',
    },
  },
} as const;
