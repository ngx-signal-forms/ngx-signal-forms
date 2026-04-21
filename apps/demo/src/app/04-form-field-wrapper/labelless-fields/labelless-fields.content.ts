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
        title: 'Always provide an accessible name',
        items: [
          'Add <code>aria-label</code> to the input when no visible &lt;label&gt; is present',
          'For grouped fields, wrap the group in a <code>role="group"</code> element with <code>aria-labelledby</code>',
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
