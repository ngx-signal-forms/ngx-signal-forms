import type { ExampleCardConfig } from '../../shared/form-example.types';

export const LABELLESS_FIELDS_CONTENT: ExampleCardConfig = {
  demonstrated: {
    icon: '🏷️',
    title: 'Labelless form fields',
    sections: [
      {
        title: 'When a visible label is redundant',
        items: [
          'Search inputs where a placeholder plus icon already communicate purpose',
          'Grouped fields under a shared heading (phone number parts, date ranges)',
          'Compact numeric inputs labelled by their surrounding card',
        ],
      },
      {
        title: 'Layout collapse',
        items: [
          'Standard vertical layout removes the reserved label row',
          'Outline appearance drops the floating-label padding inside the bordered container',
          'Horizontal layout collapses the label column so the input is flush left',
        ],
      },
      {
        title: 'Narrow inputs',
        items: [
          'Constrain the <code>&lt;input&gt;</code> itself (via <code>max-width</code>), not the wrapper',
          'Error messages render at the wrapper width, so long validation copy still reads cleanly',
        ],
      },
    ],
  },
  learning: {
    title: 'Accessibility reminder',
    sections: [
      {
        title: '🧪 Try This (On Touch mode)',
        items: [
          '1. Inspect the <strong>Search</strong> input (DevTools → Accessibility pane or a screen reader) → its accessible name "Search" comes from <code>aria-label</code>, not the placeholder, even though no &lt;label&gt; is rendered',
          '2. Type <code>555</code> in the middle <strong>phone number</strong> field → Tab away → "Phone number must be at least 7 digits" renders under the labelless wrapper; leave the country code empty and Tab through it → "Country code is required"',
          '3. Click the <strong>Amount</strong> input (initial value 0) → Tab away → "Amount must be greater than 0" appears below the currency input',
          '4. Type <code>17</code> in <strong>Age</strong> → Tab → "Must be 18 or older"; type <code>121</code> → "Invalid age" — the error renders at full wrapper width even though the input is ~5 characters wide',
          '5. Type <code>1234</code> in <strong>Zip</strong> → Tab → "Format: 12345 or 12345-6789" wraps wider than the narrow input',
          '6. Type <code>12345</code> (5 digits) in the <strong>one-time passcode</strong> field → Tab → "Enter all six digits"',
          '7. Switch <strong>orientation</strong> to horizontal in the page controls → the label column collapses for labelless fields; compare section 4\'s "with vs without label" pair across appearances',
        ],
      },
      {
        title: 'Always provide an accessible name',
        items: [
          'Add <code>aria-label</code> to the input when no visible &lt;label&gt; is present',
          'For grouped fields, wrap the group in a <code>role="group"</code> element with <code>aria-labelledby</code>',
          'Placeholders are only a visual cue here — they do not replace the accessible name or the toolkit&apos;s validation/error model',
          'Selection controls (checkbox, switch, radio) still require a visible label — the collapse behavior intentionally excludes them',
        ],
      },
    ],
    nextStep: {
      text: 'Explore advanced submission patterns next →',
      link: '/advanced-scenarios/submission-patterns',
      linkText: 'Submission Patterns',
    },
  },
};
