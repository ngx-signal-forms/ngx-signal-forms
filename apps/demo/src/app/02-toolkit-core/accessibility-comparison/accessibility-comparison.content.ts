/**
 * Content for Accessibility Comparison Example
 */

export const ACCESSIBILITY_COMPARISON_CONTENT = {
  demonstrated: {
    icon: '♿',
    title: 'WCAG 2.2 Accessibility Showcase',
    sections: [
      {
        title: 'Form Fields & Validations',
        items: [
          '<strong>Email:</strong> Required, valid email format',
          '<strong>Password:</strong> Required, min 8 characters',
          '<strong>Confirm Password:</strong> Required, must match password',
          'Side-by-side: Manual vs Automated implementation',
        ],
      },
      {
        title: 'Automated Accessibility Features',
        items: [
          'Automatic ARIA attributes (aria-invalid, aria-describedby)',
          'Automatic touch state tracking and error visibility',
          'WCAG 2.2 Level AA compliance guaranteed',
          '67% code reduction with toolkit',
          'Live inspection tools for testing',
        ],
      },
      {
        title: 'Testing Tools',
        items: [
          'Browser DevTools Accessibility Inspector',
          'ARIA attribute inspection',
          'Screen reader testing guidance',
          'Keyboard navigation verification',
        ],
      },
    ],
  },
  learning: {
    title: 'Accessibility Testing Guide',
    sections: [
      {
        title: '🧪 Manual Testing Steps',
        items: [
          '1. Use browser DevTools → Accessibility tab',
          '2. Inspect aria-invalid, aria-describedby attributes',
          '3. Test keyboard navigation (Tab, Enter)',
          '4. Compare manual vs toolkit implementations',
          '5. Use screen reader (NVDA, JAWS, VoiceOver)',
        ],
      },
      {
        title: '📊 Code Comparison',
        items: [
          '<strong>Manual:</strong> 9 ARIA bindings, 3 error functions, ~140 lines',
          '<strong>Toolkit:</strong> 0 ARIA bindings, 0 error functions, ~45 lines',
          '<strong>Reduction:</strong> 67% less code with better accessibility',
          '<strong>Maintenance:</strong> Single source of truth for ARIA logic',
        ],
      },
      {
        title: '✅ WCAG 2.2 Compliance',
        items: [
          '<strong>Error Identification:</strong> aria-invalid for all invalid fields',
          '<strong>Error Suggestion:</strong> Clear, descriptive error messages',
          '<strong>Error Prevention:</strong> Progressive disclosure (on-touch)',
          '<strong>Keyboard Access:</strong> All functionality keyboard-accessible',
        ],
      },
    ],
    nextStep: {
      text: 'Learn about error display strategies →',
      link: '../toolkit/error-display-modes',
      linkText: 'Error Display Modes',
    },
  },
} as const;
