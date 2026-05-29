import type { ExampleCardConfig } from '../../shared/form-example.types';

export const FIELD_MARKING_CONTENT: ExampleCardConfig = {
  demonstrated: {
    icon: '✳️',
    title: 'Required / optional field marking',
    sections: [
      {
        title: 'Three marking modes',
        items: [
          '<code>required</code> — mark required fields (the default)',
          '<code>optional</code> — mark optional fields instead (best when most fields are required)',
          '<code>none</code> — mark nothing; rely on accessible error handling',
        ],
      },
      {
        title: 'Configurable + form-aware legend',
        items: [
          'Place <code>&lt;ngx-form-marking-legend&gt;</code> anywhere in the form',
          'Legend text and marker characters are configurable (and i18n-friendly)',
          'The legend hides itself when no field of the relevant kind exists',
        ],
      },
      {
        title: 'Try it',
        items: [
          'Switch the mode and watch the markers + legend update across every field',
          'Edit the marker text — the legend stays in sync via the <code>{marker}</code> token',
          'Toggle "make phone required" to see the legend appear / disappear live',
        ],
      },
    ],
  },
  learning: {
    title: 'Why this matters for accessibility',
    sections: [
      {
        title: 'The marker is decorative; ARIA is the source of truth',
        items: [
          'Markers render with <code>aria-hidden="true"</code> — purely visual',
          'Required state always reaches screen readers via <code>aria-required</code>, independent of mode',
          'So <code>none</code> mode is still accessible; the choice is purely visual',
        ],
      },
      {
        title: 'Mark the exception, not the norm',
        items: [
          'When most fields are required, marking every one adds visual noise',
          'Marking the optional fields (GOV.UK / NN/g guidance) reads more calmly',
          'A legend gives the lone marker the context a bare asterisk lacks',
        ],
      },
    ],
    nextStep: {
      text: 'Set a project-wide default with',
      link: '/advanced-scenarios/global-configuration',
      linkText: 'Global Configuration',
    },
  },
};
