export const ASYNC_VALIDATION_CONTENT = {
  demonstrated: {
    icon: '⏳',
    title: 'Async Validation',
    sections: [
      {
        title: 'Server-Side Checks',
        items: [
          '• <strong>validateHttp:</strong> Built-in support for async validation',
          '• <strong>Availability checks:</strong> The demo username endpoint reports whether a value is still available',
          '• <strong>Debouncing:</strong> Requests wait for typing to settle before hitting the server',
          '• <strong>Pending state:</strong> Built-in <code>pending()</code> signal drives loading feedback without extra plumbing',
        ],
      },
      {
        title: 'What to Try',
        items: [
          '• Type <code>admin</code> and blur the field to trigger the “already taken” response',
          '• Enter a different username to see the pending state clear without an error',
          '• Switch the error display mode to compare pending, touch, and submit timing',
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
          '• Keep sync validators first so empty or malformed values never trigger network traffic',
          '• Use <code>form.field().pending()</code> to show spinners or “checking...” copy while the request is in flight',
          '• Map API responses to user-facing validation messages in <code>onSuccess</code> so server payloads stay decoupled from UI text',
        ],
      },
      {
        title: 'When this pattern fits',
        items: [
          '• Username or slug availability checks',
          '• Promo codes or invite codes that must be verified remotely',
          '• Business rules that depend on current server state rather than local form data',
        ],
      },
    ],
    nextStep: {
      text: 'Next: build a multi-step wizard →',
      link: '/advanced-scenarios/advanced-wizard',
      linkText: 'Advanced Wizard',
    },
  },
} as const;
