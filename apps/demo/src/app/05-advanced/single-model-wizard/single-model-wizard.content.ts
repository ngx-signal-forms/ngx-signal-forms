export const SINGLE_MODEL_WIZARD_CONTENT = {
  demonstrated: {
    icon: '🧩',
    title: 'Single-Model Wizard',
    sections: [
      {
        title: 'One form(), three steps',
        items: [
          '• <strong>Shared model:</strong> One `form()` spans every step; each step template binds only its own slice (`wizardForm.account…`, `wizardForm.shipping…`)',
          '• <strong>Subtree gating:</strong> A shared `#validateStep` helper marks the step being left as touched and checks its subtree\'s `valid()`/`invalid()` before allowing "Next"; the `ngx-wizard`\'s `canNavigate` guard calls the same helper to gate progress-header clicks',
          "• <strong>Cross-step validation:</strong> Step 2's express-shipping checkbox reads step 1's email with `ctx.valueOf(path.account.email)` — no store, no event, no manual sync",
        ],
      },
      {
        title: 'Why this differs from advanced-wizard',
        items: [
          '• <strong>No per-step commit:</strong> There is nothing to "commit" — every step reads and writes the same model directly',
          '• <strong>Live cross-step values:</strong> The running total and the review step update immediately from data entered on earlier steps',
          '• <strong>Single submit():</strong> Confirming the order calls `submit()` once on the whole form, which re-validates every step, not just the one you are looking at',
        ],
      },
    ],
  },
  learning: {
    title: 'Wizard Patterns',
    sections: [
      {
        title: '🧪 Try This',
        items: [
          '1. Click <strong>Next</strong> on the empty <strong>Account</strong> step → navigation is blocked, "Full name is required" and "Email is required" appear, and focus jumps to the first invalid field',
          '2. Fill in a personal email like <code>you@gmail.com</code> and advance to <strong>Shipping</strong>',
          '3. Fill the address fields and check <strong>Express shipping</strong> → "Express shipping requires a work email address (step 1)" appears, even though the field that is wrong lives on step 1',
          '4. Go back to <strong>Account</strong>, change the email to <code>you@acme.example</code>, return to <strong>Shipping</strong> → the express-shipping error clears itself; no re-entry needed',
          '5. Watch the running total in the status row update live as you check/uncheck express shipping — the same model is read from both steps',
          '6. Reach <strong>Review</strong> and confirm the name, email, address and total shown there are the exact values from steps 1–2 — nothing was copied or committed',
          '7. Click <strong>Confirm order</strong> → `submit()` marks the whole form touched and validates every field, not just the current step, before running the action',
        ],
      },
      {
        title: 'When one model wins',
        items: [
          "• Cross-step rules that read one step's value while validating another's field",
          '• A single point-in-time submit at the end (no independent per-step persistence needed)',
          '• Live derived values (totals, previews) that must reflect every step at once',
        ],
      },
      {
        title: 'When it does not',
        items: [
          '• Steps that must be submittable and persisted independently of each other',
          '• A draft that should survive navigating away and back without a shared model to read from',
          '• See <code>advanced-wizard</code> for the form-per-step + store architecture that covers those cases',
        ],
      },
    ],
    nextStep: {
      text: 'See the form-per-step alternative in',
      link: '/advanced-scenarios/advanced-wizard',
      linkText: 'Advanced Wizard',
    },
  },
} as const;
