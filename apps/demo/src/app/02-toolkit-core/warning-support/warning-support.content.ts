/**
 * Content for Warning Support Example
 */

export const WARNING_SUPPORT_CONTENT = {
  demonstrated: {
    icon: '⚠️',
    title: 'Blocking Errors vs Non-Blocking Warnings',
    sections: [
      {
        title: 'Form Fields & Validations',
        items: [
          '<strong>Username:</strong> Required, min 3 characters',
          '<strong>Email:</strong> Required, valid email format',
          '<strong>Password:</strong> Required, min 8 characters',
          'Warnings demonstrate non-blocking validation suggestions',
        ],
      },
      {
        title: 'Warning Support Features',
        items: [
          '<code>warningError()</code> utility for non-blocking feedback',
          'Visual distinction: Errors (red) vs Warnings (amber)',
          'ARIA roles: <code>alert</code> (errors) vs <code>status</code> (warnings)',
          'Form submission allowed with warnings present',
          'Password strength recommendations',
        ],
      },
      {
        title: 'WCAG 2.2 Messaging',
        items: [
          '<strong>Errors:</strong> <code>role="alert"</code> with <code>aria-live="assertive"</code>',
          '<strong>Warnings:</strong> <code>role="status"</code> with <code>aria-live="polite"</code>',
          'Immediate announcement for errors (blocking)',
          'Polite announcement for warnings (non-intrusive)',
        ],
      },
    ],
  },
  learning: {
    title: 'Interactive Warning Testing',
    sections: [
      {
        title: '🧪 Try This',
        items: [
          '1. Leave Username empty → Click Submit → Blocking error prevents submission',
          '2. Enter username "ab" (2 chars) → Error: "min 3 characters"',
          '3. Enter "abc" → Error disappears, form can submit',
          '4. With toolkit: Type password without special chars → See amber warning',
          '5. With toolkit: Submit form with warnings → Submission succeeds',
        ],
      },
      {
        title: '📊 When to Use Each',
        items: [
          '<strong>Blocking Errors:</strong> Required fields, invalid format, business rules',
          '<strong>Warnings:</strong> Password strength, recommendations, best practices',
          '<strong>Convention:</strong> Errors with <code>kind="warn:*"</code> are warnings',
          '<strong>UX Impact:</strong> Warnings guide without frustrating users',
        ],
      },
      {
        title: '🎯 Implementation Pattern',
        items: [
          'Use <code>warningError("short-password", "message")</code>',
          'Toolkit automatically separates errors from warnings',
          'Visual styling distinguishes severity levels',
          'Screen readers announce appropriately',
        ],
      },
    ],
    nextStep: {
      text: 'See form field wrapper in action →',
      link: '../form-field-wrapper/basic-usage',
      linkText: 'Form Field Wrapper',
    },
  },
} as const;
