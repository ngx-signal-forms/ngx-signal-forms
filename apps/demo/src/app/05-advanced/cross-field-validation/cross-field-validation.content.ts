export const CROSS_FIELD_VALIDATION_CONTENT = {
  demonstrated: {
    icon: '🔗',
    title: 'Cross-Field Validation',
    sections: [
      {
        title: 'Dependent Logic',
        items: [
          '• <strong>Context Access:</strong> Using <code>ctx.valueOf(path)</code> to access sibling field values',
          '• <strong>Date Ranges:</strong> Ensuring end date is after start date',
          '• <strong>Conditional Rules:</strong> Applying rules based on other field values (e.g. promo code limit based on guests)',
        ],
      },
      {
        title: 'What to compare on this page',
        items: [
          '• Switch error timing to see how group rules feel when they appear immediately versus on touch',
          '• Toggle wrapper appearance to confirm the validation story stays clear in both visual treatments',
          '• Notice how field-level and dependent errors complement each other instead of duplicating the same message',
        ],
      },
    ],
  },
  learning: {
    title: 'Validation Strategies',
    sections: [
      {
        title: '🧪 Try This (On Touch Strategy)',
        items: [
          '1. Pick a <strong>Check-In</strong> date → Set <strong>Check-Out</strong> to the same or an earlier date → Tab away → Error: <em>"Check-out must be after check-in"</em>',
          '2. Move Check-Out to any date after Check-In → Error disappears',
          '3. Type <code>SMALLGROUP</code> in <strong>Promo Code</strong> with Guests at 4 or fewer → No error; the code is accepted',
          '4. Change <strong>Guests</strong> to <code>5</code> → Promo Code errors with <em>"Promo valid only for small groups (max 4)"</em> — without touching the promo field; watch the debugger panel update',
          '5. Set Guests to <code>0</code> → <em>"At least 1 guest required"</em>; set it to <code>11</code> → <em>"Max 10 guests allowed"</em>',
          '6. Clear both dates and click <strong>Book Stay</strong> → Required errors appear and focus jumps to the first invalid field',
        ],
      },
      {
        title: 'Implementation',
        items: [
          '• Validations run automatically when dependencies update',
          '• Keep error messages specific to the failure condition',
          '• Use <code>validate(path, ...)</code> for flexible custom logic',
        ],
      },
      {
        title: 'Good use cases',
        items: [
          '• Travel or booking flows with start/end dates',
          '• Confirm fields such as password or email confirmation',
          '• Pricing, capacity, or eligibility rules that depend on multiple inputs',
        ],
      },
    ],
    nextStep: {
      text: 'Back to consolidated nested/array example →',
      link: '/form-field-wrapper/complex-forms',
      linkText: 'Complex Forms',
    },
  },
} as const;
