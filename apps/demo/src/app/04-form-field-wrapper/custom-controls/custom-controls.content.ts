import type { ExampleCardConfig } from '../../shared/form-example.types';

/**
 * Content for the Custom Controls demo page.
 */
export const CUSTOM_CONTROLS_CONTENT: ExampleCardConfig = {
  demonstrated: {
    icon: '🎛️',
    title: 'Custom FormValueControl',
    sections: [
      {
        title: 'Custom FormValueControl',
        items: [
          'RatingControl implements FormValueControl<number>',
          'Uses model() signal for two-way binding with Form Field',
        ],
      },
      {
        title: 'Switch styling',
        items: [
          'SwitchControl keeps a native checkbox input and styles it as a compact switch',
          'Form field wrapper collapses to a short label-plus-toggle row for switch controls',
        ],
      },
      {
        title: 'Wrapper Integration',
        items: [
          'Auto-derives field names for simple projected controls and supports explicit fieldName for nested custom controls',
          'Displays errors, hints, and labels automatically',
        ],
      },
      {
        title: 'Validation',
        items: [
          'Supports required and min value validators',
          'Displays errors via error summary',
        ],
      },
    ],
  },
  learning: {
    title: 'Integration Guide',
    sections: [
      {
        title: 'FormValueControl Interface',
        items: [
          'Implement FormValueControl<T> interface',
          'Define value = model<T>() as required signal',
          'Define touched = model<boolean>() for interaction tracking',
        ],
      },
      {
        title: 'Optional Integration',
        items: [
          'Add disabled, invalid, errors inputs for full state support',
          'Implement focus handling and host attributes so the wrapper can forward labels, hints, and error state cleanly',
        ],
      },
      {
        title: 'Accessibility',
        items: [
          'Use proper ARIA roles (e.g., slider)',
          'Switch rows use a native checkbox with role="switch" so keyboard and screen reader support stay intact',
          'Implement keyboard navigation and a visible focus state for parity with native controls',
        ],
      },
    ],
    nextStep: {
      text: 'Explore async and server-backed validation next →',
      link: '/advanced-scenarios/async-validation',
      linkText: 'Async Validation',
    },
  },
};
