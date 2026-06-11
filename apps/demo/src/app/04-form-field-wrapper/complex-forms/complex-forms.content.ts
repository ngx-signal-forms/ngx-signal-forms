/**
 * Complex Forms Content
 *
 * Educational content for the complex forms example
 */

export const COMPLEX_FORMS_CONTENT = {
  demonstrated: {
    icon: '🎯',
    title: 'Complex Forms Made Simple',
    sections: [
      {
        title: 'NgxFormField Features',
        items: [
          '• <strong>Nested objects:</strong> Deep path validation',
          '• <strong>Dynamic arrays:</strong> Add/remove items with reactive updates',
          '• <strong>Automatic layout:</strong> Label + input + error container',
          '• <strong>Type safety:</strong> Full TypeScript inference',
          '• <strong>Maximum reduction:</strong> 67% less boilerplate',
        ],
      },
      {
        title: 'Real-World Patterns',
        items: [
          '• <strong>Multi-section forms:</strong> Personal info + Address + Skills',
          '• <strong>Array operations:</strong> CRUD for skills and contacts',
          '• <strong>Mixed field types:</strong> Text, number, select, switch, checkbox, and radio-group controls in one form',
          '• <strong>Conditional validation:</strong> Based on user input',
          '• <strong>Responsive grid:</strong> Mobile-first layout',
        ],
      },
      {
        title: 'Control Semantics in Long Forms',
        items: [
          '• <strong>Explicit metadata:</strong> Switch and checkbox rows opt into the correct wrapper behavior instead of relying on DOM heuristics',
          '• <strong>Grouped feedback:</strong> Fieldsets still aggregate warnings and errors while nested controls keep their own semantics',
          '• <strong>Consistent accessibility:</strong> Auto-ARIA keeps labels, hints, and errors linked across nested sections',
        ],
      },
    ],
  },
  learning: {
    title: 'Advanced Patterns & Best Practices',
    sections: [
      {
        title: '🧪 Try This (Nested groups & arrays)',
        items: [
          '1. <strong>First Name:</strong> type <code>A</code> → Tab away → "At least 2 characters"',
          '2. <strong>Age:</strong> enter <code>17</code> → Tab away → "Must be 18 or older"; enter <code>121</code> → "Invalid age" (max 120)',
          '3. <strong>Zip Code:</strong> type <code>1234</code> → Tab away → "Format: 12345 or 12345-6789"; <code>12345-6789</code> passes',
          '4. <strong>Skills:</strong> click "Add Skill", set Level to <code>11</code> → "Level must be 1-10"; remove the row with the ✕ suffix button',
          '5. <strong>Credentials:</strong> enter password <code>secret12</code> and confirm <code>secret13</code> → the fieldset shows the shared "Passwords must match" message (group-level <code>validateTree</code>)',
          '6. <strong>Preferences:</strong> pick the <strong>SMS</strong> radio → <strong>warning</strong> "SMS messages may incur carrier charges"',
          '7. Flip the "Grouped feedback placement" toggle (Top/Bottom) → section-level messages move above or below each group',
        ],
      },
      {
        title: 'Form Architecture & Grouping',
        items: [
          '• <strong>Nested models:</strong> Organize complex data logically',
          '• <strong>Array management:</strong> Signal updates for add/remove',
          '• <strong>Sectioned layouts:</strong> Use fieldsets to keep long forms readable without overloading one screen',
        ],
      },
      {
        title: 'Code Reduction Benefits',
        items: [
          '• <strong>Without wrapper:</strong> ~320 lines (manual labels/errors/layout)',
          '• <strong>With wrapper:</strong> ~280 lines (33% less boilerplate)',
          '• <strong>Zero manual ARIA:</strong> Automatic accessibility',
          '• <strong>Consistent UX:</strong> Unified error display and stable control-family layouts',
        ],
      },
    ],
    nextStep: {
      text: 'Next: custom FormValueControl integration',
      link: '/form-field-wrapper/custom-controls',
      linkText: 'Explore Custom Controls →',
    },
  },
} as const;
