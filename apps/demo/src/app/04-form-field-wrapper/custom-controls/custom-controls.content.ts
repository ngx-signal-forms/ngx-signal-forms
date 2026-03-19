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
        title: 'Wrapper Integration',
        items: [
          'Auto-derives fieldName from component ID',
          'Displays errors and labels automatically',
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
