import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProfileFormComponent } from './profile-form/profile-form';

/**
 * Root component for the PrimeNG reference demo.
 *
 * Hosts a single representative form (text + select + checkbox + warnings)
 * built on top of `PrimeFormFieldComponent`. Everything else is intentionally
 * minimal so the wiring between PrimeNG and `@ngx-signal-forms/toolkit` stays
 * front-and-centre — see `apps/demo-primeng/README.md`.
 */
@Component({
  selector: 'ngx-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProfileFormComponent],
  template: `
    <main class="shell">
      <h1>ngx-signal-forms · PrimeNG reference</h1>
      <p class="lede">
        A single representative form built on PrimeNG, wired up through the
        toolkit's renderer-token, control-semantics, and ARIA contracts.
      </p>
      <demo-primeng-profile-form />
    </main>
  `,
})
export class AppComponent {}
