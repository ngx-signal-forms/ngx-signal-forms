export const ROUTED_STEPS_CONTENT = {
  demonstrated: {
    icon: '🧭',
    title: 'Routed Steps',
    sections: [
      {
        title: 'One form(), three child routes',
        items: [
          '• <strong>Form above the outlet:</strong> The parent route provides one <code>form()</code>. Each step route binds only its part of it',
          '• <strong>Toolkit context through the outlet:</strong> <code>[formRoot]</code> and <code>ngxSignalForm</code> are on the <code>&lt;form&gt;</code> around <code>&lt;router-outlet&gt;</code>. The required-field legend in a routed step has no <code>[formTree]</code>: it finds the form through that context',
          '• <strong>Step gate:</strong> A <code>canActivate</code> guard opens a step only when the earlier steps are valid. "Next" on an invalid step marks its fields as touched, so the wrappers show the errors, and <code>focusFirstInvalid()</code> moves focus',
        ],
      },
      {
        title: 'A router error boundary for each step',
        items: [
          '• <strong><code>errorComponent</code>:</strong> When a step throws, the router shows the fallback in the outlet, in place of that step only',
          '• <strong>Nothing to restore:</strong> Values, touched state and errors live in the form, not in the step component. A new instance of the step shows them again',
          "• <strong>Try again:</strong> The fallback runs the same navigation again with <code>onSameUrlNavigation: 'reload'</code>, and the router creates the step again",
        ],
      },
    ],
  },
  learning: {
    title: 'Step Failure Patterns',
    sections: [
      {
        title: 'Try This',
        items: [
          '1. Select <strong>Next</strong> on the empty <strong>Attendee</strong> step → the step stays, the errors show, and focus moves to the first invalid field',
          '2. Fill in the name and an email address, then go to <strong>Time slot</strong>. Choose a time slot and type a note',
          '3. Go <strong>Back</strong>. In the display controls, select <strong>Fail the time slot list</strong>. Go to <strong>Time slot</strong> again → the fallback shows in place of the step',
          '4. Look at the step navigation and the form state panel → both are there, and your entries are unchanged',
          '5. Clear <strong>Fail the time slot list</strong> and select <strong>Try again</strong> → the step comes back with your time slot and your note',
          '6. Go to <strong>Review</strong> and confirm the booking → the submit button in the routed step submits the form above the outlet',
        ],
      },
      {
        title: 'What the boundary catches',
        items: [
          '• Errors from the constructor, the lifecycle hooks and the template of a routed component',
          '• A failed <code>resource()</code>, when the template reads its <code>value()</code>',
          '• Not guards and resolvers: use <code>withNavigationErrorHandler()</code> for those',
        ],
      },
      {
        title: 'Know the limits',
        items: [
          '• Router error boundaries are in developer preview in Angular 22.3',
          '• An error in the fallback goes to the <code>@boundary</code> of the app shell',
          '• The router does not send these errors to <code>ErrorHandler</code>. Log them with the <code>onError</code> option of <code>withErrorBoundaries()</code>',
        ],
      },
    ],
    nextStep: {
      text: 'For steps without routes, see',
      link: '/advanced-scenarios/single-model-wizard',
      linkText: 'Single-Model Wizard',
    },
  },
} as const;
