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
    title: 'Angular 22 Patterns',
    sections: [
      {
        title: '🧪 Try This (Step-by-Step)',
        items: [
          '1. On the empty <strong>Traveler Info</strong> step, click <strong>Next</strong> → navigation is blocked, errors like "First name required" appear, and focus jumps to the first invalid field',
          '2. Enter <code>test</code> as <strong>Email</strong> → "Valid email required"; enter <code>ABC12</code> (5 chars) as <strong>Passport Number</strong> → "Passport number required" (minimum 6 characters)',
          '3. Pick a past date for <strong>Passport Expiry</strong> → "Passport has expired"',
          '4. Fill the traveler step with valid data, then pause ~2 seconds → the debounced auto-save shows "Saving draft..." and then "Last saved: &lt;time&gt;" above the wizard',
          '5. On <strong>Trip Details</strong>, set <strong>Departure Date</strong> earlier than <strong>Arrival Date</strong> → "Departure date must be after arrival date"; an arrival date in the past triggers "Arrival date cannot be in the past"',
          '6. Set an <strong>Activity Date</strong> outside the destination\'s arrival–departure window → "Activity date must be within destination date range"',
          '7. Set a departure date, then return to Traveler Info and choose a <strong>Passport Expiry</strong> less than 6 months after that departure → "Passport must be valid 6 months after trip ends"; finally reach <strong>Review</strong> and click <strong>Confirm Booking</strong> → success card with a confirmation number',
        ],
      },
      {
        title: 'Lifecycle & Signals',
        items: [
          '• Prefer named <code>effect()</code> fields over constructor-based setup',
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
