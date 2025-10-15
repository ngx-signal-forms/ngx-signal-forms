/**
 * Content for Your First Form with Toolkit
 */

export const YOUR_FIRST_FORM_CONTENT = {
  demonstrated: {
    icon: '🎯',
    title: "What You'll See (Basic Toolkit)",
    sections: [
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
        title: 'Toolkit Features (20% Adoption)',
        items: [
          'NgxSignalFormProvider - Form context',
          'Automatic ARIA attributes (aria-invalid, aria-describedby)',
          'NgxSignalFormErrorComponent - Reusable error display',
          'Error display strategies (immediate, on-touch, on-submit)',
        ],
      },
      {
        title: 'What You Control',
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
        title: '✨ What Toolkit Automated',
        items: [
          '<strong>0 manual ARIA bindings</strong> (was 9 per field)',
          '<strong>0 error visibility functions</strong> (was 3)',
          '<strong>Auto touch tracking</strong> on blur',
          '<strong>43% less code</strong> (140 lines → 80 lines)',
          '<strong>Strategy switching</strong> without code changes',
        ],
      },
      {
        title: '📊 Code Reduction Breakdown',
        items: [
          '<strong>Pure Signal Forms:</strong> 9 ARIA bindings, 3 visibility functions, manual touch',
          '<strong>Basic Toolkit:</strong> All automated, just [control] + error component',
          '<strong>Next Level:</strong> Form field wrapper reduces 24% more',
        ],
      },
    ],
    nextStep: {
      text: 'Ready for even less boilerplate?',
      link: '../toolkit/form-field-showcase',
      linkText: 'Form Field Wrapper Component →',
    },
  },
} as const;
