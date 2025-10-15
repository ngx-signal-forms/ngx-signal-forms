/**
 * Content for Pure Signal Forms Example
 */

export const PURE_SIGNAL_FORM_CONTENT = {
  demonstrated: {
    icon: '⚠️',
    title: "What You'll See (Manual Approach)",
    sections: [
      {
        title: 'Form Fields & Validations',
        items: [
          '<strong>Email:</strong> Required, valid email format',
          '<strong>Password:</strong> Required, min 8 characters',
          '<strong>Confirm Password:</strong> Required, must match password',
          '<strong>🔗 Cross-field validation:</strong> Passwords must match (root-level error)',
        ],
      },
      {
        title: 'Manual Implementation Required',
        items: [
          'Manual ARIA attributes (aria-invalid, aria-describedby)',
          'Manual error visibility logic (touched + invalid)',
          'Manual error container IDs and linking',
          'Manual touch state tracking on blur',
          '~140 lines of template code for 3 fields',
        ],
      },
      {
        title: 'Angular Signal Forms Core',
        items: [
          'form() - Create reactive form tree',
          'signal() - Single source of truth for data',
          'Control directive - Bind form fields',
          'Built-in validators (required, email, minLength)',
          '<strong>validate() - Root-level validation for cross-field rules</strong>',
        ],
      },
    ],
  },
  learning: {
    title: 'Interactive Testing Guide',
    sections: [
      {
        title: '🧪 Try This',
        items: [
          '1. Click Email field → Tab away → Manual error logic triggers',
          '2. Type "test" → Leave field → See aria-invalid="true"',
          '3. Enter valid email → Error disappears (manual cleanup)',
          '4. Password: Enter "abc" → Error: "min 8 characters"',
          '5. <strong>Confirm Password: Enter different value → Root-level error: "Passwords do not match"</strong>',
          '6. Check debugger → See root-level errors (🔗) vs field-level errors',
        ],
      },
      {
        title: '📊 Code Complexity Breakdown',
        items: [
          '<strong>Manual ARIA bindings:</strong> 9 (3 per field)',
          '<strong>Error visibility functions:</strong> 3 computed signals',
          '<strong>Touch tracking:</strong> Manual (blur) listener per field',
          '<strong>Error containers:</strong> 3 with unique IDs',
          '<strong>Total template lines:</strong> ~140 for 3 fields',
        ],
      },
      {
        title: '💡 The Toolkit Solution',
        items: [
          '<strong>67% code reduction</strong> with automated ARIA',
          '<strong>0 manual bindings</strong> needed',
          '<strong>0 error visibility functions</strong> required',
          '<strong>Automatic touch tracking</strong> on blur',
          '<strong>WCAG 2.2 compliant</strong> by default',
        ],
      },
    ],
    nextStep: {
      text: 'See how the toolkit automates all of this →',
      link: '../getting-started/your-first-form',
      linkText: 'Your First Form with Toolkit',
    },
  },
} as const;
