export const VEST_VALIDATION_CONTENT = {
  demonstrated: {
    icon: '🦺',
    title: 'Vest-Only Business Validation',
    sections: [
      {
        title: 'What this demo shows',
        items: [
          '• <strong>Single validation engine:</strong> Every blocking rule comes from one Vest suite.',
          '• <strong>Conditional policies:</strong> Company, VAT, and referral requirements branch on multiple fields.',
          '• <strong>Toolkit compatibility:</strong> <code>validateVest(path, suite, { includeWarnings: true })</code> uses the toolkit&apos;s first-class Angular adapter without extra boilerplate.',
          '• <strong>Shared suite execution:</strong> Blocking errors and <code>warn()</code> guidance are mapped from the same Vest run.',
          '• <strong>Warning rendering:</strong> <code>ngx-form-field-wrapper</code> shows blocking alerts and polite warning messages through the same assistive component.',
        ],
      },
      {
        title: 'Suggested experiments',
        items: [
          '• Switch to <strong>Business</strong> and select <strong>DE</strong>, <strong>NL</strong>, or <strong>BE</strong> to trigger the VAT rule.',
          '• Keep <strong>Personal</strong> and raise the team size above 10 to see policy validation on the seat limit.',
          '• Enter <code>STARTER100</code> for larger teams to watch the referral code become invalid.',
        ],
      },
    ],
  },
  learning: {
    title: 'When Vest is a good fit',
    sections: [
      {
        title: 'Prefer Vest when',
        items: [
          '• Rules read like <strong>business policy</strong> instead of field metadata.',
          '• One field needs multiple named rules with different failure reasons.',
          '• Conditions depend on combinations such as <code>accountType + country + teamSize</code>.',
          '• <code>warn()</code> should be used for advisory guidance that should remain visible without blocking submit.',
        ],
      },
      {
        title: 'What to notice',
        items: [
          '• The wrapper renders both normal Angular validation errors and Vest warnings.',
          '• Error timing is controlled by the toolkit, not by Vest itself.',
          '• Enabling warnings does not require a second Vest suite pass.',
          '• Angular <code>submit()</code> still treats warnings as validation errors, so the demo gates the action with <code>hasOnlyWarnings(...)</code>.',
          '• You can move the same Vest suite into another app or flow without rewriting the policy logic.',
        ],
      },
    ],
    nextStep: {
      text: 'Layer structure rules with Zod next →',
      link: '/advanced-scenarios/zod-vest-validation',
      linkText: 'Zod + Vest Validation',
    },
  },
} as const;
