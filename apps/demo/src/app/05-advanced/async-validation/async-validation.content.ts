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
          '• <strong>Typing debounce demo:</strong> <code>validateHttp(..., { debounce: 350 })</code> waits for typing to settle before hitting the server',
          "• <strong>Blur debounce demo:</strong> <code>debounce(field, 'blur')</code> defers model updates and async validation until focus leaves the field",
          '• <strong>Pending state:</strong> Built-in <code>pending()</code> signal drives loading feedback without extra plumbing',
        ],
      },
      {
        title: 'What to Try',
        items: [
          '• Type at least three characters in both fields, then try <code>admin</code> to trigger the “already taken” response',
          '• In the blur field, keep typing without blurring to confirm no remote check starts yet',
          '• Enter a different username to see the pending state clear without an error',
          '• Use <strong>Recheck both</strong> to trigger <code>reloadValidation()</code> without editing either field again',
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
          '• Use <code>form.field().getError(...)</code> when you need one specific async error without iterating over the full array',
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
      text: 'Next: compare hidden, disabled, and readonly field strategies →',
      link: '/advanced-scenarios/field-state-patterns',
      linkText: 'Field State Patterns',
    },
  },
} as const;
