/**
 * Global Configuration Content
 *
 * Educational content for the global configuration example
 */

export const GLOBAL_CONFIG_CONTENT = {
  demonstrated: {
    icon: '⚙️',
    title: 'Global Toolkit Configuration',
    sections: [
      {
        title: 'Configuration Options',
        items: [
          '• <strong>provideNgxSignalFormsConfig():</strong> Configure toolkit defaults in app.config.ts',
          '• <strong>provideNgxSignalFormsConfigForComponent():</strong> Override defaults for a component subtree',
          '• <strong>defaultErrorStrategy:</strong> Set global error display mode (immediate, on-touch, on-submit, manual)',
          '• <strong>defaultFormFieldAppearance:</strong> Set default form field style (default or outline)',
          '• <strong>autoAria:</strong> Enable/disable automatic ARIA attributes globally',
          '• <strong>showRequiredMarker:</strong> Toggle required marker for outlined fields',
          '• <strong>requiredMarker:</strong> Customize required marker text',
          '• <strong>fieldNameResolver:</strong> Custom logic for resolving field names from DOM',
          '• <strong>debug:</strong> Enable console logging for troubleshooting',
        ],
      },
      {
        title: 'Custom Field Resolution',
        items: [
          '• <strong>Default resolution:</strong> Uses <code class="code-inline">data-signal-field</code> → custom resolver → <code class="code-inline">id</code> → <code class="code-inline">name</code>',
          '• <strong>Custom resolver:</strong> Override with your own field name extraction logic',
          '• <strong>WCAG compliance:</strong> Prefer <code class="code-inline">id</code> attributes for accessibility',
          '• <strong>Nested paths:</strong> Use <code class="code-inline">data-signal-field</code> for complex paths like "user.address.city"',
        ],
      },
    ],
  },
  learning: {
    title: 'Configuration Best Practices',
    sections: [
      {
        title: 'When to Use Global Config',
        items: [
          '• <strong>Consistency:</strong> Ensure all forms follow the same error display strategy',
          '• <strong>Brand alignment:</strong> Match error UX to your design system',
          '• <strong>A11y requirements:</strong> Configure for WCAG 2.2 compliance globally',
          '• <strong>Custom resolvers:</strong> When using non-standard field naming conventions',
        ],
      },
      {
        title: 'Override Patterns',
        items: [
          '• <strong>Form-level:</strong> Use <code class="code-inline">[errorStrategy]</code> on ngxSignalForm to override per form',
          '• <strong>Field-level:</strong> Pass <code class="code-inline">[strategy]</code> to NgxSignalFormErrorComponent for individual fields',
          '• <strong>Priority:</strong> Field > Form > Global configuration',
        ],
      },
    ],
    nextStep: {
      text: 'Learn about submission patterns and server errors',
      link: '/advanced-scenarios/submission-patterns',
      linkText: 'Explore Submission Patterns →',
    },
  },
} as const;
