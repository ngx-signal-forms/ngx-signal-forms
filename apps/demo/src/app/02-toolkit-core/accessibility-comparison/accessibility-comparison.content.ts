/**
 * Content for Accessibility Comparison Example
 */

export const ACCESSIBILITY_COMPARISON_CONTENT = {
  demonstrated: {
    icon: '♿',
    title: 'WCAG 2.2 Accessibility Showcase',
    sections: [
      {
        title: 'Three Implementation Levels',
        items: [
          '<strong>Manual:</strong> No toolkit, all ARIA attributes manually added (~95 lines)',
          '<strong>Minimal Toolkit:</strong> Auto-ARIA only, no [ngxSignalForm] (~55 lines)',
          '<strong>Full Toolkit:</strong> Complete with [ngxSignalForm] and error components (~31 lines)',
          'Side-by-side comparison shows progressive enhancement',
        ],
      },
      {
        title: 'What [ngxSignalForm] Adds',
        items: [
          "✅ <code>'on-submit'</code> error strategy support",
          '✅ Form-level <code>[errorStrategy]</code> override',
          '✅ Access to <code>submittedStatus</code> signal in child components',
          "❌ Without it: <code>'on-touch'</code> strategy still works perfectly!",
        ],
      },
      {
        title: 'When to Use Each Level',
        items: [
          '<strong>Manual:</strong> Learning how accessibility works under the hood',
          '<strong>Minimal:</strong> Custom error UI but want automatic ARIA',
          '<strong>Full:</strong> Most projects - complete accessibility + error display',
        ],
      },
    ],
  },
  learning: {
    title: 'Choosing Your Approach',
    sections: [
      {
        title: '🔧 Minimal Toolkit (No [ngxSignalForm])',
        items: [
          'Import <code>NgxSignalFormToolkit</code> + <code>NgxSignalFormFieldComponent</code>',
          'Use <code>(submit)="handler($event)"</code> on form',
          'Automatic: <code>novalidate</code>, <code>aria-invalid</code>, <code>aria-describedby</code>',
          'Automatic: Error display via <code>&lt;ngx-signal-form-field&gt;</code>',
          "Use when: Most forms with default <code>'on-touch'</code> strategy",
        ],
      },
      {
        title: '✅ Full Toolkit (With [ngxSignalForm])',
        items: [
          'Add <code>[ngxSignalForm]="form"</code> binding',
          'Unlocks: <code>&lt;ngx-signal-form-error&gt;</code> component',
          'Unlocks: Form-level <code>[errorStrategy]</code> override',
          'Unlocks: <code>submittedStatus</code> via DI in children',
          'Use when: Most projects (recommended)',
        ],
      },
      {
        title: '🧪 Testing Your Implementation',
        items: [
          '1. Use browser DevTools → Accessibility tab',
          '2. Inspect aria-invalid, aria-describedby attributes',
          '3. Test keyboard navigation (Tab, Enter)',
          '4. Use screen reader (NVDA, JAWS, VoiceOver)',
        ],
      },
    ],
    nextStep: {
      text: 'Learn about error display strategies →',
      link: '../toolkit/error-display-modes',
      linkText: 'Error Display Modes',
    },
  },
} as const;
