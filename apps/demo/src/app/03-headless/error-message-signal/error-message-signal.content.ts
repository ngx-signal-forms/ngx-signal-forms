export const ERROR_MESSAGE_SIGNAL_CONTENT = {
  demonstrated: {
    icon: '🧪',
    title: 'createErrorMessageSignal',
    sections: [
      {
        title: 'Primitive options',
        items: [
          '<strong>default (false):</strong> Blocking errors only — flat @for, no outer @if',
          '<strong>includeWarnings: true:</strong> Blocking errors first, then warnings in order',
          "<strong>includeWarnings: 'only':</strong> Warnings only, rendered in an &lt;aside&gt; slot",
        ],
      },
      {
        title: 'ARIA & registry',
        items: [
          '<strong>aria-describedby:</strong> Wired from ResolvedFieldError.id — no manual ID math',
          '<strong>errorMessages signal:</strong> Reactive registry swap re-resolves messages mid-render',
        ],
      },
    ],
  },
  learning: {
    title: 'When to use createErrorMessageSignal',
    sections: [
      {
        title: 'Custom error renderers',
        items: [
          'Own the entire error DOM without a directive wrapper',
          'Feed resolved messages into a design-system component',
        ],
      },
      {
        title: 'Flat iteration pattern',
        items: [
          '@for over the signal — empty array means no output, no outer @if needed',
          'IDs are stable across re-renders — safe for aria-describedby chains',
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
