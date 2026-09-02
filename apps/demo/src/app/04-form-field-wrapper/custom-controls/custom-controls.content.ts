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
          'RatingControl owns its aria-invalid, aria-required, aria-valuenow, and aria-describedby via host bindings, so every rating field declares ngxSignalFormControl="slider" and inherits the component-scoped manual-ARIA slider preset instead of toolkit auto-ARIA',
          'Manual ARIA mode is demonstrated on every rating control — each owns aria-describedby itself, with the parent form computing the hint/error id chain and passing it in via [describedBy]',
        ],
      },
      {
        title: 'Adapting a third-party widget',
        items: [
          'LegacyDatepickerAdapterComponent implements <code>FormValueControl&lt;Date | null&gt;</code> around a self-contained fake "legacy" datepicker with its own value/change API — no toolkit or Signal Forms knowledge in the widget itself',
          "<code>transformedValue()</code> owns the parse/format boundary between the widget's raw text and the field's <code>Date | null</code>, and reports a <code>kind: 'parse'</code> error automatically when the text is not a real YYYY-MM-DD date",
          "Touched is reported on <code>(focusout)</code> with a relatedTarget containment check — not a plain <code>(blur)</code> — because focus moves across the widget's input, trigger button, and popup day buttons before the user is actually done",
          'The widget owns its own internal <code>&lt;input&gt;</code>, so the wrapper stays <code>appearance="plain"</code> and the adapter forwards <code>aria-describedby</code>/<code>aria-invalid</code>/<code>aria-required</code> down onto that input via the widget\'s own passthrough inputs',
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
        title: '🧪 Try This (Custom controls)',
        items: [
          '1. Click <strong>Submit Review</strong> on the empty form → errors appear on every required field: Product Name, both ratings, the switch, the checkbox, and Accessibility Audit',
          '2. <strong>Product Rating:</strong> click a star (or focus and press an arrow key) → setting 1+ stars clears "Rating must be at least 1 star"',
          '3. <strong>Would Recommend?</strong> uses the same RatingControl with 2 stars and is <strong>optional</strong> — leaving it at ☆ never errors',
          '4. <strong>Email updates:</strong> toggle the switch ON → "Enable email updates to complete this demo" clears',
          '5. <strong>Share this review publicly:</strong> tick the checkbox → its required error clears',
          '6. <strong>Accessibility Audit:</strong> its error renders <strong>above</strong> the stars (errorPlacement="top") — like every rating control on this page, it wires <code>aria-describedby</code> itself (manual ARIA); rate 1+ stars to clear it',
          '7. Fill <strong>Product Name</strong> and the remaining ratings → the footer flips to "✓ All fields valid"',
          '8. <strong>Date of Birth:</strong> type <code>not-a-date</code> and tab out → a <code>parse</code> error appears; replace it with <code>2026-02-30</code> → a different parse error ("not a real calendar date"); type a real date like <code>1990-05-17</code> → the error clears',
          '9. Click the 📅 button next to Date of Birth, pick a day → the text field updates and the popup closes; click <strong>Reset</strong> → the text field clears back to empty, proving the value change flows back through the adapter in both directions',
        ],
      },
      {
        title: 'FormValueControl Interface',
        items: [
          'Implement <code>FormValueControl&lt;T&gt;</code> interface',
          'Define <code>value = model&lt;T&gt;()</code> as required signal',
          'Emit <code>touch = output()</code> on blur or other user interaction (Angular 22 replaces the old <code>touched</code> model with a <code>touch</code> output)',
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
      {
        title: 'NgxFieldIdentity integration',
        items: [
          "The rating control here is the reference implementation of the toolkit README's custom-control recipe",
          'It injects <code class="code-inline">NgxFieldIdentity</code> optionally so it works both standalone and inside a wrapper',
          'When the wrapper is present, <code class="code-inline">identity.describedBy()</code> drives the hint portion of <code class="code-inline">aria-describedby</code> — explicit inputs take precedence, so manual ARIA mode is unaffected',
          'Read the wrapper-resolved signals (field name, error/warning ids, hint chain) instead of re-deriving them to stay in lockstep with every other toolkit surface',
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
