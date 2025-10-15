/**
 * Content for Field States Example
 */

export const FIELD_STATES_CONTENT = {
  demonstrated: {
    icon: '🎯',
    title: 'Field State Management',
    sections: [
      {
        title: 'Form Fields & Validations',
        items: [
          '<strong>Email:</strong> Required, valid email format',
          '<strong>Username:</strong> Required, min 3 characters',
          '<strong>Password:</strong> Required, min 8 characters',
          '<strong>Password Warnings:</strong> Non-blocking suggestions (special chars, uppercase, numbers)',
        ],
      },
      {
        title: 'State Types Tracked',
        items: [
          '<strong>dirty():</strong> Value changed from initial state',
          '<strong>touched():</strong> User interacted with field (blur)',
          '<strong>invalid():</strong> Has blocking validation errors',
          '<strong>valid():</strong> No errors AND no pending validators',
          '<strong>pending():</strong> Async validation in progress',
        ],
      },
      {
        title: 'Programmatic Controls',
        items: [
          'Mark all fields as touched',
          'Mark all fields as dirty',
          'Prefill form with data',
          'Reset to initial state',
        ],
      },
    ],
  },
  learning: {
    title: 'Interactive State Testing',
    sections: [
      {
        title: '🧪 Try These State Changes',
        items: [
          '1. Type in Email → Watch dirty() change to true',
          '2. Tab away from field → Watch touched() change to true',
          '3. Enter invalid email → Watch invalid() change to true',
          '4. Click "Prefill Form" → All fields become dirty',
          '5. Type password without uppercase → See non-blocking warning',
        ],
      },
      {
        title: '📊 State Usage Patterns',
        items: [
          '<strong>dirty():</strong> "Unsaved changes" warning banner',
          '<strong>touched():</strong> Progressive error disclosure (on-touch strategy)',
          '<strong>invalid():</strong> Error message display logic',
          '<strong>!valid():</strong> Disable submit button (waits for async)',
          '<strong>pending():</strong> Show loading spinner during validation',
        ],
      },
      {
        title: '⚠️ Critical Distinctions',
        items: [
          '<strong>invalid() vs !valid():</strong> invalid ignores pending, !valid waits',
          '<strong>dirty() vs touched():</strong> value changed vs user interacted',
          "<strong>Blocking vs Warning:</strong> Errors prevent submit, warnings don't",
        ],
      },
    ],
    nextStep: {
      text: 'Learn about non-blocking warnings →',
      link: '../toolkit/warning-support',
      linkText: 'Warning Support',
    },
  },
} as const;
