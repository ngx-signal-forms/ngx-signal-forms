/**
 * Content for Your First Form with Toolkit
 */

export const YOUR_FIRST_FORM_CONTENT = {
  demonstrated: {
    icon: '🎯',
    title: "What You'll See (Toolkit Onboarding)",
    sections: [
      {
        title: 'Why toolkit first',
        items: [
          '<strong>Auto-ARIA by default:</strong> No manual <code>aria-invalid</code>/<code>aria-describedby</code> wiring',
          '<strong>One form contract:</strong> <code>[formRoot]</code> + <code>ngxSignalForm</code> for consistent behavior',
          '<strong>Deterministic identity:</strong> Input <code>id</code> drives robust field linking and assistive UX',
        ],
      },
      {
        title: 'Form Fields & Validations',
        items: [
          '<strong>Name:</strong> Required, min 2 characters',
          '<strong>Email:</strong> Required, valid email format',
          '<strong>Message:</strong> Required, min 10 characters',
          'All fields show errors based on selected strategy',
        ],
      },
      {
        title: 'Toolkit features used here',
        items: [
          '<code>[formRoot]</code> + <code>ngxSignalForm</code> form context',
          'Automatic ARIA attributes managed by toolkit directives',
          '<code>NgxFormFieldErrorComponent</code> for reusable error rendering',
          'Runtime strategy comparison (<code>immediate</code>, <code>on-touch</code>, <code>on-submit</code>)',
        ],
      },
      {
        title: 'What stays under your control',
        items: [
          'HTML structure and layout',
          'Label placement and styling',
          'Input field design',
          'Error message positioning',
        ],
      },
    ],
  },
  learning: {
    title: 'Interactive Testing Guide',
    sections: [
      {
        title: '🧪 Try This (On Touch Strategy)',
        items: [
          '1. Click the Name field → Tab away → See error appear',
          '2. Type "A" → Error: "min 2 characters"',
          '3. Type "Ab" → Error disappears',
          '4. Test Email: Enter "test" → Leave field → Invalid email error',
          '5. Submit empty form → All errors show at once',
        ],
      },
      {
        title: '✨ What toolkit automates',
        items: [
          '<strong>0 manual ARIA bindings</strong> for the showcased fields',
          '<strong>No per-field visibility helpers</strong> for standard error timing',
          '<strong>Consistent touch/submit behavior</strong> through form context',
          '<strong>Cleaner templates</strong> compared with hand-wired accessibility logic',
          '<strong>Strategy switching</strong> without rewriting field markup',
        ],
      },
      {
        title: '📊 Baseline-to-toolkit framing',
        items: [
          '<strong>Without toolkit:</strong> Manual ARIA/error plumbing scales linearly with field count',
          '<strong>With this setup:</strong> Form context + error component cover core accessibility behavior',
          '<strong>Next level:</strong> Wrapper-centric pages optimize larger and nested forms',
        ],
      },
    ],
    nextStep: {
      text: 'Continue with strategy and warning behavior',
      link: '/toolkit-core/error-display-modes',
      linkText: 'Toolkit Core →',
    },
  },
} as const;
