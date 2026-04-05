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
          '• <strong>defaultErrorStrategy:</strong> Set global error display mode (immediate, on-touch, on-submit)',
          '• <strong>defaultFormFieldAppearance:</strong> Set default form field style (standard or outline)',
          '• <strong>autoAria:</strong> Enable/disable automatic ARIA attributes globally',
          '• <strong>Form-level override:</strong> Use <code class="code-inline">ngxSignalForm</code> with <code class="code-inline">[formRoot]</code>, then bind <code class="code-inline">[errorStrategy]</code> when a single form needs different timing',
        ],
      },
      {
        title: 'Field Resolution',
        items: [
          '• <strong>Resolution:</strong> Uses element <code class="code-inline">id</code> attribute',
          '• <strong>WCAG compliance:</strong> Prefer <code class="code-inline">id</code> attributes for accessibility',
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
          '• <strong>Stable ids:</strong> Keep control <code class="code-inline">id</code> values deterministic so wrappers and auto-ARIA can link feedback reliably',
        ],
      },
      {
        title: 'Override Patterns',
        items: [
          '• <strong>Form-level:</strong> Use <code class="code-inline">ngxSignalForm</code> with <code class="code-inline">[formRoot]</code>, then bind <code class="code-inline">[errorStrategy]</code> to override per form',
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
