/**
 * Content for Error Display Modes Example
 */

export const ERROR_DISPLAY_MODES_CONTENT = {
  demonstrated: {
    icon: '⚡',
    title: 'Error Display Strategies Showcase',
    sections: [
      {
        title: 'Form Fields & Validations',
        items: [
          '<strong>Name:</strong> Required, 2-50 characters',
          '<strong>Email:</strong> Required, valid email format',
          '<strong>Company:</strong> Optional, max 100 characters',
          '<strong>Product Used:</strong> Required selection',
          '<strong>Rating:</strong> Required, 1-5 stars',
          '<strong>Improvement Suggestions:</strong> Required if rating ≤ 3, min 10 chars, max 500',
          '<strong>Detailed Feedback:</strong> Optional, max 1000 characters',
        ],
      },
      {
        title: 'Display Strategies Demonstrated',
        items: [
          '<strong>immediate:</strong> Show errors as user types (real-time)',
          '<strong>on-touch:</strong> Show after field blur (recommended)',
          '<strong>on-submit:</strong> Show only after submit attempt',
          'Interactive switcher to compare strategies',
        ],
      },
      {
        title: 'Advanced Features',
        items: [
          'Conditional validation (improvement suggestions for low ratings)',
          'Character counting with live feedback',
          'Cross-field validation',
          'Dynamic field visibility',
        ],
      },
    ],
  },
  learning: {
    title: 'Interactive Strategy Testing',
    sections: [
      {
        title: '🧪 Try Different Strategies',
        items: [
          '<strong>Immediate:</strong> Type in Name field → Errors appear instantly',
          '<strong>On Touch:</strong> Click field → Tab away → Errors appear',
          '<strong>On Submit:</strong> Click Submit → All errors show at once',
        ],
      },
      {
        title: '🎯 Conditional Validation Test',
        items: [
          '1. Set rating to 3 or below → Improvement field becomes required',
          '2. Type less than 10 characters → Error: "at least 10 characters"',
          '3. Type 500+ characters → Character count turns red',
          '4. Set rating to 4 or 5 → Improvement field becomes optional',
        ],
      },
      {
        title: '📊 UX Strategy Guidelines',
        items: [
          '<strong>Immediate:</strong> Use for complex rules (password strength)',
          '<strong>On Touch:</strong> Balanced UX, recommended for most forms',
          '<strong>On Submit:</strong> Minimizes interruption, good for simple forms',
          '<strong>Accessibility:</strong> All strategies are WCAG 2.2 compliant',
        ],
      },
    ],
    nextStep: {
      text: 'Continue with non-blocking validation patterns →',
      link: '/toolkit-core/warning-support',
      linkText: 'Warning Support',
    },
  },
} as const;
