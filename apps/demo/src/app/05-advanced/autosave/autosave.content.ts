/**
 * Autosave Content
 *
 * Educational content for the autosave example
 */

export const AUTOSAVE_CONTENT = {
  demonstrated: {
    icon: '💾',
    title: 'Autosave',
    sections: [
      {
        title: 'Debounced field-level save',
        items: [
          "• <strong>Native debounce:</strong> <code>debounce(path, 500)</code> — the Angular 22 schema rule — delays writing a UI edit into that field's value signal until 500ms after the user stops typing it",
          "• <strong>Per field, not per form:</strong> <code>displayName</code> and <code>bio</code> debounce independently; editing one does not reset or extend the other's timer",
          '• <strong>Save only what should be saved:</strong> a computed patch includes a field only when it is both <code>dirty()</code> and <code>valid()</code> — never an untouched or invalid value',
          '• <strong>No submit button:</strong> saving is the interaction, not a separate step',
        ],
      },
      {
        title: 'The save itself',
        items: [
          '• <strong><code>httpResource</code>:</strong> the request function returns <code>undefined</code> whenever nothing dirty+valid is waiting, which pauses the resource — no polling flag to keep in sync',
          "• <strong>Real MSW handler:</strong> the PATCH hits <code>/api/autosave/profile</code> in <code>apps/demo/src/mocks/handlers.ts</code>, not an in-memory fake — <code>httpResource</code>'s loading/error states are the real thing",
          "• <strong>Status surfaced:</strong> idle / saving / saved / failed, mapped from the resource's own <code>status()</code> signal",
          '• <strong>Retry:</strong> a failed save leaves its field(s) dirty; <code>resource.reload()</code> re-issues the same patch',
          '• <strong>Re-baseline on success:</strong> <code>reset(value)</code> clears <code>dirty()</code> without touching what the user typed — the same call <a href="/advanced-scenarios/server-integration">Server Integration</a> makes after a successful submit',
        ],
      },
      {
        title: 'Accessible save status',
        items: [
          '• <strong>Two fixed-role live regions:</strong> a <code>role="status"</code> container for "Saving…"/"All changes saved" (polite) and a separate <code>role="alert"</code> container for failure (assertive) — never one region whose role is swapped at runtime',
          '• <strong>Role never toggles:</strong> only the content inside each region is conditionally rendered; the container and its role are always present, which is what keeps screen readers from missing the first announcement',
          '• <strong>Naturally coalesced:</strong> the status only changes on a genuine transition (idle→saving→saved), so there is nothing to separately debounce for the announcement itself',
        ],
      },
    ],
  },
  learning: {
    title: 'Best Practices & Patterns',
    sections: [
      {
        title: '🧪 Try This',
        items: [
          '1. Edit <strong>Display name</strong> and stop typing — after ~500ms the status region reads <em>Saving…</em>, then <em>All changes saved.</em> after the fake ~400ms PATCH resolves.',
          '2. Watch the state panel: <code>dirty()</code> flips back to <code>false</code> the instant the save resolves, via <code>reset(value)</code>.',
          '3. Type <code>FAIL_SAVE</code> anywhere in <strong>Bio</strong> and stop typing → the assertive region announces a failure and shows a <strong>Retry save</strong> button; the field stays dirty until a save actually succeeds.',
          '4. Remove <code>FAIL_SAVE</code> from Bio and stop typing again → the corrected value autosaves normally.',
          '5. Clear <strong>Display name</strong> entirely → it becomes invalid (required), so the debounce still settles the value but the patch omits it — nothing is PATCHed for an invalid field.',
          '6. Click <strong>Reset demo</strong> → the form returns to its initial value and <code>dirty()</code> clears, in one <code>reset(value)</code> call.',
        ],
      },
      {
        title: 'Debounce Pattern',
        items: [
          "• <strong>Schema rule over RxJS:</strong> <code>debounce(path, 500)</code> replaces a hand-rolled <code>debounceTime</code> pipeline — the value signal itself is what's delayed, so every downstream read (<code>dirty()</code>, <code>valid()</code>, validators) already sees the settled value.",
          '• <strong>Contrast with <a href="/advanced-scenarios/advanced-wizard">Advanced Wizard</a>:</strong> that demo\'s auto-save uses an <code>@ngrx/signals</code> <code>rxMethod</code> with RxJS <code>debounceTime</code> at the store level, predating this native rule — this demo is the idiomatic Signal Forms alternative for the same use case.',
        ],
      },
      {
        title: 'Dirty + Valid Gate',
        items: [
          "• <strong>Both conditions, not one:</strong> <code>dirty()</code> alone would resend an already-saved value after every unrelated re-render trigger; <code>valid()</code> alone would happily PATCH a value the user hasn't finished editing.",
          '• <strong>Per field, not per form:</strong> gating each field independently means one invalid field never blocks the other from autosaving.',
        ],
      },
    ],
    nextStep: {
      text: 'Compare with the draft/commit buffer pattern (explicit commit step)',
      link: '/advanced-scenarios/advanced-wizard',
      linkText: 'Advanced Wizard →',
    },
  },
} as const;
