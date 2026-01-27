/**
 * Content configuration for the Fieldset example.
 */

export const FIELDSET_CONTENT = {
  demonstrated: {
    icon: '📋',
    title: 'Fieldset Component Features',
    sections: [
      {
        title: 'Grouped Form Sections',
        items: [
          '<strong>Shipping Address:</strong> Street, City, ZIP, Country',
          '<strong>Billing Address:</strong> Conditionally shown when different from shipping',
          '<strong>Credentials:</strong> Password with confirmation (cross-field validation)',
        ],
      },
      {
        title: 'Error Aggregation',
        items: [
          'Collects errors from all child fields in a fieldset',
          'Displays deduplicated error messages at group level',
          'Reduces visual clutter compared to per-field errors',
          'Shows errors based on error display strategy (on-touch, immediate, on-dirty, on-submit)',
        ],
      },
      {
        title: 'Accessibility (WCAG 2.2)',
        items: [
          'Uses semantic <code>&lt;fieldset&gt;</code> and <code>&lt;legend&gt;</code> elements',
          'Error messages linked via <code>aria-describedby</code>',
          'Invalid state conveyed with <code>aria-invalid</code>',
          'Screen reader announces aggregated error count',
        ],
      },
    ],
  },

  learning: {
    title: 'Interactive Fieldset Testing',
    sections: [
      {
        title: '🧪 Test Aggregated Errors',
        items: [
          '1. Click inside any Shipping field, then Tab away',
          '2. Observe: Single error list below the fieldset',
          '3. Fill some fields, leave others empty',
          '4. Observe: Only remaining errors are shown',
          '5. Complete all Shipping fields → Errors disappear',
        ],
      },
      {
        title: '🔀 Cross-Field Validation',
        items: [
          '1. Enter a short password (< 8 chars) → Error',
          '2. Enter different passwords in both fields',
          '3. Tab away → "Passwords do not match" error',
          '4. Make passwords match → Error clears',
        ],
      },
      {
        title: '📦 Conditional Fieldsets',
        items: [
          '1. Uncheck "Billing same as shipping"',
          '2. Billing Address fieldset appears',
          '3. Validate billing fields independently',
          '4. Check the box again → Billing fieldset hides',
        ],
      },
      {
        title: '🎨 When to Use Fieldsets',
        items: [
          '<strong>Use fieldset:</strong> Related fields (addresses, credentials)',
          '<strong>Use fieldset:</strong> Groups with shared validation context',
          '<strong>Avoid fieldset:</strong> Single fields or unrelated controls',
          '<strong>Tip:</strong> Combine with per-field errors for detailed feedback',
        ],
      },
    ],
    nextStep: {
      text: 'See outline variant styling for form fields →',
      link: '../form-field-wrapper/outline-form-field',
      linkText: 'Outline Form Field',
    },
  },
} as const;
