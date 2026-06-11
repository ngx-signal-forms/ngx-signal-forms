export const HEADLESS_FIELDSET_UTILITIES_CONTENT = {
  demonstrated: {
    icon: '🧪',
    title: 'Headless Fieldset + Field Names',
    sections: [
      {
        title: 'Directives',
        items: [
          '<strong>ngxHeadlessErrorSummary:</strong> Form-level summary with custom markup',
          '<strong>ngxHeadlessFieldset:</strong> Aggregate group state and errors',
          '<strong>ngxHeadlessFieldName:</strong> Resolve IDs and names for ARIA',
          '<strong>ngxHeadlessErrorState:</strong> Custom error and warning UI',
        ],
      },
      {
        title: 'Utilities',
        items: [
          '<strong>createErrorState:</strong> Programmatic error visibility signals',
          '<strong>createCharacterCount:</strong> Character count without directives',
          '<strong>createFieldStateFlags:</strong> Reusable valid/invalid/touched/dirty/pending signals',
          '<strong>NgxHeadlessCharacterCount (directive):</strong> Attach to any element to get <code class="code-inline">currentLength</code>, <code class="code-inline">remaining</code>, <code class="code-inline">limitState</code>, and <code class="code-inline">percentUsed</code> signals — use your own markup and CSS for the ok / warning / danger / exceeded states',
          '<strong>NgxFormFieldCharacterCount (assistive component):</strong> Drop-in one-liner; auto-detects the maxLength validator and applies the same progressive color states. Themeable via CSS custom properties.',
        ],
      },
    ],
  },
  escapeHatch: {
    icon: '🔀',
    title: 'Wrapper vs Headless: When to Switch',
    sections: [
      {
        title: 'Use the wrapper when',
        items: [
          'Standard text inputs, selects, textareas, or checkboxes',
          'Built-in control kinds like switch, slider, or radio-group',
          'You want consistent layout, error display, and ARIA out of the box',
        ],
      },
      {
        title: 'Switch to headless when',
        items: [
          'Bespoke composite controls (date-range pickers, multi-select tags, rich editors)',
          'Third-party widgets that manage their own ARIA and focus',
          'Layouts the wrapper grid cannot express (e.g., inline token lists)',
          'You need full DOM ownership but still want toolkit error state and field-name resolution',
        ],
      },
    ],
  },
  learning: {
    title: 'When to choose headless tools',
    sections: [
      {
        title: '🧪 Try This (Headless fieldset + utilities)',
        items: [
          '1. <strong>Contact email:</strong> type <code>test</code> → Tab away → "Enter a valid email address" rendered by your own <code>ngxHeadlessErrorState</code> markup',
          '2. <strong>Street:</strong> type <code>ab</code> → Tab away → "Street must be at least 3 characters"; the fieldset flags flip (<code>touched: true</code>, <code>invalid: true</code>) and the error aggregates into the Shipping address alert',
          '3. <strong>Postal code:</strong> type <code>ABCDE</code> → Tab away → no blocking error (5 chars passes), but the ZIP-format <strong>warning</strong> appears; change it to <code>12345</code> → warning clears',
          '4. <strong>Delivery notes:</strong> type fewer than 20 characters → Tab away → warning "Consider adding more detail (20+ characters)"',
          '5. Keep typing notes: at <strong>160/200</strong> the character count enters the warning state (≥80%), at <strong>190</strong> danger (≥95%), and past <strong>200</strong> the blocking error "Notes must be 200 characters or less" appears',
          '6. <strong>Submit</strong> with empty required fields → the custom error summary appears; click an entry to focus that field',
          '7. Switch the validation timing control (e.g. to immediate) → every headless directive and utility inherits the new strategy via form context',
        ],
      },
      {
        title: 'Custom UI kits',
        items: [
          'Keep your own markup while reusing toolkit logic',
          'Centralize error visibility and ARIA wiring',
        ],
      },
      {
        title: 'Group behaviors',
        items: [
          'Aggregate errors for related fields',
          'Surface group state without extra components',
        ],
      },
    ],
    nextStep: {
      text: 'Next: prebuilt wrappers →',
      link: '/form-field-wrapper/complex-forms',
      linkText: 'Complex Forms',
    },
  },
} as const;
