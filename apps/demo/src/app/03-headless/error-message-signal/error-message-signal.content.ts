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
        title: '🧪 Try This (Headless error signals)',
        items: [
          '1. Click the <strong>Password</strong> field → Tab away empty → Modes 1 &amp; 2 show the <code>required</code> message',
          '2. Type <code>abc</code> → blocking error: password must be at least <strong>8 characters</strong>',
          '3. Type <code>abcdefgh</code> (8 letters) → blocking errors clear; <strong>two warnings</strong> appear in Modes 2 &amp; 3: weak password (under 12 chars) and no special characters',
          '4. Extend to <code>abcdefghijkl</code> (12 chars) → the weak-password warning disappears; the no-special-chars warning stays',
          '5. Append a symbol, e.g. <code>abcdefghijkl!</code> → all warnings clear ("No warnings to display")',
          '6. Click <strong>Swap registry</strong> → every visible message re-resolves instantly between verbose and terse wording (e.g. "Min 8 chars")',
          '7. Inspect the input → <code>aria-describedby</code> lists only the blocking error IDs, derived from <code>ResolvedFieldError.id</code>',
        ],
      },
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
