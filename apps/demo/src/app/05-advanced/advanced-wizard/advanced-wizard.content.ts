export const ADVANCED_WIZARD_CONTENT = {
  demonstrated: {
    icon: '🧙',
    title: 'Advanced Wizard with State Management',
    sections: [
      {
        title: 'Architecture Patterns',
        items: [
          '• <strong>Form-per-Step:</strong> Each wizard step has a separate .form.ts file',
          '• <strong>NgRx Signal Store:</strong> Centralized state with feature composition',
          '• <strong>Zod Validation:</strong> Type-safe schemas with cross-field validation',
        ],
      },
      {
        title: 'State Management',
        items: [
          '• <strong>signalStoreFeature:</strong> Navigation, traveler, and trip features',
          '• <strong>rxMethod:</strong> Reactive auto-save with debouncing',
          '• <strong>Immutable Updates:</strong> patchState for safe state mutations',
        ],
      },
      {
        title: 'Validation Techniques',
        items: [
          '• <strong>Dynamic Validators:</strong> Passport expiry based on departure date',
          '• <strong>Cross-field:</strong> Date range validation (arrival < departure)',
          '• <strong>Nested Validation:</strong> Activities within destination date range',
        ],
      },
    ],
  },
  learning: {
    title: 'Angular 21.1 Patterns',
    sections: [
      {
        title: 'Lifecycle & Signals',
        items: [
          '• Use <code>effect()</code> in constructor for reactive initialization',
          '• Use <code>DestroyRef.onDestroy()</code> for cleanup (not ngOnDestroy)',
          '• Use <code>computed()</code> for derived state from signals',
        ],
      },
      {
        title: 'Form Organization',
        items: [
          '• Separate form logic into <code>.form.ts</code> factory functions',
          '• Return form + model + computed helpers from factory',
          '• Components consume form objects, store manages persistence',
        ],
      },
    ],
    nextStep: {
      text: 'Continue with dependent validation patterns in',
      link: '/advanced-scenarios/cross-field-validation',
      linkText: 'Cross-Field Validation',
    },
  },
} as const;
