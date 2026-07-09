/**
 * Server Integration Content
 *
 * Educational content for the server-integration example
 */

export const SERVER_INTEGRATION_CONTENT = {
  demonstrated: {
    icon: '🔄',
    title: 'Server Integration',
    sections: [
      {
        title: 'The real-world edit flow',
        items: [
          '• <strong>Prefill:</strong> <code>resource({ loader })</code> fetches the record; an <code>effect()</code> pushes it into the model signal and calls <code>reset(value)</code>',
          '• <strong>Submit lifecycle:</strong> submit disabled via <code>form().invalid() || form().submitting()</code>; in-flight state visible on the button',
          '• <strong>Server field errors:</strong> the <code>action</code> walks an explicitly-typed key list (not <code>Object.entries</code>, which loses <code>keyof</code> precision) to map a server <code>{ fieldErrors }</code> payload onto <code>TreeValidationResult</code> entries with <code>fieldTree</code> set',
          '• <strong>Server form errors:</strong> a general message with <strong>no</strong> <code>fieldTree</code> lands on the submitted field itself — the form root — and renders as a page-level banner',
          '• <strong>Reset:</strong> after a successful save, <code>reset(value)</code> re-baselines dirty/touched without clearing the fields',
          '• <strong>Reload:</strong> a dedicated button calls <code>resource.reload()</code> to re-fetch and re-prefill on demand',
        ],
      },
      {
        title: 'The TreeValidationResult mechanism',
        items: [
          '• <strong>Native, not toolkit-specific:</strong> <code>submit()</code> accepts any <code>ValidationError</code> (or array of them) returned from <code>action</code> — <code>@angular/forms/signals</code> handles the field mapping itself',
          '• <strong>With <code>fieldTree</code>:</strong> the error attaches to that specific field, so the toolkit wrapper renders it exactly like a client-side validation error',
          '• <strong>Without <code>fieldTree</code>:</strong> the error attaches to the field passed to <code>submit()</code> — here, the form root — because Angular defaults the omitted <code>fieldTree</code> to the submitted field',
          "• <strong>Auto-clear:</strong> submission errors live in a <code>linkedSignal</code> keyed off the target field's own value — so a field error clears the instant that field's value changes, while a root-level error clears on <em>any</em> field edit (because the root's value is the whole model)",
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
          '1. Watch the page load — a "Loading profile from server…" indicator shows while the initial <code>resource()</code> fetch is in flight (~400ms), then the form appears prefilled with <strong>Grace Hopper</strong>.',
          '2. Clear the <strong>Name</strong> field → the submit button disables (<code>form().invalid()</code> is <code>true</code>).',
          '3. Restore a name, change <strong>Email</strong> to <code>taken@example.com</code>, and click <strong>Save profile</strong> → after ~400ms, the button shows <em>Saving…</em>, then two things appear: a red form-level banner ("Please fix the errors below.") and a field-level error under Email ("This email is already taken.") rendered by the normal wrapper.',
          "4. Edit the <strong>Email</strong> field (even by one character) → its field error clears immediately, before you submit again — that's the <code>linkedSignal</code> auto-clear.",
          "5. Instead, edit the <strong>Name</strong> field after a failed submit → the <em>form-level</em> banner clears too, even though you didn't touch Email — because the banner is a root-level error and the root's value changes on any field edit.",
          '6. Change Email to something else and submit → the success banner appears, and the state panel shows <code>dirty(): false</code> immediately (from <code>reset(value)</code>) — the values stay, only the pristine state resets.',
          "7. Click <strong>Reload from server</strong> → the button reads <em>Reloading…</em>, then the form re-populates from the fake API's in-memory record (whatever you last successfully saved).",
        ],
      },
      {
        title: 'Prefill Pattern',
        items: [
          '• <strong>resource() over manual fetch:</strong> <code>resource({ loader })</code> gives you <code>isLoading()</code>/<code>value()</code>/<code>reload()</code> without hand-rolled state.',
          '• <strong>effect() bridges resource → form:</strong> the form model is a plain <code>signal()</code> so it can also be written to by user edits; an <code>effect()</code> copies each resolved resource value into it.',
          '• <strong><code>reset(value)</code> on load:</strong> prevents a freshly loaded record from reading as "dirty" or "touched" before the user has done anything.',
        ],
      },
      {
        title: 'Server Error Mapping',
        items: [
          '• <strong>Shape the payload once:</strong> <code>{ fieldErrors: Record&lt;field, message&gt;, formError: string }</code> is a common REST validation-error shape; walk it with a statically-typed key list rather than hand-coding one branch per field.',
          '• <strong>fieldTree is the whole trick:</strong> set it to route an error to a field; omit it to attach the error to whatever field you called <code>submit()</code> on.',
          "• <strong>No custom toolkit API:</strong> the toolkit wrapper already renders any error on a field's <code>errors()</code> signal — server errors need no special-case UI.",
        ],
      },
    ],
    nextStep: {
      text: 'Compare with client-only server error handling (checkbox-triggered)',
      link: '/advanced-scenarios/submission-patterns',
      linkText: 'Submission Patterns →',
    },
  },
} as const;
