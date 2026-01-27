export const HEADLESS_ERROR_STATE_CONTENT = {
  demonstrated: {
    icon: '🧩',
    title: 'Headless Error State + Character Count',
    sections: [
      {
        title: 'What This Shows',
        items: [
          '• <strong>Headless Error State:</strong> Render custom errors with <code>ngxSignalFormHeadlessErrorState</code>',
          '• <strong>ARIA Wiring:</strong> Use generated IDs for <code>aria-describedby</code>',
          '• <strong>Character Count:</strong> Progressive limits with <code>ngxSignalFormHeadlessCharacterCount</code>',
        ],
      },
    ],
  },
  learning: {
    title: 'When to Use Headless',
    sections: [
      {
        title: 'Design System Fit',
        items: [
          '• Full control over markup and styling without toolkit UI components',
          '• Keep Signal Forms as the source of truth with custom display logic',
          '• Compose directives for reusable form primitives in your UI kit',
        ],
      },
    ],
    nextStep: {
      text: 'Next: use the prebuilt wrappers →',
      link: '../form-field-wrapper/basic-usage',
      linkText: 'Form Field Wrapper',
    },
  },
} as const;
