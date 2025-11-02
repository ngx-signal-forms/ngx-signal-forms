/**
 * Error Messages Content
 *
 * Educational content for the error message configuration example
 */

export const ERROR_MESSAGES_CONTENT = {
  demonstrated: {
    icon: '💬',
    title: '3-Tier Error Message Priority',
    sections: [
      {
        title: 'How It Works',
        items: [
          '• <strong>Tier 1: Validator message</strong> - Highest priority, uses <code class="code-inline">error.message</code> property',
          '• <strong>Tier 2: Registry override</strong> - Fallback from <code class="code-inline">provideErrorMessages()</code>',
          '• <strong>Tier 3: Default toolkit</strong> - Final fallback for built-in validators',
        ],
      },
      {
        title: 'Each Field Demonstrates',
        items: [
          '• <strong>Email:</strong> Uses validator message (Tier 1)',
          '• <strong>Password:</strong> Falls back to registry (Tier 2)',
          '• <strong>Bio:</strong> Uses toolkit default (Tier 3)',
        ],
      },
    ],
  },
  learning: {
    title: 'When to Use Registry',
    sections: [
      {
        title: 'Use Registry For',
        items: [
          '• <strong>i18n:</strong> Multi-language apps needing centralized messages',
          '• <strong>Consistency:</strong> Large apps (50+ forms) with repeated messages',
          '• <strong>Brand voice:</strong> Specific messaging tone requirements',
        ],
      },
      {
        title: 'Skip Registry When',
        items: [
          '• <strong>Using Zod/Valibot/ArkType:</strong> Schema messages are excellent',
          '• <strong>Simple apps:</strong> Toolkit defaults work great',
          '• <strong>Single-language:</strong> Validator messages are sufficient',
        ],
      },
    ],
    nextStep: {
      text: 'Learn about global toolkit configuration',
      link: '/advanced/global-configuration',
      linkText: 'Explore Global Configuration →',
    },
  },
} as const;
