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
          '<strong>Username:</strong> Required, min 3 chars (⚠️ warns if &lt; 6)',
          '<strong>Email:</strong> Required, valid format (⚠️ warns for disposable domains)',
          '<strong>Password:</strong> Required, min 8 chars (⚠️ warns if &lt; 12 or simple)',
          'Warnings provide guidance without blocking submission',
        ],
      },
      {
        title: 'Warning Support Features',
        items: [
          '<code>warningError()</code> utility for non-blocking feedback',
          'Visual distinction: Errors (red) vs Warnings (amber)',
          'ARIA roles: <code>alert</code> (errors) vs <code>status</code> (warnings)',
          'Form submission allowed with warnings present',
          'Real-time password strength and username recommendations',
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
          '1. Leave fields empty → Submit → See blocking errors prevent submission',
          '2. Enter username "abc" (3 chars) → Warning appears: "Consider 6+ characters"',
          '3. Enter password "Short123" (8 chars) → Warning: "Consider 12+ characters"',
          '4. Enter password "alllowercase" → Warning: "Mix uppercase, numbers, special chars"',
          "5. Submit with warnings present → Submission succeeds! Warnings don't block.",
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
          'Use <code>warningError("weak-password", "Consider 12+ chars...")</code>',
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
