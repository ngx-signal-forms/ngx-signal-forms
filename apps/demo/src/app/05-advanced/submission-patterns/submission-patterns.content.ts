/**
 * Submission Patterns Content
 *
 * Educational content for the submission patterns example
 */

export const SUBMISSION_PATTERNS_CONTENT = {
  demonstrated: {
    icon: '🚀',
    title: 'Form Submission Patterns',
    sections: [
      {
        title: 'declarative submission Features',
        items: [
          '• <strong>Automatic markAllAsTouched():</strong> Shows all validation errors on submit',
          '• <strong>Async operations:</strong> Handles promises and loading states automatically',
          '• <strong>Server errors:</strong> Return errors from async handler to display on form',
          '• <strong>Type-safe data:</strong> Access validated form data via formData().value()',
          '• <strong>WCAG compliance:</strong> Errors announced via ARIA live regions',
        ],
      },
      {
        title: 'Error Handling Patterns',
        items: [
          '• <strong>Field-level errors:</strong> Errors on individual fields (e.g., "required", "minLength")',
          '• <strong>Root-level errors:</strong> Cross-field validation (e.g., "passwords must match")',
          '• <strong>Client validation:</strong> Field and root errors shown progressively (on-touch strategy)',
          '• <strong>Server validation:</strong> API errors returned from submit handler and displayed',
          '• <strong>Form-level errors:</strong> General errors shown at form level with role="alert"',
          '• <strong>Accessibility:</strong> Screen readers announce errors immediately',
        ],
      },
    ],
  },
  learning: {
    title: 'Best Practices & Patterns',
    sections: [
      {
        title: 'Submission Flow',
        items: [
          '• <strong>Use declarative submission:</strong> Angular automatically manages submission state',
          '• <strong>Automatic state tracking:</strong> Toolkit derives status from submitting() + touched()',
          '• <strong>Three states:</strong> unsubmitted → submitting (async) → submitted',
          '• <strong>Reset behavior:</strong> State returns to unsubmitted after reset clears touched/submitting',
          '• <strong>Show all errors:</strong> declarative submission marks all fields as touched automatically',
          '• <strong>UI feedback:</strong> Use derived submittedStatus() for loading indicators and success messages',
          '• <strong>Return errors:</strong> Server errors returned from handler display automatically',
        ],
      },
      {
        title: 'WCAG 2.2 Compliance',
        items: [
          '• <strong>Error identification:</strong> Errors clearly associated with fields via aria-describedby',
          '• <strong>Error suggestions:</strong> Validation messages provide clear guidance',
          '• <strong>Focus management:</strong> Submit button remains accessible even when disabled',
          '• <strong>Live regions:</strong> Errors announced to screen readers via role="alert"',
        ],
      },
    ],
    nextStep: {
      text: 'Review all examples from the beginning',
      link: '/signal-forms-only/pure-signal-form',
      linkText: 'Back to Pure Signal Forms →',
    },
  },
} as const;
