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
        title: '🧪 Try This (Schema-Driven Errors)',
        items: [
          '1. Click <strong>Save baseline form</strong> with everything empty → every field shows its Zod message at once ("First name is required", "Email is required", "Choose an account type", …)',
          '2. Type <code>test</code> in <strong>Email</strong> → Tab away → error: "Enter a valid email address"',
          '3. Type an 11-character <strong>Password</strong> like <code>abcdefghijk</code> → error: "Password must be at least 12 characters" → add one more character → error clears',
          '4. Type only spaces in <strong>First name</strong> → Tab away → still "First name is required" (the schema trims input before checking)',
          '5. Leave <strong>Account type</strong> or <strong>Country</strong> on "Choose one" and submit → "Choose an account type" / "Choose a country"',
          '6. Fill every field validly and submit → success message; this page has no warnings — all feedback is blocking and comes from one Zod schema',
        ],
      },
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
      link: '/validation/zod-vest-validation',
      linkText: 'Zod + Vest Validation',
    },
  },
} as const;
