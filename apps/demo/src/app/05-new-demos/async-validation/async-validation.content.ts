export const ASYNC_VALIDATION_CONTENT = {
  demonstrated: {
    icon: '⏳',
    title: 'Async Validation',
    sections: [
      {
        title: 'Server-Side Checks',
        items: [
          '• <strong>validateHttp:</strong> Built-in support for async validation',
          '• <strong>Debouncing:</strong> Automatically handles debouncing of requests',
          '• <strong>Pending State:</strong> Built-in <code>pending()</code> signal for UI feedback',
        ],
      },
    ],
  },
  learning: {
    title: 'Performance & UX',
    sections: [
      {
        title: 'Implementation',
        items: [
          '• Return <code>null</code> (valid) or error object from server',
          '• Use <code>form.field().pending()</code> to show spinners',
          '• Async validators run only after synchronous validators pass',
        ],
      },
    ],
    nextStep: {
      text: 'Next: build a multi-step wizard →',
      link: '../stepper-form',
      linkText: 'Stepper Form',
    },
  },
} as const;
