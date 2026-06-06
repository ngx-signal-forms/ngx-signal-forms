export const FIELD_STATE_PATTERNS_CONTENT = {
  demonstrated: {
    icon: '🧭',
    title: 'Field State Patterns',
    sections: [
      {
        title: 'What this demo shows',
        items: [
          '• <strong>hidden(..., { when })</strong> for fields that are irrelevant until a workflow branch becomes active.',
          '• <strong>disabled(..., { when })</strong> for visible fields that should explain future capability without accepting input yet.',
          '• <strong>readonly(..., { when })</strong> for values managed by another system but still worth surfacing to the user.',
          '• <strong>Consistent when syntax:</strong> validation rules and dynamic field state now use the same <code>{ when }</code> shape.',
        ],
      },
      {
        title: 'Suggested experiments',
        items: [
          '• Switch notifications from <strong>Email</strong> to <strong>SMS</strong> to enable the phone field.',
          '• Turn on <strong>Invite-only onboarding</strong> to reveal the invite code field.',
          '• Turn on <strong>Managed by identity provider</strong> to lock the work email while keeping it visible.',
        ],
      },
    ],
  },
  learning: {
    title: 'Choosing the right state',
    sections: [
      {
        title: 'Prefer hidden when',
        items: [
          '• The field is not relevant yet and showing it would add noise.',
          '• You want summaries and focus management to skip that field entirely until the branch is active.',
        ],
      },
      {
        title: 'Prefer disabled or readonly when',
        items: [
          '• <strong>disabled:</strong> the field should stay visible but inactive until another choice unlocks it.',
          '• <strong>readonly:</strong> users should still read or copy the value, but another system owns edits.',
          '• Toolkit wrappers keep these states visible without needing custom ARIA plumbing.',
        ],
      },
    ],
    nextStep: {
      text: 'Next: layer structural and policy validation →',
      link: '/advanced-scenarios/zod-vest-validation',
      linkText: 'Zod + Vest Validation',
    },
  },
} as const;
