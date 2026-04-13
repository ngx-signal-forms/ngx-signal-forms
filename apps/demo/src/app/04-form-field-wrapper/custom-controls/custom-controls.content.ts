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
          'RatingControl implements <code>FormValueControl&lt;number&gt;</code>',
          'Uses model() signal for two-way binding with Form Field',
        ],
      },
      {
        title: 'Switch styling',
        items: [
          'SwitchControl keeps a native checkbox input and styles it as a compact switch',
          'The bound input opts into switch behavior with ngxSignalFormControl="switch" so the wrapper can use a stable layout hook instead of DOM heuristics',
          'Form field wrapper collapses to a short label-plus-toggle row for switch controls',
        ],
      },
      {
        title: 'Additional semantics use cases',
        items: [
          'A standard checkbox can opt into toolkit checkbox behavior with ngxSignalFormControl="checkbox"',
          'A slider-style custom control can declare ngxSignalFormControl="slider" and inherit component-scoped slider presets',
          'Manual ARIA mode is demonstrated with a custom control that owns aria-describedby itself',
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
          'Implement <code>FormValueControl&lt;T&gt;</code> interface',
          'Define <code>value = model&lt;T&gt;()</code> as required signal',
          'Define <code>touched = model&lt;boolean&gt;()</code> for interaction tracking',
        ],
      },
      {
        title: 'Optional Integration',
        items: [
          'Add disabled, invalid, errors inputs for full state support',
          'Implement focus handling and host attributes so the wrapper can forward labels, hints, and error state cleanly',
          'Use ngxSignalFormControlAria="manual" only when the control already owns aria-describedby, aria-invalid, and aria-required itself',
          'Use provideNgxSignalFormControlPresetsForComponent(...) when a whole control family should inherit the same semantics defaults inside one demo or feature area',
        ],
      },
      {
        title: 'Accessibility',
        items: [
          'Use proper ARIA roles (e.g., slider)',
          'Switch rows use a native checkbox with role="switch" so keyboard and screen reader support stay intact',
          'Toolkit auto-ARIA should enhance native-like controls; third-party widgets that already manage semantics should stay in manual mode',
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
