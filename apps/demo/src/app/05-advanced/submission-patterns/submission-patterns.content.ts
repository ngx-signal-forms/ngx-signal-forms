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
          "• <strong>Warnings vs errors:</strong> a <code>warn:</code> rule on Password is advisory only — <code>ignoreValidators: 'all'</code> + <code>hasOnlyWarnings()</code> let submission proceed while the warning stays visible",
          '• <strong>Error summary:</strong> Aggregated clickable error list at top of form (GOV.UK pattern)',
          '• <strong>Click-to-focus:</strong> Each summary entry focuses the invalid control via focusBoundControl()',
          '• <strong>Accessibility:</strong> Screen readers announce errors immediately via role="alert"',
        ],
      },
    ],
  },
  learning: {
    title: 'Best Practices & Patterns',
    sections: [
      {
        title: '🧪 Try This (watch the Submission State panel)',
        items: [
          '1. Type <code>ab</code> in <strong>Username</strong> → Tab away → Error: <em>"Username must be at least 3 characters"</em>; type <code>ab!</code> → <em>"Username can only contain letters, numbers, and underscores"</em>',
          '2. Type a 7-character password like <code>short12</code> → Error: <em>"Password must be at least 8 characters"</em>',
          '3. Enter <strong>Password</strong> <code>password123</code> and <strong>Confirm Password</strong> <code>password124</code> → Root-level error: <em>"Passwords do not match"</em>, and <code>canSubmitWithWarnings()</code> shows <strong>No</strong>',
          '4. Fix the mismatch → <code>canSubmitWithWarnings()</code> flips to <strong>Yes</strong>; click <strong>Create Account</strong> → Badge cycles Ready to Submit → Submitting... (1.5s) → success message appears and the form resets',
          '5. Type a password with <strong>no digits</strong>, e.g. <code>longpassword</code> (8+ characters) → a non-blocking warning appears: <em>"Consider adding a number for a stronger password."</em> <code>canSubmitWithWarnings()</code> still shows <strong>Yes</strong> — this page actually honors that via <code>ignoreValidators: \'all\'</code> + <code>hasOnlyWarnings()</code>, so <strong>Create Account</strong> submits successfully with the warning still visible',
          '6. Check <strong>Simulate server error</strong> and submit valid data → After the delay, a server error lands on the Username field: <em>"Username … is already taken"</em>',
          '7. Click <strong>Reset</strong> and submit the empty form → All errors appear at once in the clickable error summary; click an entry to focus its field',
        ],
      },
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
          '• <strong>Error summary:</strong> Form-level summary links errors to their fields',
          '• <strong>Focus management:</strong> Click any error summary entry to focus the associated field; submit button remains accessible when disabled',
          '• <strong>Live regions:</strong> Errors announced to screen readers via role="alert"',
        ],
      },
    ],
    nextStep: {
      text: 'Review onboarding and core setup patterns',
      link: '/getting-started/your-first-form',
      linkText: 'Back to Getting Started →',
    },
  },
} as const;
