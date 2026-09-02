/**
 * i18n Demo Content
 *
 * Educational content for the runtime language switch example.
 */

export const I18N_DEMO_CONTENT = {
  demonstrated: {
    icon: '🌐',
    title: 'Runtime Language Switch',
    sections: [
      {
        title: 'The string-vs-function contract',
        items: [
          '• <strong>String entry:</strong> captured once, at injection — frozen for the lifetime of the injector, never updates on a language switch',
          '• <strong>Function entry:</strong> re-invoked on every render — updates on a language switch <em>only if</em> it reads a reactive signal during that call',
          '• Every entry in this demo\'s <code class="code-inline">provideErrorMessages()</code> and <code class="code-inline">provideFieldLabels()</code> is a function that reads <code class="code-inline">langService.lang()</code> — that is the whole mechanism',
        ],
      },
      {
        title: 'What this demo is not',
        items: [
          '• Not <code class="code-inline">$localize</code> — Angular\'s own i18n is build-time only, one bundle per locale, and cannot switch language without a page reload',
          '• Not tied to any translation library — the toy <code class="code-inline">signal&lt;DemoLang&gt;</code> here stands in for Transloco, ngx-translate, or any reactive language source; the contract is identical either way',
          '• No new dependency was added for this demo',
        ],
      },
    ],
  },
  learning: {
    title: 'Try It',
    sections: [
      {
        title: '🧪 Try This',
        items: [
          '1. Tab into <strong>Full name</strong> and back out empty → the required error appears in English',
          '2. Switch the language switcher to <strong>Nederlands</strong> → the same error re-renders in Dutch, with no reload and no re-submit',
          '3. Type one or two characters into <strong>Full name</strong> → the parameterised <code class="code-inline">minLength</code> message appears (e.g. "Enter at least 3 characters.") — switch language again and watch the number stay correct while the sentence translates',
          '4. Submit the empty form → the error summary lists both fields by their translated labels (from <code class="code-inline">provideFieldLabels()</code>), not the raw <code class="code-inline">fullName</code>/<code class="code-inline">email</code> field paths',
          '5. Switch language again with the summary open → the summary entries relabel in place',
        ],
      },
      {
        title: 'When to use which i18n approach',
        items: [
          '• <strong>Runtime switch (this demo):</strong> the language can change without navigation — an in-app language menu, a user preference toggle. Requires a reactive language source (a library or a bare signal) and function-valued registry entries',
          '• <strong>Build-time i18n (<code class="code-inline">$localize</code>):</strong> language is fixed per deployed bundle — <code class="code-inline">ng build --localize</code>, one build and one <code class="code-inline">subPath</code> per locale. Simpler, but a language change is a navigation to a different bundle, not a state change',
          '• Static string registry entries (<code class="code-inline">provideErrorMessages({ required: \'…\' })</code>) are fine when the app never needs to switch language at runtime — they are frozen at injection either way',
        ],
      },
    ],
    nextStep: {
      text: 'Learn about global toolkit configuration',
      link: '/advanced-scenarios/global-configuration',
      linkText: 'Explore Global Configuration →',
    },
  },
} as const;
