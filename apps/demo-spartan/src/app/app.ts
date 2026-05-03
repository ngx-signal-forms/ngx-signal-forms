import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AccountPreferencesForm } from './form/account-preferences-form';

@Component({
  selector: 'ngx-spartan-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccountPreferencesForm],
  template: `
    <main class="shell">
      <h1 class="shell__title">ngx-signal-forms × Spartan Components</h1>
      <p class="shell__subtitle">
        Reference wrapper composing the toolkit's renderer / hint / context seam
        with Spartan's <code>brnField</code> host directive.
      </p>

      <section class="shell__panel" aria-labelledby="account-preferences-title">
        <h2 id="account-preferences-title" class="shell__panel-title">
          Account preferences
        </h2>
        <p class="shell__panel-description">
          Text input, select, and checkbox using the
          <code>spartan-form-field</code> wrapper. The
          <code>displayName</code> field exercises the warning slot.
        </p>
        <ngx-account-preferences-form />
      </section>
    </main>
  `,
})
export class App {}
