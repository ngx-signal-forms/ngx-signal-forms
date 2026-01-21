export const DYNAMIC_LIST_CONTENT = {
  demonstrated: {
    icon: '📝',
    title: 'Dynamic Lists & Form Arrays',
    sections: [
      {
        title: 'Key Concepts',
        items: [
          '• <strong>Form Arrays:</strong> Handling lists of items with signals',
          '• <strong>Unique IDs:</strong> Tracking items with unique IDs for performance',
          '• <strong>Dynamic Validation:</strong> Validating each item in the list',
          '• <strong>Immutable Updates:</strong> Adding/Removing items using signal updates',
        ],
      },
    ],
  },
  learning: {
    title: 'Best Practices',
    sections: [
      {
        title: 'Managing Dynamic Data',
        items: [
          '• Use <code>crypto.randomUUID()</code> or a counter for unique IDs',
          '• Use <code>@for (item of form.tasks(); track item.id)</code> in templates',
          '• Update lists immutably: <code>list.update(items => [...items, newItem])</code>',
        ],
      },
    ],
    nextStep: {
      text: 'Next: handle deeply nested structures →',
      link: '../nested-groups',
      linkText: 'Nested Form Groups',
    },
  },
} as const;
