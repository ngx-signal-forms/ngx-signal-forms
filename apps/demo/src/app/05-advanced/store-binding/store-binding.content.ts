export const STORE_BINDING_CONTENT = {
  demonstrated: {
    icon: '🔗',
    title: 'Live two-way store binding',
    sections: [
      {
        title: 'Honest write-through, no draft buffer',
        items: [
          '• <strong>Read seam:</strong> the form model reads the store slice through <code>linkedSignal({ source, computation })</code>, so reads stay reactive to the store.',
          '• <strong>Write seam:</strong> the native <code>set</code> option on <code>linkedSignal</code> calls <code>patchState</code> directly — edits land in the store immediately, with no helper file.',
          '• <strong>No commit step:</strong> there is no <code>draft</code> → <code>commit()</code> buffer. The store is the single source of truth.',
          '• <strong>Two-way:</strong> an out-of-band store mutation (Simulate remote sync) is reflected back into the form inputs.',
        ],
      },
      {
        title: 'Contrast with the Advanced Wizard',
        items: [
          '• The <strong>Advanced Wizard</strong> uses a deliberate <code>destinationsDraft</code> → <code>commitDestinations()</code> draft/commit buffer: edits stay local until committed.',
          '• This example is the opposite pattern: edits write through on every change, so there is nothing to discard and nothing to commit.',
          '• Choose draft/commit when you need a cancelable editing session; choose live binding when the store should always mirror what the user sees.',
        ],
      },
    ],
  },
  learning: {
    title: 'When to reach for this pattern',
    sections: [
      {
        title: 'Good fit',
        items: [
          '• Settings panels and preference screens where every edit should persist to a shared store.',
          '• Forms whose state is also read by other parts of the app (sidebars, previews, other tabs).',
          '• Cases where an external source (websocket push, admin override) must flow back into the open form.',
        ],
      },
      {
        title: 'The native custom-set overload',
        items: [
          '• <code>linkedSignal({ source, computation, set })</code> — the native <code>set</code> callback receives every write and a <code>rawSet</code> escape hatch for updating the local value.',
          '• This demo never calls <code>rawSet</code>: writing through <code>patchState</code> alone keeps reads coherent, because <code>source</code> re-reads the store on every access.',
          "• <code>ngxtension</code>'s <code>writableSlice</code> and ngrx's reverted <code>delegatedSignal</code> (ngrx #5157) both converged on this same native overload.",
        ],
      },
    ],
    nextStep: {
      text: 'Compare with the draft/commit buffer →',
      link: '/advanced-scenarios/advanced-wizard',
      linkText: 'Advanced Wizard',
    },
  },
} as const;
