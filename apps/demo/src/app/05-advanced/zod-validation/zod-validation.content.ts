export const ZOD_VALIDATION_CONTENT = {
  demonstrated: {
    icon: '🧩',
    title: 'Zod-Only Baseline Validation',
    sections: [
      {
        title: 'What this demo shows',
        items: [
          '• <strong>Single validation layer:</strong> all blocking feedback comes from one Zod schema.',
          '• <strong>Standard Schema adapter:</strong> Angular Signal Forms consumes Zod through <code>validateStandardSchema(path, schema)</code>.',
          '• <strong>Type-safe model contract:</strong> the form model is derived directly from <code>z.input&lt;typeof schema&gt;</code>.',
          '• <strong>No policy overlay:</strong> this page intentionally excludes Vest so you can inspect pure structural validation behavior.',
        ],
      },
      {
        title: 'Suggested experiments',
        items: [
          '• Leave all fields empty and submit to inspect Zod required messages.',
          '• Enter an invalid email to confirm format checks are schema-driven.',
          '• Enter a short password to verify minimum-length enforcement.',
          '• Compare this baseline with the layered route to see what business-policy validators add.',
        ],
      },
    ],
  },
  learning: {
    title: 'When this baseline helps',
    sections: [
      {
        title: 'Use this pattern when',
        items: [
          '• You want a compact contract validator with clear required/format/length rules.',
          '• Validation is mostly structural and shared with API contracts or generated schemas.',
          '• You need a minimal example before layering additional validation engines.',
        ],
      },
      {
        title: 'What to notice',
        items: [
          '• Wrapper rendering and error timing are unchanged when the validator source is Zod.',
          '• The same form shell can later add Vest policy rules without changing field markup.',
          '• Keeping this route small makes it a stable learning and regression baseline.',
        ],
      },
    ],
    nextStep: {
      text: 'Layer business policy on top of Zod next →',
      link: '/advanced-scenarios/zod-vest-validation',
      linkText: 'Zod + Vest Validation',
    },
  },
} as const;
