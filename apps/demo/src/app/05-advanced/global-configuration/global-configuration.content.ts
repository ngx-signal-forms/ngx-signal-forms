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
          '• <strong>provideNgxSignalFormsConfig():</strong> Configure toolkit defaults in <code class="code-inline">apps/demo/src/main.ts</code> for this demo app',
          '• <strong>defaultErrorStrategy:</strong> Set global error display mode (immediate, on-touch, on-submit)',
          '• <strong>defaultFormFieldAppearance:</strong> Set default form field style (standard, outline, or plain)',
          '• <strong>autoAria:</strong> Enable/disable automatic ARIA attributes globally',
          '• <strong>provideNgxSignalFormControlPresets():</strong> Define app-level control-family defaults such as the inline switch preset used on this page',
          '• <strong>Form-level override:</strong> Use <code class="code-inline">ngxSignalForm</code> with <code class="code-inline">[formRoot]</code>, then bind <code class="code-inline">[errorStrategy]</code> when a single form needs different timing',
          '• <strong>provideErrorMessages():</strong> Override validation messages at the component level — the "Email Address" required error on this form reads from a component-scoped registry, not from the global app config',
          '• <strong>provideFieldLabels():</strong> Map raw field paths to human-readable display names; this form maps <code class="code-inline">userEmail → Email Address</code>, <code class="code-inline">userPhone → Phone Number</code>, etc. — the error summary below uses this resolver so entries read "Email Address: …" instead of the humanized fallback "User Email: …"',
        ],
      },
      {
        title: 'Field Resolution & Preset Priority',
        items: [
          '• <strong>Resolution:</strong> Uses element <code class="code-inline">id</code> attribute',
          '• <strong>WCAG compliance:</strong> Prefer <code class="code-inline">id</code> attributes for accessibility',
          '• <strong>Preset chain:</strong> Explicit field inputs override component presets, which override app-level presets, which override toolkit defaults',
        ],
      },
    ],
  },
  learning: {
    title: 'Configuration Best Practices',
    sections: [
      {
        title: '🧪 Try This (global default is on-touch)',
        items: [
          '1. Click <strong>Email Address</strong> → Tab away empty → See the component-scoped required message: <em>"This field is required — we use it to personalise your experience."</em> (from <code>provideErrorMessages()</code>, not the global default)',
          '2. Type <code>not-an-email</code> → Tab away → Error: <em>"Invalid email format"</em>',
          '3. In <strong>Phone Number</strong>, type <code>1234567890</code> → Error: <em>"Phone must be in format: 123-456-7890"</em>; retype it as <code>123-456-7890</code> → Error clears',
          '4. Leave <strong>Website</strong> empty → No error (optional); type <code>example.com</code> → Error: <em>"Website must be a valid URL"</em>; prefix with <code>https://</code> → Error clears',
          '5. Submit with errors and the terms switch off → The error summary lists <em>"Email Address"</em> and <em>"Terms of service"</em> (friendly names from <code>provideFieldLabels()</code>, not <code>userEmail</code>) — click an entry to focus that field',
          '6. Switch the page control to <strong>Immediate</strong> → Errors now appear while typing, overriding the global <code>on-touch</code> default for this form only',
        ],
      },
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
          '• <strong>Field-level:</strong> Pass <code class="code-inline">[strategy]</code> to the wrapper or error component for individual fields',
          '• <strong>Control semantics:</strong> Use app-level presets for family defaults, then opt into one-off behavior with <code class="code-inline">ngxSignalFormControl</code>, <code class="code-inline">ngxSignalFormControlLayout</code>, or <code class="code-inline">ngxSignalFormControlAria</code>',
          '• <strong>Priority:</strong> Field > Form > Global configuration for timing, and explicit semantics > component presets > app presets > toolkit defaults for control families',
          '• <strong>Message/label cascade:</strong> <code class="code-inline">provideErrorMessages()</code> and <code class="code-inline">provideFieldLabels()</code> follow the same DI cascade — root config sets the app baseline, component <code class="code-inline">providers: []</code> overrides it for a single form, no field-level API is needed',
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
