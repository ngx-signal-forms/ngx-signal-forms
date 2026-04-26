import type { ExampleCardConfig } from '../../shared/form-example.types';

export const FIELDSET_APPEARANCE_CONTENT: ExampleCardConfig = {
  demonstrated: {
    icon: '🧱',
    title: 'Grouped fieldset feedback',
    sections: [
      {
        title: 'Grouped summary styles',
        items: [
          'Compare <code>feedbackAppearance="auto"</code>, <code>"plain"</code>, and <code>"notification"</code> on the same grouped validation patterns',
          'Toggle <code>listStyle</code> between bulleted summaries and stacked plain text without changing the validation source',
          'Optional notification titles help the surfaced card read like a section-level review prompt',
        ],
      },
      {
        title: 'Surface tones + validation surfaces',
        items: [
          'Preview neutral, info, success, warning, and danger base tones before validation ever fires',
          'Turn on <code>validationSurface="always"</code> to tint invalid and warning states across the grouped surface',
          'See how the host border, inner surface, and grouped summary stay visually distinct',
        ],
      },
      {
        title: 'Aggregation modes',
        items: [
          'Switch between group-only feedback and <code>includeNestedErrors</code> for full descendant summaries',
          'Compare address groups, radio groups, and password confirmation blocks with one control panel',
          'Use the same page-level switches to study how grouped semantics behave in realistic wrapper-based forms',
        ],
      },
    ],
  },
  learning: {
    title: 'When to reach for each primitive',
    sections: [
      {
        title: 'Choose the right grouping layer',
        items: [
          '<code>NgxFormFieldset</code> is the right fit for cross-field rules, nested sections, and shared grouped summaries',
          'Use <code>ngx-form-field-wrapper</code> for radio or checkbox groups that should behave like a single inline field with wrapper-owned feedback',
          'Drop down to <code>NgxHeadlessFieldset</code> when you need the aggregation state but want to own every DOM node',
        ],
      },
      {
        title: 'Theme and layout hooks',
        items: [
          'Fieldset tones and grouped notification styles are driven by stable CSS variables, not one-off demo classes',
          'Placement, list style, and tone all remain keyboard-accessible because the controls only swap presentation, not semantics',
          'The page keeps the same validation data model while the surface changes, making the API trade-offs easy to compare',
        ],
      },
    ],
    nextStep: {
      text: 'See the long-form composition version next →',
      link: '/form-field-wrapper/complex-forms',
      linkText: 'Complex Forms',
    },
  },
};
